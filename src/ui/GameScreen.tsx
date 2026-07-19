// ゲーム画面 v0.2：カメラ追従の広大マップ・人型スプライト・詳細建物・BGM/SE。
// 会話UIとHUDはDOM、フィールドはrequestAnimationFrameで毎フレームcanvas描画。

import { useCallback, useEffect, useRef, useState } from 'react';
import type { G, Step } from '../game/types';
import { MAPS, walkable } from '../game/maps';
import { GOALS, goalOf, sceneFor } from '../game/story';
import { drawTiles, drawBuilding, TILE } from '../game/render';
import { drawSprite, HERO_PALETTE, type Facing, type SpritePalette } from '../game/sprites';
import { bgm, isMuted, se, setMuted, unlockAudio } from '../game/audio';

const SAVE_KEY = 'five-continents-save-v2';
const VIEW_W = 20;
const VIEW_H = 13;

function newGame(): G {
  return {
    map: 'osaka', x: 5, y: 12, 資金: 300, 評判: 0, 仲間: [], stage: 0, flags: [], 大陸: [],
    信念: 0, 実利: 0,
  };
}

function load(): G {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return { ...newGame(), ...(JSON.parse(raw) as Partial<G>) };
  } catch { /* 壊れたセーブは捨てる */ }
  return newGame();
}

function fmtMoney(man: number): string {
  if (man >= 10000) return `${(man / 10000).toFixed(1)}億円`;
  return `${Math.round(man)}万円`;
}

