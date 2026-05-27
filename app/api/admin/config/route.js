import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateState } from "@/lib/store";

function cleanText(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function normalizeInstruments(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      id:
        cleanText(item.id, 80) ||
        cleanText(item.name, 80)
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]+/g, "-"),
      name: cleanText(item.name, 80),
      maxBorrow: Math.max(0, Number.parseInt(item.maxBorrow, 10) || 0),
    }))
    .filter((item) => item.id && item.name);
}

export async function PUT(request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const instruments = normalizeInstruments(payload.instruments);
  if (!cleanText(payload.title, 120) || instruments.length === 0) {
    return NextResponse.json(
      { error: "제목과 악기를 1개 이상 입력해주세요." },
      { status: 400 }
    );
  }

  const state = await updateState((current) => {
    current.config = {
      title: cleanText(payload.title, 120),
      startsAt: cleanText(payload.startsAt, 80),
      notice: cleanText(payload.notice, 1000),
      instruments,
    };
    return current;
  });

  return NextResponse.json({ config: state.config });
}
