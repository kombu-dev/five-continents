// タイトル画面（v0.4）。夜明けの観覧車カットイン(vista:'title')を背景に、
// セーブの有無で「つづきから」/「はじめから」を切り替える。Enter/クリックで開始。

import { useEffect, useRef } from 'react';
import { drawVista, TILE } from '../game/render';
import { SAVE_KEY } from './GameScreen';

const VIEW_W = 20;
const VIEW_H = 13;
const CANVAS_W = VIEW_W * TILE;
const CANVAS_H = VIEW_H * TILE;

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasSave = (() => {
    try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
  })();

  useEffect(() => {
    const draw = (time: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawVista(ctx, 'title', CANVAS_W, CANVAS_H, time);
    };
    draw(performance.now()); // rAFはタブがvisibility:hiddenだと発火しないため即時にも1回描く
    let raf = 0;
    const loop = (time: number) => { draw(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStart(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div style={{ position: 'relative', maxWidth: CANVAS_W, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="pixel"
        style={{ border: '3px solid var(--frame)', maxWidth: '100%', display: 'block', margin: '0 auto', cursor: 'pointer' }}
        onClick={onStart}
      />
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-start', paddingTop: '8%',
          textAlign: 'center', pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.55)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 'clamp(20px, 5.5vw, 30px)', letterSpacing: 3, color: '#fff8e0' }}>
          五大陸テーマパーク物語
        </h1>
        <div style={{ marginTop: 6, fontSize: 13, color: '#fff0c8' }}>
          〜 大阪の創作者、世界に遊び場を灯す 〜
        </div>
      </div>
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: '6%',
          textAlign: 'center', pointerEvents: 'none',
        }}
      >
        <div
          className="next-arrow"
          style={{
            display: 'inline-block', padding: '6px 18px', color: '#fff8e0',
            fontSize: 15, textShadow: '0 2px 4px rgba(0,0,0,0.55)',
          }}
        >
          ▶ {hasSave ? 'つづきから（Enter / クリック）' : 'はじめる（Enter / クリック）'}
        </div>
      </div>
    </div>
  );
}
