import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCalendarClient } from "@/services/calendarClient";

export async function PATCH(req: NextRequest) {
    const session = (await getServerSession(authOptions)) as any;

    if (!session || !session.accessToken) {
        return NextResponse.json(
            { message: "로그인이 만료됐어요. 다시 로그인해주세요." },
            { status: 401 }
        );
    }

    try {
        const { eventId, patch } = await req.json();

        if (!eventId || !patch) {
            return NextResponse.json(
                { message: "필요한 정보가 누락되었습니다." },
                { status: 400 }
            );
        }

        const calendar = getCalendarClient(session.accessToken);

        const requestBody: any = {};
        if (patch.title) requestBody.summary = patch.title;
        if (patch.location !== undefined) requestBody.location = patch.location;
        if (patch.startISO) requestBody.start = { dateTime: patch.startISO };
        if (patch.endISO) requestBody.end = { dateTime: patch.endISO };

        if (patch.reminders && patch.reminders.length > 0) {
            requestBody.reminders = {
                useDefault: false,
                overrides: patch.reminders.map((minutes: number) => ({ method: "popup", minutes })),
            };
        } else if (patch.reminders && patch.reminders.length === 0) {
            requestBody.reminders = {
                useDefault: false,
                overrides: [],
            };
        }

        const response = await calendar.events.patch({
            calendarId: "primary",
            eventId,
            requestBody,
        });

        return NextResponse.json({
            id: response.data.id,
            htmlLink: response.data.htmlLink,
        });
    } catch (error: any) {
        console.error("Update Event Error:", error);
        return NextResponse.json(
            { message: "일정을 수정하지 못했어요. 다시 시도해주세요." },
            { status: 500 }
        );
    }
}
