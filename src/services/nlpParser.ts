export interface EventDraft {
    title: string;
    startISO: string;
    endISO: string;
    location?: string;
    reminders?: number[]; // 설정된 알림 시간(분단위) 배열. 빈 배열이면 알림 없음
}

export function parseToDraft(
    input: string,
    now: Date = new Date(),
    tz: string = "Asia/Seoul"
): { draft?: EventDraft; error?: string } {
    if (!input.trim()) return { error: "입력된 내용이 없습니다." };

    console.log(`[NLP] Parsing: "${input}"`);

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
    // 오늘, 내일, 모레, 금일, 명일...
    const dayKeywords: { [key: string]: number } = {
        "오늘": 0, "금일": 0,
        "내일": 1, "명일": 1, "익일": 1,
        "모레": 2
    };

    for (const [kw, offset] of Object.entries(dayKeywords)) {
        if (input.includes(kw)) {
            date.setDate(date.getDate() + offset);
            hasDate = true;
            title = title.replace(kw, "");
            break;
        }
    }

    // N일/주/달 뒤 (상대 날짜)
    const relativeDateMatch = input.match(/(\d+)\s*(일|주|달|개월)\s*(뒤|후|이후)/);
    if (relativeDateMatch) {
        const val = parseInt(relativeDateMatch[1]);
        const unit = relativeDateMatch[2];
        if (unit === "일") date.setDate(date.getDate() + val);
        else if (unit === "주") date.setDate(date.getDate() + (val * 7));
        else if (unit === "달" || unit === "개월") date.setMonth(date.getMonth() + val);
        hasDate = true;
        title = title.replace(relativeDateMatch[0], "");
    }

    // 요일 기반 (다음주 월요일, 이번주 금요일 등)
    const dayMap: { [key: string]: number } = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
    const weekdayMatch = input.match(/(이번|다음|다다음|담|내|차|금)?\s*주?\s*(월|화|수|목|금|토|일)요일/);
    if (weekdayMatch) {
        const modifier = weekdayMatch[1] || "";
        const targetDay = dayMap[weekdayMatch[2]];
        const currentDay = date.getDay();
        let daysToAdd = targetDay - currentDay;

        if (modifier.match(/다음|담|내|차/)) daysToAdd += 7;
        else if (modifier === "다다음") daysToAdd += 14;

        // "이번주 화요일"인데 오늘이 수요일이면 다음주 화요일로
        if (daysToAdd <= 0 && (modifier === "이번" || modifier === "금" || modifier === "")) {
            daysToAdd += 7;
        }

        date.setDate(date.getDate() + daysToAdd);
        hasDate = true;
        title = title.replace(weekdayMatch[0], "");
    }

    // 주 단위 단독 (다음주, 담주, 이번주 등)
    const weekOnlyMatch = input.match(/(이번|다음|다다음|담|내|차|금)\s*주/);
    if (weekOnlyMatch && !hasDate) {
        const modifier = weekOnlyMatch[1];
        if (modifier.match(/다음|담|내|차/)) date.setDate(date.getDate() + 7);
        else if (modifier === "다다음") date.setDate(date.getDate() + 14);
        hasDate = true;
        title = title.replace(weekOnlyMatch[0], "");
    }

    // M/D 형식
    const mdMatch = input.match(/(\d{1,2})\/(\d{1,2})/);
    if (mdMatch && !hasDate) {
        date.setMonth(parseInt(mdMatch[1]) - 1);
        date.setDate(parseInt(mdMatch[2]));
        hasDate = true;
        title = title.replace(mdMatch[0], "");
    }

    // 3. 시간 추출
    let hours = 9;
    let minutes = 0;

    // 정오, 자정
    if (input.includes("정오")) { hours = 12; hasTime = true; title = title.replace("정오", ""); }
    else if (input.includes("자정")) { hours = 0; hasTime = true; title = title.replace("자정", ""); }

    // 한글 숫자 (한시, 두시...)
    const krHours: { [key: string]: number } = {
        한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 열한: 11, 열두: 12
    };
    const krHourRegex = new RegExp(`(${Object.keys(krHours).join("|")})시(?:\\s*(\\d{1,2})분|반)?`);
    const krHourMatch = input.match(krHourRegex);
    if (krHourMatch && !hasTime) {
        hours = krHours[krHourMatch[1]];
        if (krHourMatch[2]) minutes = parseInt(krHourMatch[2]);
        else if (krHourMatch[0].includes("반")) minutes = 30;
        hasTime = true;
        title = title.replace(krHourMatch[0], "");
    }

    // 숫자 기반 시간 (14시, 오후 3시, 저녁 7시)
    const timeMatch = input.match(/(새벽|아침|오전|점심|오후|저녁|밤)?\s*(\d{1,2})시(?:\s*(\d{1,2})분|반)?/);
    if (timeMatch && !hasTime) {
        const keyword = timeMatch[1];
        hours = parseInt(timeMatch[2]);
        if (timeMatch[3]) minutes = parseInt(timeMatch[3]);
        else if (timeMatch[0].includes("반")) minutes = 30;

        const isPM = ["점심", "오후", "저녁", "밤"].includes(keyword);
        if (isPM && hours < 12) hours += 12;
        else if (keyword === "새벽" && hours === 12) hours = 0;
        else if (!keyword && hours < 9) hours += 12; // 9시 전 숫자는 기본 오후로

        hasTime = true;
        title = title.replace(timeMatch[0], "");
    }

    // 상대 시간 (2시간 뒤, 30분 후)
    const relativeTimeMatch = input.match(/(\d+)\s*(시간|분)\s*(뒤|후|이후)/);
    if (relativeTimeMatch && !hasTime) {
        const val = parseInt(relativeTimeMatch[1]);
        if (relativeTimeMatch[2] === "시간") date.setHours(date.getHours() + val);
        else date.setMinutes(date.getMinutes() + val);
        hours = date.getHours();
        minutes = date.getMinutes();
        hasTime = true;
        title = title.replace(relativeTimeMatch[0], "");
    }

    // 단독 키워드 시간 (점심, 저녁, 아침)
    const standaloneTimeKeywords: { [key: string]: number } = {
        "아침": 8, "점심": 12, "저녁": 18, "밤": 22, "새벽": 2
    };
    for (const [kw, h] of Object.entries(standaloneTimeKeywords)) {
        if (input.includes(kw) && !hasTime) {
            hours = h;
            minutes = 0;
            hasTime = true;
            // 타이틀에서 제거는 나중에 한꺼번에
            break;
        }
    }

    if (!hasDate && !hasTime) {
        return { error: "날짜나 시간을 이해하지 못했어요. 예: '내일 오후 3시 치과'" };
    }

    // 4. 최종 정리
    date.setHours(hours, minutes, 0, 0);

    // 기간 추출
    const durationMatch = input.match(/(\d+)\s*(시간|분)\s*(동안|정도)?/);
    if (durationMatch) {
        const val = parseInt(durationMatch[1]);
        durationMinutes = durationMatch[2] === "시간" ? val * 60 : val;
        title = title.replace(durationMatch[0], "");
    }

    const startISO = date.toISOString();
    const endISO = new Date(date.getTime() + durationMinutes * 60 * 1000).toISOString();

    // 제목 정제 (추출 과정에서 이미 title에서 매칭된 부분들은 제거된 상태임)
    // 남아있는 노이즈만 제거하되, 숫자는 가급적 보존 (예: "1번 출구" 등)
    const noise = /이번주|다음주|담주|내주|차주|금주|요일|오전|오후|아침|점심|저녁|밤|새벽|뒤|후|이후|동안|정도|장소|@/g;
    title = title.replace(noise, "").replace(/\s+/g, " ").trim();
    if (!title) title = "새 일정";

    // 기본 알림 30분 전으로 설정 (배열 형태)
    return { draft: { title, startISO, endISO, location, reminders: [30] } };
}
