import { db } from "@/database";
import { users, swipeLogs, campusCards, wifiLogs, devices, roomBookings, libraryCheckouts, locations } from "@/database/schema";
import { sql, asc, eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { alias } from "drizzle-orm/pg-core";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        // Define aliases for locations to be used in different joins
        const swipeLocation = alias(locations, 'swipeLocation');
        const wifiLocation = alias(locations, 'wifiLocation');

        // 1. Create a CTE that gathers and unifies all user activities from different tables
        const allEvents = db
            .select({
                userId: campusCards.userId,
                timestamp: swipeLogs.timestamp,
                details: sql<string>`'Last seen at ' || ${swipeLocation.name}`
            }).from(swipeLogs)
            .innerJoin(campusCards, eq(swipeLogs.cardId, campusCards.id))
            .innerJoin(swipeLocation, eq(swipeLogs.locationId, swipeLocation.id))
            .where(sql`${campusCards.userId} IS NOT NULL`)
            .unionAll(
                db.select({
                    userId: devices.userId,
                    timestamp: wifiLogs.timestamp,
                    details: sql<string>`'Last connected to AP ' || ${wifiLocation.name}`
                }).from(wifiLogs)
                .innerJoin(devices, eq(wifiLogs.deviceHash, devices.deviceHash))
                .innerJoin(wifiLocation, eq(wifiLogs.accessPointId, wifiLocation.id))
            )
            .unionAll(
                db.select({
                    userId: roomBookings.userId,
                    timestamp: roomBookings.startTime,
                    details: sql<string>`'Booked a room'`
                }).from(roomBookings)
            )
            .unionAll(
                db.select({
                    userId: libraryCheckouts.userId,
                    timestamp: libraryCheckouts.checkoutTime,
                    details: sql<string>`'Checked out a library asset'`
                }).from(libraryCheckouts)
            )
            .as('all_events');

        // 2. Create a second CTE to find the most recent event for each user
        const rankedEvents = db
            .select({
                userId: allEvents.userId,
                timestamp: allEvents.timestamp,
                details: allEvents.details,
                rowNumber: sql<number>`ROW_NUMBER() OVER(PARTITION BY ${allEvents.userId} ORDER BY ${allEvents.timestamp} DESC)`.as('rn')
            })
            .from(allEvents)
            .as('ranked_events');

        // 3. Final query: Select the latest event (where rowNumber = 1) for each user
        //    and filter for those whose last event was more than 12 hours ago.
        const inactiveUsersData = await db
            .select({
                user: {
                    id: users.id,
                    fullName: users.fullName,
                    externalId: users.externalId,
                },
                lastSeen: rankedEvents.timestamp,
                lastLocation: rankedEvents.details,
            })
            .from(rankedEvents)
            .innerJoin(users, eq(rankedEvents.userId, users.id))
            .where(and(
                eq(rankedEvents.rowNumber, 1), // Only get the most recent event for each user
                sql`${rankedEvents.timestamp} < ${twelveHoursAgo}` // Filter for inactivity
            ))
            .orderBy(asc(rankedEvents.timestamp)); // Sort by lastSeen ascending (most inactive first)

        // 4. Map the results to the final alert format
        const alerts = inactiveUsersData.map(data => ({
            user: data.user,
            lastSeen: data.lastSeen.toISOString(),
            lastLocation: data.lastLocation || 'No activity details found',
            alertType: 'Inactivity',
            severity: 'Warning'
        }));

        return NextResponse.json({ alerts });

    } catch (error) {
        console.error("Alert generation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}