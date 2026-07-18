// ゲーム画面：タイル描画・歩行・会話ウィンドウ（ポケモン文法）・最小HUD・自動セーブ。

import { useCallback, useEffect, useRef, useState } from 'react';
import type { G, Step } from '../game/types';
import { MAPS, walkable } from '../game/maps';
import { GOALS, goalOf, sceneFor } from '../game/story';

const TILE = 30;
const SAVE_KEY = 'five-continents-save';

const COL = {
  grass: '#a8c058', grass2: '#9cb84e', path: '#d8c9a0', tree: '#3c6a3c',
  sea: '#39648f', route: '#7fa8c8', flower: '#e8b0c8',
  wall: '#c9a06a', roof: '#8a5a3c', door: '#4e2e18',
  ink: '#1a2c14', player: '#2f6fb0',
};

function newGame(): G {
  return { map: 'osaka', x: 14, y: 9, 資金: 300, 評判: 0, 仲間: [], stage: 0, flags: [], 大陸: [] };
}

function load(): G {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw) as G;
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
  const appliedRef = useRef<Set<number>>(new Set());

  const map = MAPS[g.map] ?? MAPS.osaka;

  // 自動セーブ
  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(g)); }, [g]);

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
    if (cur && 'choices' in cur) return; // 選択待ちはクリックで
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

  // 調べる：ポータル → 建物ドア → 隣接NPC
  const interact = useCallback(() => {
    if (scene) { advance(); return; }
    const portal = map.portals.find((p) => p.x === g.x && p.y === g.y);
    if (portal) {
      if (portal.条件 && !portal.条件(g)) {
        openScene([{ text: portal.拒否 ?? '（まだ行けない）' }]);
        return;
      }
      setG((prev) => ({ ...prev, map: portal.to, x: portal.tx, y: portal.ty }));
      return;
    }
    const b = map.buildings.find((bb) => bb.door.x === g.x && bb.door.y === g.y);
    if (b) {
      const s = sceneFor(b.id, g);
      if (s) openScene(s);
      else openScene([{ text: `${b.名前}。（今は特に用がない）` }]);
      return;
    }
    const npc = map.npcs.find((n) => (!n.条件 || n.条件(g)) && Math.abs(n.x - g.x) + Math.abs(n.y - g.y) <= 1);
    if (npc) {
      const s = sceneFor(npc.id, g);
      if (s) openScene(s);
    }
  }, [scene, advance, map, g, openScene]);

  // キー入力。リスナーは一度だけ登録し、最新の状態はrefで読む
  // （毎レンダー再登録すると、登録し直しの隙間で連打キーを取りこぼす）
  const interactRef = useRef(interact);
  interactRef.current = interact;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const gRef = useRef(g);
  gRef.current = g;

  // devデバッグフック（自動テスト用）：状態の読み取りとテレポート
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
      const mv: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0],
      };
      const d = mv[e.key];
      if (!d) return;
      e.preventDefault();
      setG((prev) => {
        const m = MAPS[prev.map];
        const nx = prev.x + d[0], ny = prev.y + d[1];
        return walkable(m, nx, ny) ? { ...prev, x: nx, y: ny } : prev;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 描画
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const W = map.grid[0].length, H = map.grid.length;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = map.grid[y][x];
        let c = (x + y) % 2 === 0 ? COL.grass : COL.grass2;
        if (t === '#') c = COL.tree;
        else if (t === '~') c = COL.sea;
        else if (t === '=') c = g.map === 'world' ? COL.route : COL.path;
        ctx.fillStyle = c;
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        if (t === 'o') {
          ctx.fillStyle = COL.flower;
          ctx.fillRect(x * TILE + 11, y * TILE + 11, 8, 8);
        }
        if (t === '~') {
          ctx.fillStyle = '#4a76a3';
          if ((x * 7 + y * 13) % 5 === 0) ctx.fillRect(x * TILE + 6, y * TILE + 14, 12, 2);
        }
      }
    }
    for (const b of map.buildings) {
      const v = b.変化?.(g);
      const 名前 = v?.名前 ?? b.名前;
      const アイコン = v?.アイコン ?? b.アイコン;
      ctx.fillStyle = COL.wall;
      ctx.fillRect(b.x * TILE, b.y * TILE, b.w * TILE, b.h * TILE);
      ctx.fillStyle = COL.roof;
      ctx.fillRect(b.x * TILE, b.y * TILE, b.w * TILE, TILE * 0.65);
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
      ctx.strokeRect(b.x * TILE + 1, b.y * TILE + 1, b.w * TILE - 2, b.h * TILE - 2);
      ctx.fillStyle = COL.ink;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '15px sans-serif';
      ctx.fillText(アイコン, (b.x + b.w / 2) * TILE, (b.y + 0.32) * TILE + 1);
      ctx.font = '10px DotGothic16, monospace';
      ctx.fillText(名前, (b.x + b.w / 2) * TILE, (b.y + b.h - 0.32) * TILE);
      ctx.fillStyle = COL.door;
      ctx.fillRect((b.door.x + 0.25) * TILE, (b.door.y + 0.12) * TILE, TILE * 0.5, TILE * 0.76);
    }
    for (const n of map.npcs) {
      if (n.条件 && !n.条件(g)) continue;
      ctx.fillStyle = COL.ink;
      ctx.beginPath(); ctx.arc((n.x + 0.5) * TILE, (n.y + 0.5) * TILE, TILE * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = n.色;
      ctx.beginPath(); ctx.arc((n.x + 0.5) * TILE, (n.y + 0.5) * TILE, TILE * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px DotGothic16, monospace';
      ctx.fillText(n.記号, (n.x + 0.5) * TILE, (n.y + 0.52) * TILE);
    }
    // プレイヤー
    ctx.fillStyle = COL.ink;
    ctx.fillRect(g.x * TILE + 5, g.y * TILE + 5, TILE - 10, TILE - 10);
    ctx.fillStyle = COL.player;
    ctx.fillRect(g.x * TILE + 7, g.y * TILE + 7, TILE - 14, TILE - 14);
  }, [g, map, scene]);

  const onPortalOrDoor =
    map.portals.some((p) => p.x === g.x && p.y === g.y) ||
    map.buildings.some((b) => b.door.x === g.x && b.door.y === g.y);

  const cur = scene?.[idx];
  const W = map.grid[0].length, H = map.grid.length;
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
        </div>
        <div className="lq-muted" style={{ marginTop: 2 }}>
          ▶ {goalOf(g)}　<span style={{ opacity: 0.7 }}>（{map.名前}）</span>
        </div>
      </div>

      {/* フィールド */}
      <div style={{ overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          width={W * TILE}
          height={H * TILE}
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
        <span className="lq-muted" style={{ marginLeft: 10 }}>全{GOALS.length}章＋終章／自動セーブ</span>
      </div>
    </div>
  );
}
