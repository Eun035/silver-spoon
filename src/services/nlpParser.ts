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

    // 2. 날짜 추출 (키워드 확장)
    if (input.includes("오늘") || input.includes("금일")) {
        hasDate = true;
    } else if (input.includes("내일") || input.includes("명일") || input.includes("익일")) {
        date.setDate(date.getDate() + 1);
        hasDate = true;
    } else if (input.includes("모레")) {
        date.setDate(date.getDate() + 2);
        hasDate = true;
    }

    // N일 뒤, N주 뒤 (상대 날짜)
    const relativeDateMatch = input.match(/(\d+)\s*(일|주|달|개월)\s*(뒤|후|이후)/);
    if (relativeDateMatch) {
        const value = parseInt(relativeDateMatch[1]);
        const unit = relativeDateMatch[2];
        if (unit === "일") date.setDate(date.getDate() + value);
        else if (unit === "주") date.setDate(date.getDate() + (value * 7));
        else if (unit === "달" || unit === "개월") date.setMonth(date.getMonth() + value);
        hasDate = true;
        title = title.replace(relativeDateMatch[0], "");
    }

    // 요일 및 주 단위 추출 (이번 주, 다음 주, 금주, 차주 등)
    const dayMap: { [key: string]: number } = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
    // "다음주" 또는 "다음 주" (요일 없이)
    const weekOnlyMatch = input.match(/(이번|다음|다다음|내|차)\s*주/);
    const weekdayMatch = input.match(/(이번\s*주|다음\s*주|다다음\s*주|금주|차주|내주)?\s*(월|화|수|목|금|토|일)요일/);

    if (weekdayMatch) {
        const weekModifier = weekdayMatch[1] || "";
        const targetDay = dayMap[weekdayMatch[2]];
        const currentDay = date.getDay();

        let daysToAdd = targetDay - currentDay;
        if (weekModifier.includes("다음") || weekModifier.includes("차주") || weekModifier.includes("내주")) daysToAdd += 7;
        if (weekModifier.includes("다다음")) daysToAdd += 14;

        if (daysToAdd <= 0 && (weekModifier.includes("이번") || weekModifier.includes("금주"))) daysToAdd += 7;

        date.setDate(date.getDate() + daysToAdd);
        hasDate = true;
        title = title.replace(weekdayMatch[0], "");
    } else if (weekOnlyMatch && !hasDate) {
        const modifier = weekOnlyMatch[1];
        if (modifier === "다음" || modifier === "내" || modifier === "차") date.setDate(date.getDate() + 7);
        else if (modifier === "다다음") date.setDate(date.getDate() + 14);
        hasDate = true;
        title = title.replace(weekOnlyMatch[0], "");
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

    // 특수 시간 키워드 (정오, 자정)
    if (input.includes("정오")) {
        hours = 12;
        minutes = 0;
        hasTime = true;
        title = title.replace("정오", "");
    } else if (input.includes("자정")) {
        hours = 0;
        minutes = 0;
        hasTime = true;
        title = title.replace("자정", "");
    }

    // 한글 숫자 시간 (한시 ~ 열두시)
    const krHours: { [key: string]: number } = {
        한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 열한: 11, 열두: 12
    };
    const krHourRegex = new RegExp(`(${Object.keys(krHours).join("|")})시(?:\\s*(\\d{1,2})분|반)?`);
    const krHourMatch = input.match(krHourRegex);

    if (krHourMatch && !hasTime) {
        hours = krHours[krHourMatch[1]];
        if (krHourMatch[2]) {
            minutes = parseInt(krHourMatch[2]);
        } else if (input.includes(krHourMatch[0].includes("반") ? krHourMatch[0] : krHourMatch[1] + "시반")) {
            minutes = 30;
        }

        // 오전/오후 문맥 확인
        const context = input.match(/(오전|오후|새벽|아침|점심|저녁|밤)/);
        if (context) {
            const isPM = ["오후", "점심", "저녁", "밤"].includes(context[1]);
            if (isPM && hours < 12) hours += 12;
            else if (!isPM && hours === 12) hours = 0;
        } else if (hours < 9) { // 9시 미만은 보통 오후로 가이드 (예: 6시 반 -> 18:30)
            hours += 12;
        }
        hasTime = true;
        title = title.replace(krHourMatch[0], "").replace(krHourMatch[1] + "시반", "");
    }

    // 숫자 기반 시간 추출
    if (!hasTime) {
        const timeKeywordMatch = input.match(/(새벽|아침|오전|점심|오후|저녁|밤)\s*(\d{1,2})시(?:\s*(\d{1,2})분|반)?/);
        if (timeKeywordMatch) {
            const keyword = timeKeywordMatch[1];
            hours = parseInt(timeKeywordMatch[2]);
            const isPM = ["점심", "오후", "저녁", "밤"].includes(keyword);
            if (isPM && hours < 12) {
                if (hours !== 12) hours += 12;
            } else if (!isPM && hours === 12) {
                hours = 0;
            }
            if (timeKeywordMatch[3]) {
                minutes = parseInt(timeKeywordMatch[3]);
            } else if (input.includes(timeKeywordMatch[0].includes("반") ? timeKeywordMatch[0] : timeKeywordMatch[2] + "시반")) {
                minutes = 30;
            }
            hasTime = true;
            title = title.replace(timeKeywordMatch[0], "").replace(timeKeywordMatch[2] + "시반", "");
        } else {
            const simpleTimeMatch = input.match(/(\d{1,2})시(?:\s*(\d{1,2})분|반)?/);
            if (simpleTimeMatch) {
                hours = parseInt(simpleTimeMatch[1]);
                if (simpleTimeMatch[2]) {
                    minutes = parseInt(simpleTimeMatch[2]);
                } else if (input.includes(simpleTimeMatch[1] + "시반")) {
                    minutes = 30;
                }
                if (hours < 9) hours += 12;
                hasTime = true;
                title = title.replace(simpleTimeMatch[0], "").replace(simpleTimeMatch[1] + "시반", "");
            }

            // N시간 뒤, N분 뒤 (상대 시간)
            const relativeTimeMatch = input.match(/(\d+)\s*(시간|분)\s*(뒤|후|이후)/);
            if (relativeTimeMatch && !hasTime) {
                const value = parseInt(relativeTimeMatch[1]);
                const unit = relativeTimeMatch[2];
                if (unit === "시간") date.setHours(date.getHours() + value);
                else if (unit === "분") date.setMinutes(date.getMinutes() + value);
                hours = date.getHours();
                minutes = date.getMinutes();
                hasTime = true;
                title = title.replace(relativeTimeMatch[0], "");
            }

            const isoTimeMatch = input.match(/(\d{1,2}):(\d{2})/);
            if (isoTimeMatch) {
                hours = parseInt(isoTimeMatch[1]);
                minutes = parseInt(isoTimeMatch[2]);
                hasTime = true;
                title = title.replace(isoTimeMatch[0], "");
            }
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

    // 제목 정제
    const keywords = "오늘|내일|모레|금일|명일|익일|이번|다음|다다음|내|금주|차주|주|요일|새벽|아침|오전|점심|정오|자정|오후|저녁|밤|장소|시간|분|반|시|뒤|후|이후";
    const keywordRegex = new RegExp(`(${keywords})`, "g");
    title = title.replace(keywordRegex, "").replace(/[@\d]/g, "").replace(/\//g, "").replace(/-/g, "").replace(/\s+/g, " ").trim();
    title = title.replace(/^\s*([가-힣]{1,2}요일)\s*/, "");
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

