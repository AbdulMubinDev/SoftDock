import { LogosStripContent } from "./LogosStrip";

export function DemoAndLogos() {
  return (
    <section
      id="demo"
      className="relative min-h-screen flex flex-col justify-center py-12 md:py-16 z-10"
    >
      <div className="container max-w-[1180px] mx-auto px-8 flex flex-col flex-1 justify-center gap-8 md:gap-10">
        {/* Demo window */}
        <div className="w-full max-w-[1040px] mx-auto flex-shrink-0 relative flex flex-col">
          <div
            className="absolute -inset-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(26,107,204,0.2) 0%, transparent 70%)",
            }}
          />
          <div
            className="relative rounded-2xl overflow-hidden border flex flex-col min-h-[520px]"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              boxShadow:
                "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(26,107,204,0.1)",
            }}
          >
            <div
              className="flex items-center gap-3 px-5 py-3.5 border-b flex-shrink-0"
              style={{
                background: "var(--surface2)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
              </div>
              <div className="flex-1 flex items-center justify-center gap-2 text-xs text-[var(--text-dim)]">
                <img src="/logo.png" alt="" className="w-5 h-5 rounded object-contain flex-shrink-0" aria-hidden />
                <span>SoftDock — Workspace: openclaw-project &nbsp;&nbsp;</span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                  style={{
                    background: "rgba(26,107,204,0.15)",
                    color: "#60A5FA",
                    border: "1px solid rgba(26,107,204,0.25)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Active session
                </span>
              </div>
              <div className="w-15" />
            </div>

            <div className="p-7 flex flex-col gap-5 min-h-[360px]">
              <div className="flex gap-3.5 items-start flex-row-reverse">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: "#1A6BCC" }}
                >
                  AM
                </div>
                <div
                  className="max-w-[75%] rounded-xl px-4 py-3.5 text-[13.5px] leading-relaxed border"
                  style={{
                    background: "rgba(26,107,204,0.15)",
                    borderColor: "rgba(26,107,204,0.3)",
                    borderLeft: "none",
                    borderRightWidth: 2,
                    borderRightColor: "#1A6BCC",
                    color: "var(--text)",
                  }}
                >
                  Getting this error when calling{" "}
                  <span className="px-1.5 py-0.5 rounded bg-[#0D1117] font-mono text-xs text-[#89DCEB]">
                    claw.connect()
                  </span>{" "}
                  with async context —{" "}
                  <span className="px-1.5 py-0.5 rounded bg-[#0D1117] font-mono text-xs text-[#89DCEB]">
                    RuntimeError: Session already closed
                  </span>
                  . Checked the docs but can't find why.
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 border"
                  style={{
                    background: "var(--surface3)",
                    borderColor: "var(--border)",
                  }}
                >
                  🤖
                </div>
                <div
                  className="max-w-[75%] rounded-xl px-4 py-3.5 text-[13.5px] leading-relaxed border"
                  style={{
                    background: "var(--surface2)",
                    borderColor: "var(--border)",
                    borderLeftWidth: 2,
                    borderLeftColor: "#1A6BCC",
                    color: "var(--text-muted)",
                  }}
                >
                  Found it. This is a known issue in Openclaw v2.3+ when reusing
                  a session object across async contexts. The fix is to
                  initialize the client inside the context manager rather than
                  outside it.
                  <br /><br />
                  <div
                    className="rounded-lg px-4 py-3 mt-2.5 overflow-x-auto leading-[1.7] font-mono text-xs"
                    style={{
                      background: "#0D1117",
                      border: "1px solid rgba(26,107,204,0.2)",
                      color: "#A6E3A1",
                    }}
                  >
                    <span style={{ color: "#94A3B8" }}># ❌ Wrong</span><br />
                    client = claw.Client(token=TOKEN)<br />
                    async with client.session: await client.connect()
                    <br /><br />
                    <span style={{ color: "#94A3B8" }}># ✅ Correct</span><br />
                    async with claw.Client(token=TOKEN) as client:<br />
                    &nbsp;&nbsp;await client.connect()<br />
                    &nbsp;&nbsp;result = await client.fetch(endpoint)
                  </div>
                  Documented in Openclaw migration guide v2.3.
                  <span className="inline-block w-0.5 h-3.5 bg-[#1A6BCC] ml-0.5 align-middle animate-blink" />
                </div>
              </div>
            </div>

            <div
              className="mx-7 mb-7 flex items-center gap-3 px-4 py-3.5 rounded-xl border flex-shrink-0"
              style={{
                background: "#0D0D1A",
                borderColor: "var(--border)",
              }}
            >
              <span className="flex-1 text-[13px] text-[var(--text-dim)]">
                Ask about your error, paste terminal output...
              </span>
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#2D7FE0]"
                style={{ background: "#1A6BCC" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Logos strip — same frame */}
        <div className="flex-shrink-0">
          <LogosStripContent />
        </div>
      </div>
    </section>
  );
}
