import { db } from "@/database";
import { users, swipeLogs, campusCards, wifiLogs, devices, roomBookings, libraryCheckouts } from "@/database/schema";
import { sql, desc, gte, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        const recentSwipes = db.select({ userId: campusCards.userId }).from(swipeLogs).innerJoin(campusCards, eq(swipeLogs.cardId, campusCards.id)).where(gte(swipeLogs.timestamp, twelveHoursAgo));
        const recentWifi = db.select({ userId: devices.userId }).from(wifiLogs).innerJoin(devices, eq(wifiLogs.deviceHash, devices.deviceHash)).where(gte(wifiLogs.timestamp, twelveHoursAgo));
        const recentBookings = db.select({ userId: roomBookings.userId }).from(roomBookings).where(gte(roomBookings.startTime, twelveHoursAgo));
        const recentCheckouts = db.select({ userId: libraryCheckouts.userId }).from(libraryCheckouts).where(gte(libraryCheckouts.checkoutTime, twelveHoursAgo));

        const activeUserIdsQuery = db.select({ id: sql`id` }).from(recentSwipes.union(recentWifi).union(recentBookings).union(recentCheckouts).as('active_users'));

        const inactiveUsers = await db.query.users.findMany({
            where: sql`id NOT IN ${activeUserIdsQuery}`,
        });

        if (inactiveUsers.length === 0) {
            return NextResponse.json({ alerts: [] });
        }
        const inactiveUserIds = inactiveUsers.map(u => u.id);

        const lastSwipes = await db.query.swipeLogs.findMany({
            where: inArray(sql`${campusCards.userId}`, inactiveUserIds),
            with: { card: true, location: true },
            orderBy: [desc(swipeLogs.timestamp)],
        });
        const lastWifis = await db.query.wifiLogs.findMany({
            where: inArray(sql`${devices.userId}`, inactiveUserIds),
            with: { device: true, accessPoint: true },
            orderBy: [desc(wifiLogs.timestamp)],
        });

        const lastSwipeMap = new Map();
        for (const s of lastSwipes) {
            if (s.card?.userId && !lastSwipeMap.has(s.card.userId)) {
                lastSwipeMap.set(s.card.userId, s);
            }
        }
        const lastWifiMap = new Map();
        for (const w of lastWifis) {
            if (w.device?.userId && !lastWifiMap.has(w.device.userId)) {
                lastWifiMap.set(w.device.userId, w);
            }
        }
        
        const alerts = inactiveUsers.map(user => {
            const lastSwipe = lastSwipeMap.get(user.id);
            const lastWifi = lastWifiMap.get(user.id);

            let lastEvent = { timestamp: new Date(0), details: 'No activity found' };
            if (lastSwipe && lastSwipe.timestamp > lastEvent.timestamp) {
                lastEvent = { timestamp: lastSwipe.timestamp, details: `Last seen at ${lastSwipe.location?.name || 'an unknown location'}` };
            }
            if (lastWifi && lastWifi.timestamp > lastEvent.timestamp) {
                lastEvent = { timestamp: lastWifi.timestamp, details: `Last connected to AP ${lastWifi.accessPoint?.name || 'an unknown AP'}` };
            }

            return {
                user: { id: user.id, fullName: user.fullName, externalId: user.externalId },
                lastSeen: lastEvent.timestamp.toISOString(),
                lastLocation: lastEvent.details,
                alertType: 'Inactivity',
                severity: 'Warning'
            };
        });
        
        alerts.sort((a, b) => new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime());

        return NextResponse.json({ alerts });

    } catch (error) {
        console.error("Alert generation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}