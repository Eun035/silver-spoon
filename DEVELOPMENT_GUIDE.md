# 🛠️ 개발 지침서 (Development Guide)

이 문서는 AI Calendar Assistant 프로젝트의 아키텍처, 핵심 로직, 그리고 기여 가이드를 정리한 기술 문서입니다. 향후 유지보수 및 기능 확장을 위해 참고하시기 바랍니다.

---

## 📂 1. 프로젝트 폴더 구조

```text
src/
├── app/
│   ├── api/                 # Next.js API Routes (구글 캘린더 통신, Auth)
│   │   ├── auth/[...nextauth]/  # NextAuth.js 구글 OAuth 설정
│   │   └── calendar/            # CRUD 라우트 (create, list, update, delete)
│   ├── layout.tsx           # 최상위 HTML 구조, Provider 레이어, 메타/PWAViewport 설정
│   └── page.tsx             # 메인 화면 (음성/텍스트 모드 전환, 입력창 관리)
├── components/              # 재사용 가능한 리액트 컴포넌트
│   ├── EventList.tsx        # 다가오는 일정 목록 (조회, 수정, 삭제 인터페이스 지원)
│   ├── EventPreviewCard.tsx # 일정 파싱 결과 검증/생성 모달 UI
│   ├── VoiceInput.tsx       # Web Speech API 기반 음성 녹음 컴포넌트
│   └── Providers.tsx        # NextAuth SessionProvider 레이어
└── services/
    └── nlpParser.ts         # ⭐ 핵심 자연어 처리 규칙 및 날짜/알람 파싱 로직 
public/
├── manifest.json            # PWA 웹 매니페스트 (앱 스토어용)
├── icon-192x192.png         # 안드로이드 홈 아이콘
└── icon-512x512.png         # 스플래시 및 고해상도 앱 아이콘
```

---

## 🧠 2. 주요 아키텍처 & 데이터 흐름

### A. 인풋 프로세싱
1. `page.tsx`: 사용자가 마이크 권한을 승인하거나 텍스트를 입력하면 `handleTextSubmit` 또는 `handleVoiceTranscript`를 통해 원시 문장(Raw Text) 획득.
2. `nlpParser.ts`: `parseNaturalLanguage` 함수로 문장 전달.
3. 정규표현식 및 오늘 날짜 기준 계산을 통하여 배열, 시간, 장소, 알림 설정(예: "정시 알람" -> `[0]`)을 파싱.
4. `EventDraft` 객체 형태로 UI (`EventPreviewCard.tsx`)에 반환.

### B. 인증 프로세스
1. 클라이언트: 캘린더 권한(`calendar.events` scope)을 얻기 위해 NextAuth의 `signIn('google')` 호출.
2. `[...nextauth]/authOptions.ts`: OAuth 과정에서 발급받은 `access_token`을 JWT 토큰 내부에 보관 후 Client Session에 노출.
3. 이후 모든 서버 API 핸들러들은 `getServerSession`을 통해 읽어온 `access_token`을 구글 API 클라이언트에 주입하여 통신.

### C. 캘린더 CRUD 통신
Google의 공식 `googleapis` Node.js 라이브러리를 사용.
- **List (`/api/calendar/list`)**: `timeMin`을 오늘로, `timeMax`를 한 달 후로 잡아 가까운 일정 최대 25개까지 오름차순으로 렌더. 구글의 `reminders.overrides` 데이터를 해석하여 자체 UI 컴포넌트로 전달.
- **Create / Update**: 클라이언트가 보내는 `reminders` 속성(배열)을 해석하여 `useDefault: false` 구조로 재조립하여 구글 프레임워크 형식(popup 메소드 지정)에 맞춰 발송.

---

## 🔥 3. 핵심 모듈 가이드

### `services/nlpParser.ts` 수정 및 커스텀 가이드
현재 로직은 AI 서버나 외부 LLM 비용 없이 클라이언트의 기기 자원만 사용하는 **정규표현식 기반(경량화) 파서**입니다.
새로운 패턴(예: "모레" 등)을 추가하려면 파서 상단의 로직을 수정하세요.
- **알람 추가 (Reminders)**: `alramMatch` 정규표현식 배열을 확장하십시오. "X분 전", "X시간 전" 등의 스트링을 분 단위 숫자로 치환하여 반환합니다.

### 캘린더 일정 충돌/에러 처리
일정 작성 완료 팝업이나 리프레시를 위해 모든 API 반환값은 `success: boolean`, `message: string` 형태로 규격화되어 있습니다. Google SDK에서 발생하는 401(토큰 만료), 403(권한 부족) 예외는 서버 API가 잡아 친절한 한국어 텍스트로 치환해 줍니다. 

---

## 🚀 4. 퍼블리싱 (Publish) 체크리스트

모바일 친화형 프로젝트이므로 터치/줌 비율, PWA 뷰포트는 모두 제어되었습니다.

1. **GitHub 관리**: `git add .` 및 `git push origin main` 을 통해 Vercel 등의 호스팅과 CD(Continuous Deployment) 연동.
2. **Google Cloud Console**: "앱 게시/승인 요청" 단계 진행 必. (프라이버시 폴리시 URL 및 시연 유튜브 영상 제출)
3. **PWA -> APK 변환**: 제공된 아이콘 및 `manifest.json`을 사용하여 Android/iOS 웹킷 기반 패키징.
