import { db } from "@/database/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const userId = parseInt(params.userId, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const page = parseInt(req.nextUrl.searchParams.get("page") || "0", 10);
  const PAGE_SIZE = 20;

  // --- NEW: Read the 'from' and 'to' date parameters from the URL ---
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  try {
    // --- MODIFIED: The query now includes 'where' clauses to filter by date ---
    const userActivity = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      with: {
        campusCards: {
          with: {
            swipeLogs: {
              with: { location: true },
              // Filter swipe logs within the date range
              where: (logs, { and, gte, lte }) => and(
                from ? gte(logs.timestamp, new Date(from)) : undefined,
                to ? lte(logs.timestamp, new Date(to)) : undefined
              ),
            },
          },
        },
        devices: {
          with: {
            wifiLogs: {
              with: { accessPoint: true },
              // Filter wifi logs within the date range
              where: (logs, { and, gte, lte }) => and(
                from ? gte(logs.timestamp, new Date(from)) : undefined,
                to ? lte(logs.timestamp, new Date(to)) : undefined
              ),
            },
          },
        },
        roomBookings: {
          with: { location: true },
          // Filter room bookings within the date range
          where: (bookings, { and, gte, lte }) => and(
            from ? gte(bookings.startTime, new Date(from)) : undefined,
            to ? lte(bookings.startTime, new Date(to)) : undefined // Filter by start time
          ),
        },
        libraryCheckouts: {
          with: { asset: true },
          // Filter library checkouts within the date range
          where: (checkouts, { and, gte, lte }) => and(
            from ? gte(checkouts.checkoutTime, new Date(from)) : undefined,
            to ? lte(checkouts.checkoutTime, new Date(to)) : undefined
          ),
        },
        helpdeskTickets: {
          // Filter helpdesk tickets within the date range
          where: (tickets, { and, gte, lte }) => and(
            from ? gte(tickets.createdAt, new Date(from)) : undefined,
            to ? lte(tickets.createdAt, new Date(to)) : undefined
          ),
        },
      },
    });

    if (!userActivity) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // --- The rest of the logic remains the same ---
    // It now operates on the pre-filtered data from the database

    const timeline: any[] = [];

    userActivity.campusCards.forEach(card => {
        card.swipeLogs.forEach(log => {
            if (log.location) {
                timeline.push({
                    type: 'Card Swipe',
                    timestamp: log.timestamp,
                    details: `Swiped at ${log.location.name}`,
                    location: log.location
                });
            }
        });
    });

    userActivity.devices.forEach(device => {
        device.wifiLogs.forEach(log => {
            if (log.accessPoint) {
                timeline.push({
                    type: 'Wi-Fi Connection',
                    timestamp: log.timestamp,
                    details: `Connected to AP ${log.accessPoint.name}`,
                    location: log.accessPoint
                });
            }
        });
    });

    userActivity.roomBookings.forEach(booking => {
        if (booking.location) {
            timeline.push({
                type: 'Room Booking',
                timestamp: booking.startTime,
                details: `Booked '${booking.location.name}' from ${new Date(booking.startTime).toLocaleTimeString()} to ${new Date(booking.endTime).toLocaleTimeString()}`,
                location: booking.location
            });
        }
    });

     userActivity.libraryCheckouts.forEach(checkout => {
        if (checkout.asset) {
            timeline.push({
                type: 'Library Checkout',
                timestamp: checkout.checkoutTime,
                details: `Checked out "${checkout.asset.title}"`,
                location: null
            });
        }
    });

    userActivity.helpdeskTickets.forEach(ticket => {
        timeline.push({
            type: 'Helpdesk Ticket',
            timestamp: ticket.createdAt,
            details: `Created ticket: "${ticket.title}"`,
            location: null
        });
    });

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const paginatedTimeline = timeline.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return NextResponse.json({ timeline: paginatedTimeline });
    
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}