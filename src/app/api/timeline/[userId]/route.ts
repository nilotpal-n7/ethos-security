import { db } from "@/database/index";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const userId = parseInt(params.userId, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const userActivity = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      with: {
        campusCards: {
            with: { swipeLogs: { with: { location: true } } }
        },
        devices: {
            with: { wifiLogs: { with: { accessPoint: true } } }
        },
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
                    details: `Swiped at ${log.location.name}`
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
                    details: `Connected to AP ${log.accessPoint.name}`
                });
            }
        });
    });

    userActivity.roomBookings.forEach(booking => {
        timeline.push({
            type: 'Room Booking',
            timestamp: booking.startTime,
            details: `Booked '${booking.location.name}' from ${booking.startTime.toLocaleTimeString()} to ${booking.endTime.toLocaleTimeString()}`
        });
    });

     userActivity.libraryCheckouts.forEach(checkout => {
        timeline.push({
            type: 'Library Checkout',
            timestamp: checkout.checkoutTime,
            details: `Checked out "${checkout.asset.title}"`
        });
    });

    userActivity.helpdeskTickets.forEach(ticket => {
        timeline.push({
            type: 'Helpdesk Ticket',
            timestamp: ticket.createdAt,
            details: `Created ticket: "${ticket.description}"`
        });
    });

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json({ user: userActivity.fullName, timeline });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
