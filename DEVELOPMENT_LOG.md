# 📅 CAL.API 개발 기록 및 프로젝트 요약

사용자의 목소리(음성)와 텍스트를 인식하여 스마트하게 일정을 관리해 주는 **Intelligent Calendar Assistant** 프로젝트의 개발 과정을 정리한 문서입니다.

## 🚀 1단계: 프로젝트 기초 설계 및 초기화
- **기술 스택 확정**: Next.js (App Router), TypeScript, Tailwind CSS v4, NextAuth.js
- **환경 구축**:
  - `npx create-next-app`을 통한 프로젝트 초기화
  - Tailwind CSS v4 설정을 위한 포스트 CSS 및 설정 파일(`tailwind.config.js`, `postcss.config.mjs`) 구성
  - `googleapis` 라이브러리 연동으로 Google Calendar API 통신 기반 마련

## 🔐 2단계: 인증 및 권한 시스템 구현
- **Google OAuth 연동**: `next-auth`를 사용해 구글 로그인 구현
- **보안 설정**: `authOptions.ts` 분리를 통해 순환 참조 방지 및 세션 토큰 관리 최적화
- **Google API Scopes 설정**: 캘린더 읽기/쓰기 권한(`calendar.events`)을 포함한 OAuth 동의 화면 구성
- **토큰 주입**: JWT 콜백을 통해 서버 측에서 Google API를 호출할 수 있는 `accessToken` 세션 주입

## 🎙️ 3단계: 지능형 입력 시스템 (Sprint 3)
- **음성 인식 (Voice Assistant)**: 브라우저의 `Web Speech API`를 활용하여 실시간 한국어 음성-텍스트 변환 구현
- **자연어 파서 (NLP Parser)**: 
  - 정규표현식 기반의 한국어 특화 일정 추출 엔진 제작
  - "이번 주 토요일", "내일 새벽 6시" 등 상대적 날짜와 키워드 시간 인식 로직 구현
  - 제목, 날짜, 시간, 장소를 자동으로 분리하여 `EventDraft` 생성
- **사용자 검증 UI**: 저장 전 추출된 내용을 확인하고 직접 수정할 수 있는 `EventPreviewCard` 도입

## ⚡ 4단계: 실시간 캘린더 상호작용 (Sprint 4)
- **전체 CRUD 완성**:
  - `POST /api/calendar/create`: 새 일정 생성
  - `GET /api/calendar/list`: 최근 1개월 이내의 일정 조회 (timeMax 설정으로 최적화)
  - `PATCH /api/calendar/update`: 리스트에서 즉시 제목 등 수정
  - `DELETE /api/calendar/delete`: 일정 삭제 및 캘린더 동기화
- **UX 개선**:
  - '종일 일정'의 날짜 표시 오류 해결 (Invalid Date 수정)
  - 고풍스럽고 세련된 프리미엄 다크/화이트 모달 스타일 적용
  - 리스트 액션 후 즉시 새로고침 없이 상태가 반영되는 실시간 리프레시 로직

## 🚢 5단계: 배포 준비 및 최적화
- **오류 해결**: API 라우트의 임포트 경로를 절대 경로 별칭(`@/`)으로 통일하여 빌드 에러 해결
- **보안**: `.gitignore` 및 안전한 `NEXTAUTH_SECRET` 환경 변수 설정
- **가이드 제작**: Vercel 배포를 위한 Google Cloud Console 설정 체크리스트 및 검증 시나리오 문서화
- **Sprint 6: 모바일 및 웹 호환성 최적화**:
  - 음성 인식 안정화 (Ref 기반 상태 관리로 끊김 방지)
  - NLP 파서 정교화 (제목 내 숫자 보존 로직 추가)
  - 반응형 UI 개선 (모바일 화면 입력 폼 스택 처리 및 여백 조정)

## ⏰ 7단계: 사용자 맞춤형 알림(Reminder) 시스템 도입
- **NLP 파서 확장 (`nlpParser.ts`)**:
  - `EventDraft` 인터페이스에 다중 알림 지원을 위해 `reminders` 속성(숫자 배열) 추가 (기본값 `[30]` 반영).
- **UI/UX 개선 (`EventPreviewCard.tsx`)**:
  - 사용자 친화적인 알람 다중 선택 옵션 UI 구현 (`[없음]`, `[정시]`, `[5분 전]`, `[10분 전]`, `[30분 전]`, `[1시간 전]`, `[1일 전]`).
  - 배열 형태의 데이터 관리를 통해 여러 개의 알람 시간을 동시에 선택하고 해제할 수 있도록 토글 버튼 로직 적용.
- **API 연동 (`api/calendar/create`, `api/calendar/update`)**:
  - `requestBody.reminders` 속성에 `useDefault: false`와 `overrides: draft.reminders.map(...)` 포맷을 활용하여 Google Calendar 측으로 배열 내 모든 알림 데이터를 전송.

## 🌟 8단계: 지능형 고급 기능 고도화 (Sprint 8)
- **장소 및 네이버 지도 연동**: "강남역에서 미팅" 인식 후, UI에서 네이버 지도 검색 바로가기 제공.
- **참석자 자동 식별**: "김팀장" 등 사전 정의된 연락처 키워드 인식 및 이메일 연동 UI 칩 활성화.
- **컬러 코딩 (Color Coding)**: "회의"(파랑), "운동"(초록), "병원"(빨강) 등 일정의 성격에 따라 구글 캘린더 색상(`colorId`) 자동 분류.
- **Sprint 9: 알람 신뢰성 및 UX 고도화**:
  - 알람 모니터의 상태 저장소를 `localStorage`로 변경하여 브라우저 재시작 시에도 알람 상태 유지.
  - 알람 발생 시 시각적 알림 외에 오디오(사운드) 및 진동(모바일) 피드백 추가.
  - 메인 화면에 '알람 진단 도구'를 배치하여 권한 상태 확인 및 즉시 테스트 기능 제공.
  - `EventPreviewCard`의 알람 미설정 시 시각적 피드백 강화.

---

### 🎨 디자인 철학
- **Micro-interactions**: 호버 효과, 애니메이션 등을 통해 생동감 있는 인터페이스 제공
- **Visual Clarity**: 아이콘과 레이아웃의 균형을 통해 복잡한 일정 정보를 한눈에 파악

### 🛠️ 주요 사용 도구
- **Framework**: Next.js 15+
- **Styling**: Tailwind CSS v4
- **Auth**: NextAuth.js
- **API**: Google Calendar API v3
- **Icons**: Lucide React
