import { NextResponse } from "next/server";

export async function GET(request) {
  const clientId = process.env.KAKAO_REST_API_KEY;
  if (!clientId) {
    return NextResponse.json(
      { error: "KAKAO_REST_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri =
    process.env.KAKAO_REDIRECT_URI || `${origin}/api/auth/kakao/callback`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  return NextResponse.redirect(`https://kauth.kakao.com/oauth/authorize?${params}`);
}
