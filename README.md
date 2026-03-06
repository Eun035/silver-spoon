# ✨ AI Calendar Assistant

사용자의 **자연어(음성 및 텍스트)**를 분석하여 구글 캘린더 일정을 자동으로 생성, 조회, 수정, 삭제해 주는 지능형 캘린더 웹 애플리케이션입니다.

## 🚀 주요 기능

- **🎙️ 음성 인식 (Voice to Text)**: 브라우저 Web Speech API를 활용하여 사용자의 음성을 텍스트로 변환합니다.
- **🤖 자연어 파싱 (NLP Engine)**: "내일 오후 3시 강남역에서 김팀장과 회의 정알림"과 같은 일상적인 문장을 분석하여 날짜, 시간, 장소, 제목, 알람 빈도를 자동 추출합니다.
- **📅 구글 캘린더 양방향 동기화**: Google Calendar API를 연동하여 앱 내에서 생성/수정한 일정이 앱 밖의 구글 캘린더(스마트폰 앱 등)와 100% 동기화됩니다.
- **🔔 다중 알람 설정**: 정시, 10분 전, 1시간 전, 1일 전 등 모달을 통한 커스텀 구글 푸시 알림 다중 설정 기능.
- **📱 PWA & 반응형 UI (Mobile-Ready)**: 스마트폰 화면에 완벽하게 대응되는 모바일 친화적 레이아웃과, 구글 플레이 스토어 배포(TWA)를 위한 매니페스트/시각 요소 적용.

## 🛠️ 기술 스택

- **Framework**: Next.js 14+ (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **Auth**: NextAuth.js (OAuth 2.0 Google Provider)
- **API Client**: Googleapis (Node.js)

## 📦 로컬 설치 및 실행 방법

1. 저장소 클론 및 패키지 설치
   ```bash
   git clone <repository_url>
   cd Calendar_API_0211
   npm install
   ```

2. `.env.local` 전역 변수 설정
   프로젝트 루트에 `.env.local` 파일을 생성하고 다음 값을 채워 넣습니다:
   ```env
   # NextAuth 설정
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_super_secret_string

   # Google OAuth 자격 증명
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. 서버 실행
   ```bash
   npm run dev
   ```

4. 브라우저에서 `http://localhost:3000` 로 접속 후 구글 로그인 버튼을 클릭하여 테스트합니다.

## 📱 앱 스토어 배포 (PWA)

본 프로젝트는 TWA (Trusted Web Activity) 형태로 안드로이드 앱으로 빌드할 수 있도록 `manifest.json`, Web App Viewport 최적화, App Icon 등이 사전에 준비되어 있습니다. 
[PWABuilder](https://www.pwabuilder.com/) 등의 툴을 사용하여 웹앱 URL을 입력하시면 즉시 `.aab` 파일을 추출하여 Play Store 콘솔에 등록하실 수 있습니다.
