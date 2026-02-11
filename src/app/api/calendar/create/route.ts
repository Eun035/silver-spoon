import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

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

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: session.accessToken });
        const calendar = google.calendar({ version: "v3", auth });

        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary: draft.title,
                location: draft.location,
                start: { dateTime: draft.startISO },
                end: { dateTime: draft.endISO },
            },
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
