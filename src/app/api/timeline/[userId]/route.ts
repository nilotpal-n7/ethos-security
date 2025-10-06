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

  try {
    const userActivity = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      with: {
        campusCards: { with: { swipeLogs: { with: { location: true } } } },
        devices: { with: { wifiLogs: { with: { accessPoint: true } } } },
        roomBookings: { with: { location: true } },
        libraryCheckouts: { with: { asset: true } },
        helpdeskTickets: { orderBy: (tickets, { desc }) => [desc(tickets.createdAt)] }
      },
    });

    if (!userActivity) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const timeline: any[] = [];

    userActivity.campusCards.forEach(card => {
        card.swipeLogs.forEach(log => {
            if (log.location) {
                timeline.push({
                    type: 'Card Swipe',
                    timestamp: log.timestamp,
                    details: `Swiped at ${log.location.name}`,
                    location: log.location // **THE FIX: Include the full location object**
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
                    location: log.accessPoint // **THE FIX: Include the full location object**
                });
            }
        });
    });

    userActivity.roomBookings.forEach(booking => {
        if (booking.location) {
            timeline.push({
                type: 'Room Booking',
                timestamp: booking.startTime,
                details: `Booked '${booking.location.name}' from ${booking.startTime.toLocaleTimeString()} to ${booking.endTime.toLocaleTimeString()}`,
                location: booking.location // **THE FIX: Include the full location object**
            });
        }
    });

     userActivity.libraryCheckouts.forEach(checkout => {
        if (checkout.asset) {
            timeline.push({
                type: 'Library Checkout',
                timestamp: checkout.checkoutTime,
                details: `Checked out "${checkout.asset.title}"`,
                location: null // Library checkouts don't have a specific location in this context
            });
        }
    });

    userActivity.helpdeskTickets.forEach(ticket => {
        timeline.push({
            type: 'Helpdesk Ticket',
            timestamp: ticket.createdAt,
            details: `Created ticket: "${ticket.description}"`,
            location: null // Helpdesk tickets don't have a specific location
        });
    });

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const paginatedTimeline = timeline.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return NextResponse.json({ user: userActivity.fullName, timeline: paginatedTimeline });
    
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}