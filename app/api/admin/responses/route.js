import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { readState, updateState } from "@/lib/store";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const state = await readState();
  return NextResponse.json({ responses: state.responses });
}

export async function DELETE() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  await updateState((state) => {
    state.responses = [];
    return state;
  });
  return NextResponse.json({ ok: true });
}
