import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCalendarClient } from "@/services/calendarClient";

export async function POST(req: NextRequest) {
    const session = (await getServerSession(authOptions)) as any;

    if (!session || !session.accessToken) {
        return NextResponse.json(
            { message: "로그인이 만료됐어요. 다시 로그인해주세요." },
            { status: 401 }
        );
    }

    try {
        const { draft } = await req.json();

        if (!draft || !draft.title || !draft.startISO || !draft.endISO) {
            return NextResponse.json(
                { message: "일정 정보가 부족합니다." },
                { status: 400 }
            );
        }

        const calendar = getCalendarClient(session.accessToken);

        const requestBody: any = {
            summary: draft.title,
            location: draft.location,
            start: { dateTime: draft.startISO },
            end: { dateTime: draft.endISO },
        };

        if (draft.colorId) {
            requestBody.colorId = draft.colorId;
        }

        if (draft.attendees && draft.attendees.length > 0) {
            requestBody.attendees = draft.attendees;
        }

        if (draft.reminders && draft.reminders.length > 0) {
            requestBody.reminders = {
                useDefault: false,
                overrides: draft.reminders.map((minutes: number) => ({ method: "popup", minutes })),
            };
        } else if (draft.reminders && draft.reminders.length === 0) {
            requestBody.reminders = {
                useDefault: false,
                overrides: [],
            };
        }

        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody,
        });

        return NextResponse.json({
            id: response.data.id,
            htmlLink: response.data.htmlLink,
        });
    } catch (error: any) {
        console.error("Create Event Error:", error);
        return NextResponse.json(
            { message: "캘린더에 저장하지 못했어요. 다시 시도해주세요." },
            { status: 500 }
        );
    }
}
