import { NextResponse } from "next/server";
import { updateState } from "@/lib/store";

function cleanText(value, max = 60) {
  return String(value || "").trim().slice(0, max);
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const nickname = cleanText(payload.nickname);
  const instrumentId = cleanText(payload.instrumentId, 80);
  const mode = payload.mode === "own" ? "own" : "need";

  if (!nickname || !instrumentId) {
    return NextResponse.json(
      { error: "별명과 악기를 입력해주세요." },
      { status: 400 }
    );
  }

  let saved;
  await updateState((state) => {
    const instrument = state.config.instruments.find((item) => item.id === instrumentId);
    if (!instrument) {
      saved = { error: "선택한 악기를 찾을 수 없습니다." };
      return state;
    }

    if (mode === "need") {
      const borrowedCount = state.responses.filter(
        (response) =>
          response.instrumentId === instrumentId && response.mode === "need"
      ).length;
      if (borrowedCount >= Number(instrument.maxBorrow || 0)) {
        saved = { error: "대여 가능한 수량이 모두 찼습니다." };
        return state;
      }
    }

    const response = {
      id: crypto.randomUUID(),
      nickname,
      instrumentId,
      mode,
      createdAt: new Date().toISOString(),
    };
    state.responses = [
      response,
      ...state.responses.filter(
        (item) => item.nickname.toLowerCase() !== nickname.toLowerCase()
      ),
    ];
    saved = { response };
    return state;
  });

  if (saved?.error) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }
  return NextResponse.json(saved);
}
