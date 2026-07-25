// クリア画面（v0.4）。エンディングの台詞が終わった後（stage>=99）に表示する結果画面。
// vista:'ending'（五つの観覧車の夕景）を背景に、最終ステータスと歩んだ道の記録をまとめて見せる。

import { useEffect, useRef } from 'react';
import type { G } from '../game/types';
import { drawVista, TILE } from '../game/render';
import { ENDING_BLURB, trailLines } from '../game/story';
import { fameWord, fmtMoney, SAVE_KEY } from './GameScreen';

const VIEW_W = 20;
const VIEW_H = 13;
const CANVAS_W = VIEW_W * TILE;
const CANVAS_H = VIEW_H * TILE;

export function EndingResult({ g, onExitToTitle }: { g: G; onExitToTitle: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = (time: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawVista(ctx, 'ending', CANVAS_W, CANVAS_H, time);
    };
    draw(performance.now()); // rAFはタブがvisibility:hiddenだと発火しないため即時にも1回描く
    let raf = 0;
    const loop = (time: number) => { draw(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const 名 = g.ending ?? '調和';

  return (
    <div style={{ position: 'relative', maxWidth: CANVAS_W, margin: '0 auto' }}>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="pixel"
        style={{ border: '3px solid var(--frame)', maxWidth: '100%', display: 'block', margin: '0 auto' }} />
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-start', padding: '5% 6% 0', overflowY: 'auto',
          textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.6)', color: '#fff8e0',
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.85 }}>CLEAR — 五大陸、灯った</div>
        <h2 style={{ margin: '2px 0 4px', fontSize: 'clamp(18px, 4.5vw, 26px)', letterSpacing: 2 }}>
          エンディング「{名}」
        </h2>
        <div style={{ fontSize: 12.5, maxWidth: '90%', lineHeight: 1.6, marginBottom: 8 }}>
          {ENDING_BLURB[名]}
        </div>
      </div>
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: '8px 6% 10px',
          background: 'linear-gradient(to top, rgba(10,6,14,0.82), rgba(10,6,14,0))',
        }}
      >
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '2px 14px', justifyContent: 'center',
          fontSize: 12.5, color: '#fff8e0', marginBottom: 4,
        }}>
          <span>🎡 大陸 {g.大陸.length}/5</span>
          <span>資金 {fmtMoney(g.資金)}</span>
          <span>評判「{fameWord(g.評判)}」</span>
          <span>仲間 {g.仲間.length ? g.仲間.join('・') : 'なし'}</span>
        </div>
        <div style={{ fontSize: 11.5, color: '#e8dcc8', textAlign: 'left', maxWidth: 480, margin: '0 auto 8px' }}>
          {trailLines(g).map((line, i) => <div key={i}>・{line}</div>)}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            className="lq-btn"
            onClick={() => {
              try { localStorage.removeItem(SAVE_KEY); } catch { /* noop */ }
              onExitToTitle();
            }}
          >
            🎡 タイトルへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}
