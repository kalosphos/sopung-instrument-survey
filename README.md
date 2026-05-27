# 소풍 치배구성 조사

모바일 우선 악기 조사 페이지입니다. 참여자는 악기와 별명을 입력하고, 관리자는 카카오 로그인 후 행사 제목, 일시, 공지사항, 악기별 대여 가능 수량을 관리합니다.

## 개발 실행

```bash
npm install
npm run dev
```

로컬에서는 `DATABASE_URL`이 없으면 `.data/db.json`에 저장합니다.

## Vercel 환경변수

- `DATABASE_URL`: Neon Postgres 연결 문자열
- `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`: Kakao Developers JavaScript 키
- `ADMIN_KAKAO_ID`: 관리자 카카오 계정 ID
- `SESSION_SECRET`: 임의의 긴 랜덤 문자열

기본 로그인은 Kakao JavaScript SDK가 발급한 access token을 서버에서 검증하는 방식입니다. 별도 REST OAuth callback은 보조 경로로 남겨두었습니다.
