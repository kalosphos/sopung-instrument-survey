"use client";

import {
  CalendarClock,
  LogIn,
  LogOut,
  Plus,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function blankInstrument() {
  return { id: crypto.randomUUID(), name: "", maxBorrow: 0 };
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <div className="shell panel">불러오는 중</div>
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState(undefined);
  const [config, setConfig] = useState(null);
  const [responses, setResponses] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loginStatus, setLoginStatus] = useState("");

  async function load() {
    const [meResponse, configResponse] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch("/api/config", { cache: "no-store" }),
    ]);
    const me = await meResponse.json();
    const configData = await configResponse.json();
    setSession(me.session);
    setConfig(configData.config);

    if (me.session) {
      const responsesResponse = await fetch("/api/admin/responses", { cache: "no-store" });
      if (responsesResponse.ok) {
        const data = await responsesResponse.json();
        setResponses(data.responses);
      }
    }
  }

  useEffect(() => {
    load();
  }, []);

  const instrumentNameById = useMemo(
    () =>
      Object.fromEntries(
        (config?.instruments || []).map((instrument) => [instrument.id, instrument.name])
      ),
    [config]
  );

  async function saveConfig(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || "저장에 실패했습니다.");
      return;
    }

    setConfig(data.config);
    setMessage("관리 설정을 저장했습니다.");
    await load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await load();
  }

  async function kakaoLogin() {
    const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
    if (!key) {
      setLoginStatus("카카오 JavaScript 키가 설정되지 않았습니다.");
      return;
    }

    setLoginStatus("카카오 로그인 준비 중");
    try {
      await new Promise((resolve, reject) => {
        if (window.Kakao) return resolve();
        const script = document.createElement("script");
        script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      if (!window.Kakao.isInitialized()) window.Kakao.init(key);
      window.Kakao.Auth.login({
        scope: "profile_nickname,profile_image",
        success: async () => {
          setLoginStatus("로그인 처리 중");
          const accessToken = window.Kakao.Auth.getAccessToken();
          const response = await fetch("/api/auth/kakao/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: accessToken }),
          });
          const data = await response.json().catch(() => null);
          if (data?.success) {
            window.location.href = data.redirect || "/admin";
          } else {
            setLoginStatus(data?.message || "로그인 처리에 실패했습니다.");
          }
        },
        fail: () => setLoginStatus("카카오 로그인이 취소되었습니다."),
      });
    } catch {
      setLoginStatus("카카오 SDK를 불러오지 못했습니다.");
    }
  }

  async function clearResponses() {
    if (!confirm("응답을 모두 삭제할까요?")) return;
    await fetch("/api/admin/responses", { method: "DELETE" });
    setResponses([]);
  }

  if (session === undefined || !config) {
    return (
      <main className="page">
        <div className="shell panel">불러오는 중</div>
      </main>
    );
  }

  if (!session) {
    const loginError = searchParams.get("error");
    return (
      <main className="page">
        <div className="shell stack">
          <header className="topbar">
            <div className="brand">
              <span className="eyebrow">ADMIN</span>
              <h1>관리자 로그인</h1>
            </div>
            <a className="pill" href="/">
              설문
            </a>
          </header>

          <section className="panel stack">
            <p className="muted">
              카카오 계정이 `ADMIN_KAKAO_ID`와 일치할 때만 관리 화면에 들어갈 수 있습니다.
            </p>
            {loginError ? (
              <div className="message error">로그인 설정 또는 관리자 계정을 확인해주세요.</div>
            ) : null}
            {loginStatus ? <div className="message">{loginStatus}</div> : null}
            <button className="button" onClick={kakaoLogin}>
              <LogIn size={18} />
              카카오로 로그인
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell stack">
        <header className="topbar">
          <div className="brand">
            <span className="eyebrow">ADMIN</span>
            <h1>치배구성 관리</h1>
          </div>
          <button className="icon-button" onClick={logout} title="로그아웃">
            <LogOut size={18} />
          </button>
        </header>

        <form className="panel admin-grid" onSubmit={saveConfig}>
          <label className="field">
            <span className="label">제목</span>
            <input
              className="input"
              value={config.title}
              onChange={(event) => setConfig({ ...config, title: event.target.value })}
            />
          </label>

          <label className="field">
            <span className="label">일시</span>
            <span style={{ position: "relative" }}>
              <CalendarClock
                size={18}
                style={{ position: "absolute", left: 12, top: 14, color: "#8b8375" }}
              />
              <input
                className="input"
                style={{ paddingLeft: 40 }}
                value={config.startsAt}
                onChange={(event) => setConfig({ ...config, startsAt: event.target.value })}
                placeholder="예: 2026.06.15 14:00"
              />
            </span>
          </label>

          <label className="field">
            <span className="label">공지사항</span>
            <textarea
              className="textarea"
              value={config.notice}
              onChange={(event) => setConfig({ ...config, notice: event.target.value })}
            />
          </label>

          <div className="field">
            <span className="label">악기와 대여 가능 수량</span>
            <div className="stack">
              {config.instruments.map((instrument, index) => (
                <div className="instrument-editor" key={instrument.id}>
                  <input
                    className="input"
                    value={instrument.name}
                    placeholder="악기명"
                    onChange={(event) => {
                      const instruments = [...config.instruments];
                      instruments[index] = { ...instrument, name: event.target.value };
                      setConfig({ ...config, instruments });
                    }}
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={instrument.maxBorrow}
                    onChange={(event) => {
                      const instruments = [...config.instruments];
                      instruments[index] = {
                        ...instrument,
                        maxBorrow: event.target.value,
                      };
                      setConfig({ ...config, instruments });
                    }}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    title="삭제"
                    onClick={() =>
                      setConfig({
                        ...config,
                        instruments: config.instruments.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                setConfig({ ...config, instruments: [...config.instruments, blankInstrument()] })
              }
            >
              <Plus size={18} />
              악기 추가
            </button>
          </div>

          {message ? <div className="message">{message}</div> : null}
          {error ? <div className="message error">{error}</div> : null}

          <button className="button" disabled={saving}>
            <Save size={18} />
            {saving ? "저장 중" : "저장"}
          </button>
        </form>

        <section className="panel stack">
          <div className="topbar" style={{ marginBottom: 0 }}>
            <h2>
              <UsersRound size={18} /> 응답 {responses.length}명
            </h2>
            <button className="button danger" onClick={clearResponses}>
              <Trash2 size={16} />
              초기화
            </button>
          </div>

          <div>
            {responses.length === 0 ? (
              <p className="muted">아직 응답이 없습니다.</p>
            ) : (
              responses.map((response) => (
                <div className="response-row" key={response.id}>
                  <div>
                    <strong>{response.nickname}</strong>
                    <br />
                    <span className="muted">
                      {instrumentNameById[response.instrumentId] || response.instrumentId}
                    </span>
                  </div>
                  <span className="pill">
                    {response.mode === "own" ? "개인악기" : "대여필요"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
