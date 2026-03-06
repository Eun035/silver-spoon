import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getCalendarClient } from "@/services/calendarClient";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function GET(req: NextRequest) {
    const session = (await getServerSession(authOptions)) as any;

    if (!session || !session.accessToken) {
        return NextResponse.json(
            { message: "로그인이 만료됐어요. 다시 로그인해주세요." },
            { status: 401 }
        );
    }

    try {
        const calendar = getCalendarClient(session.accessToken);
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 30); // 30일(약 1개월) 이내 일정만 조회

        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            timeMax: timeMax.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = response.data.items?.map((event) => {
            let reminders: number[] = [];
            if (event.reminders?.useDefault) {
                // 구글 캘린더 기본 알림이 보통 30분 전
                reminders = [30];
            } else if (event.reminders?.overrides) {
                reminders = event.reminders.overrides.map(o => o.minutes || 0);
            }

            return {
                id: event.id,
                summary: event.summary,
                start: event.start,
                end: event.end,
                location: event.location,
                htmlLink: event.htmlLink,
                colorId: event.colorId,
                reminders: reminders,
            };
        }) || [];

        return NextResponse.json(events);
    } catch (error: any) {
        console.error("Calendar API Error:", error);
        const status = error.code || 500;
        const message = error.errors?.[0]?.message || error.message || "일정을 가져오는 중 문제가 발생했습니다.";
        return NextResponse.json(
            { message },
            { status }
        );
    }
}
