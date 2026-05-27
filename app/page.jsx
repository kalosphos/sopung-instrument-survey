"use client";

import { CalendarClock, Check, Music2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const [state, setState] = useState(null);
  const [instrumentId, setInstrumentId] = useState("");
  const [mode, setMode] = useState("own");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadConfig() {
    const response = await fetch("/api/config", { cache: "no-store" });
    const data = await response.json();
    setState(data);
    if (!instrumentId && data.config.instruments[0]) {
      setInstrumentId(data.config.instruments[0].id);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  const selected = useMemo(
    () => state?.config.instruments.find((item) => item.id === instrumentId),
    [state, instrumentId]
  );

  const selectedBorrowed = state?.borrowed?.[instrumentId] || 0;
  const selectedRemaining = Math.max(0, Number(selected?.maxBorrow || 0) - selectedBorrowed);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, instrumentId, mode }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error || "제출에 실패했습니다.");
      return;
    }

    setMessage("응답이 저장됐습니다.");
    await loadConfig();
  }

  if (!state) {
    return (
      <main className="page">
        <div className="shell panel">불러오는 중</div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <span className="eyebrow">SOPUNG</span>
            <h1>{state.config.title}</h1>
          </div>
          <a className="pill" href="/admin">
            관리자
          </a>
        </header>

        <section className="panel stack">
          {state.config.startsAt ? (
            <div className="pill">
              <CalendarClock size={15} />
              {state.config.startsAt}
            </div>
          ) : null}

          <p className="notice">{state.config.notice}</p>

          <form className="stack" onSubmit={submit}>
            <div className="field">
              <span className="label">악기 선택</span>
              <div className="instrument-grid">
                {state.config.instruments.map((instrument) => {
                  const borrowed = state.borrowed?.[instrument.id] || 0;
                  const remaining = Math.max(0, Number(instrument.maxBorrow || 0) - borrowed);
                  const full = remaining <= 0;
                  return (
                    <button
                      type="button"
                      key={instrument.id}
                      className={`instrument-option ${
                        instrumentId === instrument.id ? "active" : ""
                      }`}
                      onClick={() => setInstrumentId(instrument.id)}
                    >
                      <span>
                        <strong>{instrument.name}</strong>
                        <br />
                        <small className="muted">대여 가능 {remaining}개</small>
                      </span>
                      <span className={`pill ${full ? "full" : ""}`}>
                        {borrowed}/{instrument.maxBorrow}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <span className="label">상태</span>
              <div className="segmented">
                <button
                  type="button"
                  className={`segment ${mode === "own" ? "active" : ""}`}
                  onClick={() => setMode("own")}
                >
                  개인악기 있어요
                </button>
                <button
                  type="button"
                  className={`segment ${mode === "need" ? "active" : ""}`}
                  onClick={() => setMode("need")}
                  disabled={selectedRemaining <= 0}
                >
                  악기가 필요해요
                </button>
              </div>
            </div>

            <label className="field">
              <span className="label">별명</span>
              <span style={{ position: "relative" }}>
                <UserRound
                  size={18}
                  style={{ position: "absolute", left: 12, top: 14, color: "#8b8375" }}
                />
                <input
                  className="input"
                  style={{ paddingLeft: 40 }}
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="예: 광호"
                  maxLength={40}
                />
              </span>
            </label>

            {message ? <div className="message">{message}</div> : null}
            {error ? <div className="message error">{error}</div> : null}

            <button className="button" disabled={submitting || !nickname || !instrumentId}>
              {submitting ? (
                "저장 중"
              ) : (
                <>
                  <Check size={18} />
                  제출하기
                </>
              )}
            </button>
          </form>
        </section>

        <section className="section panel">
          <h2>
            <Music2 size={18} /> 현재 응답 {state.responseCount}명
          </h2>
          <p className="muted" style={{ marginTop: 8 }}>
            같은 별명으로 다시 제출하면 마지막 응답으로 갱신됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}
