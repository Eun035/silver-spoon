import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCalendarClient } from "@/services/calendarClient";

export async function POST(req: NextRequest) {
    const session = (await getServerSession(authOptions)) as any;

    if (!session || !session.accessToken) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { startISO, endISO } = await req.json();

        if (!startISO || !endISO) {
            return NextResponse.json({ message: "Missing time range" }, { status: 400 });
        }

        const calendar = getCalendarClient(session.accessToken);
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: startISO,
            timeMax: endISO,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = response.data.items || [];

        // Filter out events that only touch the boundary (e.g., event ends exactly when the new one starts)
        const conflicts = events.filter(e => {
            if (!e.start?.dateTime || !e.end?.dateTime) return false;
            const eStart = new Date(e.start.dateTime).getTime();
            const eEnd = new Date(e.end.dateTime).getTime();
            const qStart = new Date(startISO).getTime();
            const qEnd = new Date(endISO).getTime();

            // Overlap condition: eStart < qEnd && eEnd > qStart
            return eStart < qEnd && eEnd > qStart;
        });

        return NextResponse.json({
            conflicts: conflicts.map(e => ({
                title: e.summary,
                start: e.start?.dateTime,
                end: e.end?.dateTime
            }))
        });
    } catch (error: any) {
        console.error("Conflict Check Error:", error);
        return NextResponse.json({ message: "Failed to check conflicts" }, { status: 500 });
    }
}
