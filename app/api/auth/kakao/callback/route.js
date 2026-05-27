import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/auth";

async function exchangeToken(code, redirectUri) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.KAKAO_REST_API_KEY,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });
  if (!response.ok) throw new Error("Kakao token exchange failed");
  return response.json();
}

async function fetchKakaoProfile(accessToken) {
  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Kakao profile fetch failed");
  return response.json();
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;
  const redirectUri =
    process.env.KAKAO_REDIRECT_URI || `${origin}/api/auth/kakao/callback`;

  if (!code) {
    return NextResponse.redirect(`${origin}/admin?error=no_code`);
  }

  try {
    const token = await exchangeToken(code, redirectUri);
    const profile = await fetchKakaoProfile(token.access_token);
    const kakaoId = String(profile.id || "");
    const adminId = process.env.ADMIN_KAKAO_ID;

    if (!adminId || kakaoId !== String(adminId)) {
      return NextResponse.redirect(`${origin}/admin?error=not_admin`);
    }

    await setAdminSession({
      kakaoId,
      nickname: profile.kakao_account?.profile?.nickname || "관리자",
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(`${origin}/admin`);
  } catch {
    return NextResponse.redirect(`${origin}/admin?error=kakao_failed`);
  }
}
