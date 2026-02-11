export interface EventDraft {
    title: string;
    startISO: string;
    endISO: string;
    location?: string;
}

export function parseToDraft(
    input: string,
    now: Date = new Date(),
    tz: string = "Asia/Seoul"
): { draft?: EventDraft; error?: string } {
    if (!input.trim()) return { error: "입력된 내용이 없습니다." };

    let title = input;
    let date = new Date(now);
    let hasDate = false;
    let hasTime = false;
    let durationMinutes = 60;
    let location = "";

    // 1. 장소 추출 (@장소 또는 장소 ... )
    const locationMatch = input.match(/장소\s+([^\s]+)|@([^\s]+)/);
    if (locationMatch) {
        location = locationMatch[1] || locationMatch[2];
        title = title.replace(locationMatch[0], "");
    }

    // 2. 날짜 추출
    if (input.includes("오늘")) {
        hasDate = true;
    } else if (input.includes("내일")) {
        date.setDate(date.getDate() + 1);
        hasDate = true;
    } else if (input.includes("모레")) {
        date.setDate(date.getDate() + 2);
        hasDate = true;
    }

    // 요일 추출 (이번 주 토요일, 다음 주 월요일 등)
    const dayMap: { [key: string]: number } = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
    const weekdayMatch = input.match(/(이번\s*주|다음\s*주|다다음\s*주)?\s*(월|화|수|목|금|토|일)요일/);
    if (weekdayMatch) {
        const weekModifier = weekdayMatch[1] || "";
        const targetDay = dayMap[weekdayMatch[2]];
        const currentDay = date.getDay();

        let daysToAdd = targetDay - currentDay;
        if (weekModifier.includes("다음")) daysToAdd += 7;
        if (weekModifier.includes("다다음")) daysToAdd += 14;

        // "이번 주"인데 이미 지난 요일이면 다음주로 넘기지 않고 이번주 과거로 가거나, 미래의 해당 요일로 설정
        // 보통 "이번 주 토요일"은 다가올 토요일을 의미함
        if (daysToAdd <= 0 && weekModifier.includes("이번")) daysToAdd += 7;

        date.setDate(date.getDate() + daysToAdd);
        hasDate = true;
        title = title.replace(weekdayMatch[0], "");
    }

    // M/D 형식 (예: 2/20)
    const mdMatch = input.match(/(\d{1,2})\/(\d{1,2})/);
    if (mdMatch) {
        date.setMonth(parseInt(mdMatch[1]) - 1);
        date.setDate(parseInt(mdMatch[2]));
        hasDate = true;
        title = title.replace(mdMatch[0], "");
    }

    // YYYY-MM-DD 형식
    const isoDateMatch = input.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateMatch) {
        date.setFullYear(parseInt(isoDateMatch[1]));
        date.setMonth(parseInt(isoDateMatch[2]) - 1);
        date.setDate(parseInt(isoDateMatch[3]));
        hasDate = true;
        title = title.replace(isoDateMatch[0], "");
    }

    // 3. 시간 추출
    let hours = 9; // 기본값
    let minutes = 0;

    const timeKeywordMatch = input.match(/(새벽|아침|오전|점심|오후|저녁|밤)\s*(\d{1,2})시(?:\s*(\d{1,2})분|반)?/);
    if (timeKeywordMatch) {
        const keyword = timeKeywordMatch[1];
        hours = parseInt(timeKeywordMatch[2]);

        // PM 처리 키워드
        const isPM = ["점심", "오후", "저녁", "밤"].includes(keyword);
        if (isPM && hours < 12) {
            // 12시는 점심/오후일 때 그대로 12시, 그 외엔 +12
            if (hours !== 12) hours += 12;
        } else if (!isPM && hours === 12) {
            // 새벽/아침/오전 12시는 0시
            hours = 0;
        }

        if (timeKeywordMatch[3]) {
            minutes = parseInt(timeKeywordMatch[3]);
        } else if (input.includes(timeKeywordMatch[0].includes("반") ? timeKeywordMatch[0] : timeKeywordMatch[2] + "시반")) {
            if (input.includes(timeKeywordMatch[2] + "시반") || timeKeywordMatch[0].includes("반")) {
                minutes = 30;
            }
        }
        hasTime = true;
        title = title.replace(timeKeywordMatch[0], "").replace(timeKeywordMatch[2] + "시반", "");
    } else {
        // 일반 "N시 N분/반" (키워드 없음)
        const simpleTimeMatch = input.match(/(\d{1,2})시(?:\s*(\d{1,2})분|반)?/);
        if (simpleTimeMatch) {
            hours = parseInt(simpleTimeMatch[1]);
            if (simpleTimeMatch[2]) {
                minutes = parseInt(simpleTimeMatch[2]);
            } else if (input.includes(simpleTimeMatch[1] + "시반")) {
                minutes = 30;
            }
            // 키워드 없으면 현재 시간 기준으로 오전/오후 추측 가능하나 여기선 오전으로 우선 처리
            hasTime = true;
            title = title.replace(simpleTimeMatch[0], "").replace(simpleTimeMatch[1] + "시반", "");
        }

        // 24시간 형식 (15:30)
        const isoTimeMatch = input.match(/(\d{1,2}):(\d{2})/);
        if (isoTimeMatch) {
            hours = parseInt(isoTimeMatch[1]);
            minutes = parseInt(isoTimeMatch[2]);
            hasTime = true;
            title = title.replace(isoTimeMatch[0], "");
        }
    }

    if (!hasDate && !hasTime) {
        return { error: "날짜나 시간을 이해하지 못했어요. 예: '내일 오후 3시 치과'" };
    }

    // 4. 기간 추출
    const durationMatch = input.match(/(\d+)\s*(시간|분)/);
    if (durationMatch) {
        const val = parseInt(durationMatch[1]);
        durationMinutes = durationMatch[2] === "시간" ? val * 60 : val;
        title = title.replace(durationMatch[0], "");
    }

    // 5. 정리
    date.setHours(hours, minutes, 0, 0);

    const startISO = date.toISOString();
    const endDate = new Date(date.getTime() + durationMinutes * 60000);
    const endISO = endDate.toISOString();

    // 제목 정제 (특수문자 및 불필요한 조사/키워드 제거)
    const keywords = "오늘|내일|모레|이번|다음|주|요일|새벽|아침|오전|점심|오후|저녁|밤|장소|시간|분|반|시";
    const keywordRegex = new RegExp(`(${keywords})`, "g");
    title = title.replace(keywordRegex, "").replace(/[@]/g, "").trim();
    title = title.replace(/^\s*([가-힣]{1,2}요일)\s*/, ""); // 요일 단독 남은 경우 제거
    if (!title || title.length < 1) title = "새 일정";

    return {
        draft: {
            title,
            startISO,
            endISO,
            location
        }
    };
}

