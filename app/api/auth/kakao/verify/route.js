import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/auth";

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const accessToken = String(payload.access_token || "");
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "카카오 access token이 없습니다." },
      { status: 422 }
    );
  }

  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { success: false, message: "카카오 인증에 실패했습니다." },
      { status: 422 }
    );
  }

  const profile = await response.json();
  const kakaoId = String(profile.id || "");
  if (!kakaoId || kakaoId !== String(process.env.ADMIN_KAKAO_ID || "")) {
    return NextResponse.json(
      { success: false, message: "관리자 계정이 아닙니다." },
      { status: 403 }
    );
  }

  await setAdminSession({
    kakaoId,
    nickname:
      profile.properties?.nickname ||
      profile.kakao_account?.profile?.nickname ||
      "관리자",
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ success: true, redirect: "/admin" });
}
