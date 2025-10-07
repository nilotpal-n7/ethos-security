import { db } from "@/database";
import { campusCards, devices, roomBookings, swipeLogs, users, wifiLogs, locations, facialProfiles, cctvFrameLogs } from "@/database/schema";
import { and, eq, gte, inArray, lte, ne, or, asc, notInArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:5001";
const TIME_WINDOW_MINUTES = 3;

export async function POST(req: NextRequest) {
    const { type, id } = await req.json();
    if (type !== 'card' || !id) {
        return NextResponse.json({ error: "Request must be for type 'card' with an 'id'" }, { status: 400 });
    }

    try {
        // 1. Fetch anchor events (all swipes for the unowned card) and the full pool of potential candidates
        const anchorSwipes = await db.query.swipeLogs.findMany({ where: eq(swipeLogs.cardId, id), with: { location: true }, orderBy: [asc(swipeLogs.timestamp)] });
        if (anchorSwipes.length === 0) return NextResponse.json({ predictions: [] });
        
        const allUsers = await db.query.users.findMany();
        if (allUsers.length === 0) return NextResponse.json({ predictions: [] });

        // --- 2. BULK DATA FETCHING ---
        // This strategy is highly performant and avoids the "query tsunami" / timeout error.
        const timeWindows = anchorSwipes.map(s => ({ start: new Date(s.timestamp!.getTime() - TIME_WINDOW_MINUTES * 60 * 1000), end: new Date(s.timestamp!.getTime() + TIME_WINDOW_MINUTES * 60 * 1000) }));
        const locationIds = anchorSwipes.map(s => s.locationId).filter(Boolean) as number[];

        // Fetch all potentially relevant evidence in a few efficient, bulk queries.
        const allWifiEvidence = locationIds.length > 0 ? await db.query.wifiLogs.findMany({ where: or(...timeWindows.map(tw => and(inArray(wifiLogs.accessPointId, locationIds), gte(wifiLogs.timestamp, tw.start), lte(wifiLogs.timestamp, tw.end)))), with: { device: true }}) : [];
        const allBookingEvidence = locationIds.length > 0 ? await db.query.roomBookings.findMany({ where: or(...anchorSwipes.map(s => and(inArray(roomBookings.locationId, locationIds), lte(roomBookings.startTime, s.timestamp!), gte(roomBookings.endTime, s.timestamp!))))}) : [];
        const allAlibiEvidence = locationIds.length > 0 ? await db.query.swipeLogs.findMany({ where: or(...timeWindows.map(tw => and(notInArray(swipeLogs.locationId, locationIds), gte(swipeLogs.timestamp, tw.start), lte(swipeLogs.timestamp, tw.end)))), with: { card: true }}) : [];
        const allCctvEvidence = locationIds.length > 0 ? await db.query.cctvFrameLogs.findMany({ where: or(...timeWindows.map(tw => and(inArray(cctvFrameLogs.locationId, locationIds), gte(cctvFrameLogs.timestamp, tw.start), lte(cctvFrameLogs.timestamp, tw.end))))}) : [];
        // Select ONLY the columns you need, avoiding the large 'embedding' data
        const faceProfiles = await db.select({
            userId: facialProfiles.userId,
            id: facialProfiles.id
        }).from(facialProfiles);
        
        const userToFaceMap = Object.fromEntries(faceProfiles.map(fp => [fp.userId, fp.id]));


        // --- 3. SEND RAW DATA TO PYTHON API ---
        // This payload now matches the exact, complete structure the Python API expects.
        const pythonResponse = await fetch(`${PYTHON_API_URL}/predict/owner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                anchorEvents: anchorSwipes,
                candidateUsers: allUsers,
                allEvidence: {
                    wifiLogs: allWifiEvidence,
                    bookings: allBookingEvidence,
                    alibiSwipes: allAlibiEvidence,
                    cctvFrames: allCctvEvidence,
                    user_to_face_map: userToFaceMap,
                },
            }),
        });

        if (!pythonResponse.ok) {
            throw new Error(`Python API Error: ${await pythonResponse.text()}`);
        }
        
        // 4. FORWARD THE PYTHON API'S FINAL, ENRICHED RESPONSE DIRECTLY TO THE FRONTEND
        const finalPredictions = await pythonResponse.json();
        
        return NextResponse.json(finalPredictions);

    } catch (error) {
        console.error("Bridge API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
