import { useMemo } from 'react';

const STAR_COUNT = 200;

function Starfield() {
  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      dur: 3 + Math.random() * 6,
      delay: Math.random() * 8,
      op: 0.3 + Math.random() * 0.6,
    }));
  }, []);

  return (
    <div
      id="starfield"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      {stars.map((s) => (
        <div
          key={s.id}
          className="star absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            ['--dur' as string]: `${s.dur}s`,
            ['--delay' as string]: `${s.delay}s`,
            ['--op' as string]: String(s.op),
          }}
        />
      ))}
    </div>
  );
}

function NebulaBlobs() {
  return (
    <>
      <div
        className="nebula nebula-1 fixed rounded-full pointer-events-none z-0"
        style={{
          width: 600,
          height: 600,
          top: -100,
          left: -150,
          background: 'radial-gradient(circle, rgba(26,107,204,0.12) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }}
        aria-hidden
      />
      <div
        className="nebula nebula-2 fixed rounded-full pointer-events-none z-0"
        style={{
          width: 500,
          height: 500,
          top: '40%',
          right: -100,
          background: 'radial-gradient(circle, rgba(100,50,200,0.08) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }}
        aria-hidden
      />
      <div
        className="nebula nebula-3 fixed rounded-full pointer-events-none z-0"
        style={{
          width: 400,
          height: 400,
          bottom: '10%',
          left: '30%',
          background: 'radial-gradient(circle, rgba(26,107,204,0.10) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }}
        aria-hidden
      />
    </>
  );
}

export function LandingBackground() {
  return (
    <>
      <Starfield />
      <NebulaBlobs />
    </>
  );
}