function fameWord(f: number): string {
  if (f >= 90) return '世界的';
  if (f >= 65) return '世界へ';
  if (f >= 45) return '全国区';
  if (f >= 25) return '業界で注目';
  if (f >= 10) return '地元で話題';
  return '無名';
}

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [g, setG] = useState<G>(load);
  const [scene, setScene] = useState<Step[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [muted, setMutedState] = useState(isMuted());
  const appliedRef = useRef<Set<number>>(new Set());
  const facingRef = useRef<Facing>('down');
  const stepFrameRef = useRef(0);

  const map = MAPS[g.map] ?? MAPS.osaka;

  // 自動セーブ
  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(g)); }, [g]);

  // BGM：マップごとに切替
  useEffect(() => {
    if (!muted) bgm.restart(g.map);
    return () => { /* 次のstartが止める */ };
  }, [g.map, muted]);

  // 開園ファンファーレ（大陸が増えた瞬間）
  const prevContinents = useRef(g.大陸.length);
  useEffect(() => {
    if (g.大陸.length > prevContinents.current) se.fanfare();
    prevContinents.current = g.大陸.length;
  }, [g.大陸.length]);

  // オーディオ解錠（最初の操作で）
  useEffect(() => {
    const unlock = () => { unlockAudio(); if (!isMuted()) bgm.restart(gRef.current.map); };
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => {
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('pointerdown', unlock);
    };
  }, []);

  const apply = useCallback((fn?: (s: G) => void) => {
    if (!fn) return;
    setG((prev) => { const c = JSON.parse(JSON.stringify(prev)) as G; fn(c); return c; });
  }, []);

  const openScene = useCallback((steps: Step[]) => {
    appliedRef.current = new Set();
    setScene(steps);
    setIdx(0);
    const first = steps[0];
    if (first && 'text' in first && first.effect) { appliedRef.current.add(0); apply(first.effect); }
  }, [apply]);

  const advance = useCallback(() => {
    if (!scene) return;
    const cur = scene[idx];
    if (cur && 'choices' in cur) return;
    se.blip();
    const next = idx + 1;
    if (next >= scene.length) { setScene(null); return; }
    const step = scene[next];
    if (step && 'text' in step && step.effect && !appliedRef.current.has(next)) {
      appliedRef.current.add(next);
      apply(step.effect);
    }
    setIdx(next);
  }, [scene, idx, apply]);

  const choose = useCallback((ci: number) => {
    if (!scene) return;
    const cur = scene[idx];
    if (!cur || !('choices' in cur)) return;
    se.coin();
    const c = cur.choices[ci];
    if (c.effect) apply(c.effect);
    const rest = scene.slice(idx + 1);
    const merged = [...(c.steps ?? []), ...rest];
    if (merged.length === 0) { setScene(null); return; }
    appliedRef.current = new Set();
    setScene(merged);
    setIdx(0);
    const first = merged[0];
    if (first && 'text' in first && first.effect) { appliedRef.current.add(0); apply(first.effect); }
  }, [scene, idx, apply]);

  const interact = useCallback(() => {
    if (scene) { advance(); return; }
    const portal = map.portals.find((p) => p.x === g.x && p.y === g.y);
    if (portal) {
      if (portal.条件 && !portal.条件(g)) {
        se.buzz();
        openScene([{ text: portal.拒否 ?? '（まだ行けない）' }]);
        return;
      }
      se.door();
      setG((prev) => ({ ...prev, map: portal.to, x: portal.tx, y: portal.ty }));
      return;
    }
    const b = map.buildings.find((bb) => bb.door.x === g.x && bb.door.y === g.y);
    if (b) {
      const s = sceneFor(b.id, g);
      se.door();
      openScene(s ?? [{ text: `${b.変化?.(g)?.名前 ?? b.名前}。（今は特に用がない）` }]);
      return;
    }
    const npc = map.npcs.find((n) => (!n.条件 || n.条件(g)) && Math.abs(n.x - g.x) + Math.abs(n.y - g.y) <= 1);
    if (npc) {
      const s = sceneFor(npc.id, g);
      if (s) { se.blip(); openScene(s); }
    }
  }, [scene, advance, map, g, openScene]);

  // キー入力（リスナーは一度だけ・最新はref）
  const interactRef = useRef(interact);
  interactRef.current = interact;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const gRef = useRef(g);
  gRef.current = g;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __lq?: unknown }).__lq = {
      get: () => gRef.current,
      set: (patch: Partial<G>) => setG((p) => ({ ...p, ...patch })),
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); interactRef.current(); return; }
      if (sceneRef.current) return;
      const mv: Record<string, [number, number, Facing]> = {
        ArrowUp: [0, -1, 'up'], w: [0, -1, 'up'],
        ArrowDown: [0, 1, 'down'], s: [0, 1, 'down'],
        ArrowLeft: [-1, 0, 'left'], a: [-1, 0, 'left'],
        ArrowRight: [1, 0, 'right'], d: [1, 0, 'right'],
      };
      const d = mv[e.key];
      if (!d) return;
      e.preventDefault();
      facingRef.current = d[2];
      setG((prev) => {
        const m = MAPS[prev.map];
        const nx = prev.x + d[0], ny = prev.y + d[1];
        if (!walkable(m, nx, ny)) return prev;
        stepFrameRef.current = (stepFrameRef.current + 1) % 2;
        return { ...prev, x: nx, y: ny };
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 描画：状態変化で即1フレーム＋rAFでアニメ（タブ非表示等でrAFが止まっても画面は最新に保つ）
  const drawNowRef = useRef<() => void>(() => {});
  useEffect(() => {
    const draw = (time: number) => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext('2d');
      const gg = gRef.current;
      const m = MAPS[gg.map] ?? MAPS.osaka;
      if (cv && ctx) {
        const mw = m.grid[0].length, mh = m.grid.length;
        const camX = Math.max(0, Math.min(gg.x - Math.floor(VIEW_W / 2), mw - VIEW_W));
        const camY = Math.max(0, Math.min(gg.y - Math.floor(VIEW_H / 2), mh - VIEW_H));
        drawTiles(ctx, m, camX, camY, VIEW_W, VIEW_H, time);
        for (const b of m.buildings) drawBuilding(ctx, b, gg, camX, camY, time);
        for (let i = 0; i < m.npcs.length; i++) {
          const n = m.npcs[i];
          if (n.条件 && !n.条件(gg)) continue;
          const bob = Math.sin(time / 420 + i * 1.7) * 1.5;
          const pal: SpritePalette = { ...HERO_PALETTE, ...n.palette };
          drawSprite(ctx, 'down', 0, pal, (n.x - camX) * TILE, (n.y - camY) * TILE + bob, TILE);
        }
        drawSprite(ctx, facingRef.current, stepFrameRef.current, HERO_PALETTE,
          (gg.x - camX) * TILE, (gg.y - camY) * TILE - 3, TILE);
      }
    };
    drawNowRef.current = () => draw(performance.now());
    let raf = 0;
    const loop = (t: number) => { draw(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => { drawNowRef.current(); }, [g, scene]);

  const onPortalOrDoor =
    map.portals.some((p) => p.x === g.x && p.y === g.y) ||
    map.buildings.some((b) => b.door.x === g.x && b.door.y === g.y);

  const cur = scene?.[idx];
  const progress = `${g.大陸.length}/5`;

  return (
    <div>
      {/* HUD */}
      <div className="lq-window" style={{ margin: '8px 0', padding: '8px 12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', alignItems: 'baseline' }}>
          <b>🎡 {progress}</b>
          <span>資金 {fmtMoney(g.資金)}</span>
          <span>評判「{fameWord(g.評判)}」</span>
          <span>仲間 {g.仲間.length ? g.仲間.join('・') : 'なし'}</span>
          <button
            className="lq-btn" style={{ padding: '2px 8px 2px 18px', marginLeft: 'auto' }}
            onClick={() => {
              const m = !muted;
              setMuted(m); setMutedState(m);
              if (!m) { unlockAudio(); bgm.restart(gRef.current.map); }
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
        <div className="lq-muted" style={{ marginTop: 2 }}>
          ▶ {goalOf(g)}　<span style={{ opacity: 0.7 }}>（{map.名前}）</span>
        </div>
      </div>

      {/* フィールド */}
      <div style={{ overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          width={VIEW_W * TILE}
          height={VIEW_H * TILE}
          className="pixel"
          style={{ border: '3px solid var(--frame)', maxWidth: '100%', display: 'block', margin: '0 auto' }}
          onClick={interact}
        />
      </div>
      {!scene && (
        <p className="lq-muted" style={{ textAlign: 'center', margin: '6px 0' }}>
          {onPortalOrDoor ? 'Enter / クリックで 調べる・入る' : '矢印キー / WASD で移動'}
        </p>
      )}

      {/* 会話ウィンドウ */}
      {scene && cur && 'text' in cur && (
        <div className="dialog-box" onClick={advance}>
          {cur.speaker && <div className="speaker">{cur.speaker}</div>}
          <div>{cur.text}<span className="next-arrow">▼</span></div>
        </div>
      )}
      {scene && cur && 'choices' in cur && (
        <div className="dialog-box" style={{ cursor: 'default' }}>
          {cur.choices.map((c, i) => (
            <div key={i}>
              <button className="lq-btn" onClick={() => choose(i)}>{c.label}</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <button
          className="lq-btn"
          onClick={() => {
            if (window.confirm('最初からやり直しますか？（セーブは消えます）')) {
              localStorage.removeItem(SAVE_KEY);
              setScene(null);
              setG(newGame());
            }
          }}
        >
          はじめから
        </button>
        <span className="lq-muted" style={{ marginLeft: 10 }}>
          全{GOALS.length}章＋世界航路＋終章（エンディング5種）／自動セーブ
        </span>
      </div>
    </div>
  );
}
