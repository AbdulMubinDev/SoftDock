import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* Hero grid line */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(26,107,204,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,107,204,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)",
        }}
      />

      <div className="container max-w-[1180px] mx-auto px-8 relative z-10 flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="font-extrabold text-[clamp(2.75rem,6.5vw,5rem)] leading-[1.05] tracking-tight mb-5 animate-fade-up max-w-[900px]">
          Debug at the
          <br />
          <em className="not-italic bg-gradient-to-r from-[#4D9FFF] via-[#1A6BCC] to-[#7B4FE0] bg-clip-text text-transparent">
            Speed of Thought
          </em>
        </h1>
        <p className="text-lg text-[var(--text-muted)] font-light max-w-[560px] leading-relaxed mb-8 animate-fade-up animation-delay-100">
          The AI platform built exclusively for software issues. Not a generic
          chatbot — a dedicated co-pilot that reads your docs, understands
          your stack, and solves your exact problem.
        </p>
        <div className="flex items-center gap-4 animate-fade-up animation-delay-200">
          <Link to="/register">
            <Button size="lg" className="!px-8 !py-3.5">
              Start debugging free →
            </Button>
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:border-[#1A6BCC] hover:text-[var(--text)] transition-colors text-base"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" />
            </svg>
            Watch demo
          </a>
        </div>
      </div>
    </section>
  );
}
