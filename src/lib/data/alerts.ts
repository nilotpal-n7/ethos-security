// src/lib/data/alerts.ts

import { db } from "@/database";
import { users, swipeLogs, campusCards, wifiLogs, devices, roomBookings, libraryCheckouts, locations } from "@/database/schema";
import { sql, asc, eq, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// Define the shape of our alert data for type safety
type Alert = {
    user: { id: number; fullName: string | null; externalId: string | null; };
    lastSeen: string;
    lastLocation: string;
    alertType: string;
    severity: string;
};

export async function getInactivityAlertsData(): Promise<Alert[]> {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const swipeLocation = alias(locations, 'swipeLocation');
    const wifiLocation = alias(locations, 'wifiLocation');

    // Create a CTE that gathers and unifies all user activities
    const allEvents = db
        .select({
            userId: campusCards.userId,
            timestamp: swipeLogs.timestamp,
            details: sql<string>`'Last seen at ' || ${swipeLocation.name}`.as('details') // 👈 FIX
        }).from(swipeLogs)
        .innerJoin(campusCards, eq(swipeLogs.cardId, campusCards.id))
        .innerJoin(swipeLocation, eq(swipeLogs.locationId, swipeLocation.id))
        .where(sql`${campusCards.userId} IS NOT NULL`)
        .unionAll(
            db.select({
                userId: devices.userId,
                timestamp: wifiLogs.timestamp,
                details: sql<string>`'Last connected to AP ' || ${wifiLocation.name}`.as('details') // 👈 FIX
            }).from(wifiLogs)
            .innerJoin(devices, eq(wifiLogs.deviceHash, devices.deviceHash))
            .innerJoin(wifiLocation, eq(wifiLogs.accessPointId, wifiLocation.id))
        )
        .unionAll(
            db.select({
                userId: roomBookings.userId,
                timestamp: roomBookings.startTime,
                details: sql<string>`'Booked a room'`.as('details') // 👈 FIX
            }).from(roomBookings)
        )
        .unionAll(
            db.select({
                userId: libraryCheckouts.userId,
                timestamp: libraryCheckouts.checkoutTime,
                details: sql<string>`'Checked out a library asset'`.as('details') // 👈 FIX
            }).from(libraryCheckouts)
        )
        .as('all_events');

    // The rest of your code remains exactly the same...
    const rankedEvents = db
        .select({
            userId: allEvents.userId,
            timestamp: allEvents.timestamp,
            details: allEvents.details,
            rowNumber: sql<number>`ROW_NUMBER() OVER(PARTITION BY ${allEvents.userId} ORDER BY ${allEvents.timestamp} DESC)`.as('rn')
        })
        .from(allEvents)
        .as('ranked_events');

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
            eq(rankedEvents.rowNumber, 1),
            sql`${rankedEvents.timestamp} < ${twelveHoursAgo}`
        ))
        .orderBy(asc(rankedEvents.timestamp));

    const alerts: Alert[] = inactiveUsersData.map(data => ({
        user: data.user,
        lastSeen: data.lastSeen.toISOString(),
        lastLocation: data.lastLocation || 'No activity details found',
        alertType: 'Inactivity',
        severity: 'Warning'
    }));

    return alerts;
}