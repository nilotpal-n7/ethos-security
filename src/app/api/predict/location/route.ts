import { db } from "@/database";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
const PYTHON_API_URL = process.env.PYTHON_LOCATION_API_URL || "http://127.0.0.1:5002";

export async function POST(req: NextRequest) {
    const { userId, startTime, endTime, locationBefore, locationAfter } = await req.json();

    if (!userId || !startTime || !endTime) {
        return NextResponse.json({ error: "Missing required parameters: userId, startTime, and endTime are required." }, { status: 400 });
    }

    try {
        // --- 1. GATHER ALL RAW DATA NEEDED BY THE PYTHON SERVICE ---

        const allLocations = await db.query.locations.findMany();
        const userActivity = await db.query.users.findFirst({
            where: eq(users.id, userId),
            with: {
                campusCards: { with: { swipeLogs: true } },
                devices: { with: { wifiLogs: true } },
                roomBookings: true,
            }
        });

        if (!userActivity) {
            throw new Error("User not found");
        }

        const historicalActivity: { locationId: number | null, timestamp: Date }[] = [];
        userActivity.campusCards.forEach(c => c.swipeLogs.forEach(l => { if (l.locationId && l.timestamp) historicalActivity.push({ locationId: l.locationId, timestamp: l.timestamp }) }));
        userActivity.devices.forEach(d => d.wifiLogs.forEach(l => { if (l.accessPointId && l.timestamp) historicalActivity.push({ locationId: l.accessPointId, timestamp: l.timestamp }) }));
        userActivity.roomBookings.forEach(b => { if (b.locationId && b.startTime) historicalActivity.push({ locationId: b.locationId, timestamp: b.startTime }) });

        // --- 2. CALL THE PYTHON API WITH THE RAW DATA ---
        const pythonResponse = await fetch(`${PYTHON_API_URL}/predict/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                startTime,
                endTime,
                allLocations,
                historicalActivity,
                locationBefore,
                locationAfter,
            }),
        });

        if (!pythonResponse.ok) {
            throw new Error(`Python Location API Error: ${await pythonResponse.text()}`);
        }

        // --- 3. FORWARD THE PYTHON API's RESPONSE DIRECTLY TO THE FRONTEND ---
        const prediction = await pythonResponse.json();
        
        return NextResponse.json(prediction);

    } catch (error) {
        console.error("Location prediction bridge API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
