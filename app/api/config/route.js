import { NextResponse } from "next/server";
import { readState } from "@/lib/store";

export async function GET() {
  const state = await readState();
  const borrowed = Object.fromEntries(
    state.config.instruments.map((instrument) => [
      instrument.id,
      state.responses.filter(
        (response) =>
          response.instrumentId === instrument.id && response.mode === "need"
      ).length,
    ])
  );

  return NextResponse.json({
    config: state.config,
    borrowed,
    responseCount: state.responses.length,
  });
}
