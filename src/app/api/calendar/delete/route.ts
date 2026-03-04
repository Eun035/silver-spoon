import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCalendarClient } from "@/services/calendarClient";

export async function DELETE(req: NextRequest) {
    const session = (await getServerSession(authOptions)) as any;

    if (!session || !session.accessToken) {
        return NextResponse.json(
            { message: "로그인이 만료됐어요. 다시 로그인해주세요." },
            { status: 401 }
        );
    }

    try {
        const { eventId } = await req.json();

        if (!eventId) {
            return NextResponse.json(
                { message: "일정 ID가 필요합니다." },
                { status: 400 }
            );
        }

        const calendar = getCalendarClient(session.accessToken);

        await calendar.events.delete({
            calendarId: "primary",
            eventId,
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("Delete Event Error:", error);
        return NextResponse.json(
            { message: "일정을 삭제하지 못했어요. 다시 시도해주세요." },
            { status: 500 }
        );
    }
}
