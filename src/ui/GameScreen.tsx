// ゲーム画面 v0.3：カメラ追従の広大マップ・人型スプライト・建物内部・カットイン演出・BGM/SE。
// 会話UIとHUDはDOM、フィールド/内部/vistaはrequestAnimationFrameで毎フレームcanvas描画。

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Building, G, Step } from '../game/types';
import { MAPS, walkable } from '../game/maps';
import { GOALS, goalOf, sceneFor } from '../game/story';
import { drawTiles, drawBuilding, drawInterior, drawVista, TILE } from '../game/render';
import { drawSprite, HERO_PALETTE, type Facing, type SpritePalette } from '../game/sprites';
import { interiorWalkable } from '../game/interiors';
import { bgm, isMuted, se, setMuted, unlockAudio } from '../game/audio';

const SAVE_KEY = 'five-continents-save-v3';
const VIEW_W = 20;
const VIEW_H = 13;
const CANVAS_W = VIEW_W * TILE;
const CANVAS_H = VIEW_H * TILE;

function newGame(): G {
  return {
    map: 'osaka', x: 5, y: 12, 資金: 300, 評判: 0, 仲間: [], stage: 0, flags: [], 大陸: [],
    信念: 0, 実利: 0, パーク: {},
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

function stepVista(step: Step | undefined): string | undefined {
  if (!step) return undefined;
  return step.vista;
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
  const insideBuilding: Building | undefined = g.inside
    ? map.buildings.find((b) => b.id === g.inside!.id)
    : undefined;
  const interior = insideBuilding?.interior?.(g);

  // 自動セーブ
  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(g)); }, [g]);

  // BGM：マップごとに切替（屋内では少し落ち着かせたいが、単純化のため同じ曲を継続）
  useEffect(() => {
    if (!muted) bgm.restart(g.map);
  }, [g.map, muted]);

  // 開園ファンファーレ（大陸が増えた瞬間）
  const prevContinents = useRef(g.大陸.length);
  useEffect(() => {
    if (g.大陸.length > prevContinents.current) se.fanfare();
    prevContinents.current = g.大陸.length;
  }, [g.大陸.length]);

  const gRef = useRef(g);
  gRef.current = g;

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
    const gg = gRef.current;

    // ---- 屋内 ----
    if (gg.inside && insideBuilding && interior) {
      if (interior.attendant) {
        const dx = Math.abs(gg.inside.x - interior.attendant.x);
        const dy = Math.abs(gg.inside.y - interior.attendant.y);
        if (dx + dy <= 1) {
          const s = sceneFor(interior.attendant.id, gg);
          if (s) { se.blip(); openScene(s); }
          return;
        }
      }
      if (gg.inside.x === interior.exit.x && gg.inside.y === interior.exit.y) {
        se.door();
        setG((prev) => ({ ...prev, inside: undefined }));
      }
      return;
    }

    // ---- 屋外：ポータル ----
    const portal = map.portals.find((p) => p.x === gg.x && p.y === gg.y);
    if (portal) {
      if (portal.条件 && !portal.条件(gg)) {
        se.buzz();
        openScene([{ text: portal.拒否 ?? '（まだ行けない）' }]);
        return;
      }
      se.door();
      setG((prev) => ({ ...prev, map: portal.to, x: portal.tx, y: portal.ty }));
      return;
    }

    // ---- 屋外：建物のドア ----
    const b = map.buildings.find((bb) => bb.door.x === gg.x && bb.door.y === gg.y);
    if (b) {
      if (b.enterable && b.interior) {
        const room = b.interior(gg);
        se.door();
        setG((prev) => ({ ...prev, inside: { id: b.id, x: room.start.x, y: room.start.y } }));
        return;
      }
      const s = sceneFor(b.id, gg);
      se.door();
      openScene(s ?? [{ text: `${b.変化?.(gg)?.名前 ?? b.名前}。（今は特に用がない）` }]);
      return;
    }

    // ---- 屋外：NPC ----
    const npc = map.npcs.find((n) => (!n.条件 || n.条件(gg)) && Math.abs(n.x - gg.x) + Math.abs(n.y - gg.y) <= 1);
    if (npc) {
      const s = sceneFor(npc.id, gg);
      if (s) { se.blip(); openScene(s); }
    }
  }, [scene, advance, map, insideBuilding, interior, openScene]);

  // キー入力（リスナーは一度だけ・最新はref）
  const interactRef = useRef(interact);
  interactRef.current = interact;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

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
        // ---- 屋内の移動 ----
        if (prev.inside) {
          const b = MAPS[prev.map]?.buildings.find((bb) => bb.id === prev.inside!.id);
          const room = b?.interior?.(prev);
          if (!b || !room) return prev;
          const nx = prev.inside.x + d[0], ny = prev.inside.y + d[1];
          if (!interiorWalkable(room, nx, ny)) return prev;
          stepFrameRef.current = (stepFrameRef.current + 1) % 2;
          // 出口タイルを踏んだら自動で外へ（ポケモンのドア文法）
          if (nx === room.exit.x && ny === room.exit.y) {
            return { ...prev, inside: undefined };
          }
          return { ...prev, inside: { id: prev.inside.id, x: nx, y: ny } };
        }
        // ---- 屋外の移動（NPC衝突判定つき） ----
        const m = MAPS[prev.map];
        const nx = prev.x + d[0], ny = prev.y + d[1];
        if (!walkable(m, nx, ny)) return prev;
        const blockedByNpc = m.npcs.some((n) => (!n.条件 || n.条件(prev)) && n.x === nx && n.y === ny);
        if (blockedByNpc) return prev;
        stepFrameRef.current = (stepFrameRef.current + 1) % 2;
        return { ...prev, x: nx, y: ny };
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const cur = scene?.[idx];
  const activeVista = stepVista(cur);

  // 描画：状態変化で即1フレーム＋rAFでアニメ
  const drawNowRef = useRef<() => void>(() => {});
  useEffect(() => {
    const draw = (time: number) => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext('2d');
      if (!cv || !ctx) return;
      const gg = gRef.current;
      const sc = sceneRef.current;
      const curStep = sc ? sc[idx] : undefined; // idxはeffect依存に含めているので最新
      const vista = stepVista(curStep);

      if (vista) {
        const drawn = drawVista(ctx, vista, CANVAS_W, CANVAS_H, time);
        if (drawn) return;
      }

      if (gg.inside) {
        const b = MAPS[gg.map]?.buildings.find((bb) => bb.id === gg.inside!.id);
        const room = b?.interior?.(gg);
        if (b && room) {
          ctx.fillStyle = '#0f1a0b';
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
          const ox = (CANVAS_W - room.w * TILE) / 2, oy = (CANVAS_H - room.h * TILE) / 2;
          drawInterior(ctx, room, b.style, ox, oy);
          if (room.attendant) {
            drawSprite(ctx, 'down', 0, HERO_PALETTE,
              ox + room.attendant.x * TILE, oy + room.attendant.y * TILE - 3, TILE);
          }
          drawSprite(ctx, facingRef.current, stepFrameRef.current, HERO_PALETTE,
            ox + gg.inside.x * TILE, oy + gg.inside.y * TILE - 3, TILE);
        }
        return;
      }

      const m = MAPS[gg.map] ?? MAPS.osaka;
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
    };
    drawNowRef.current = () => draw(performance.now());
    let raf = 0;
    const loop = (time: number) => { draw(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [idx]);
  useEffect(() => { drawNowRef.current(); }, [g, scene]);

  const onPortalOrDoor = g.inside
    ? false
    : map.portals.some((p) => p.x === g.x && p.y === g.y) || map.buildings.some((b) => b.door.x === g.x && b.door.y === g.y);

  const progress = `${g.大陸.length}/5`;
  const chapter = map.名前;

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
          ▶ {goalOf(g)}　<span style={{ opacity: 0.7 }}>（{g.inside ? `${chapter}・屋内` : chapter}）</span>
        </div>
      </div>

      {/* フィールド／屋内／カットイン */}
      <div style={{ overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="pixel"
          style={{ border: '3px solid var(--frame)', maxWidth: '100%', display: 'block', margin: '0 auto' }}
          onClick={interact}
        />
      </div>
      {!scene && !activeVista && (
        <p className="lq-muted" style={{ textAlign: 'center', margin: '6px 0' }}>
          {g.inside
            ? '矢印/WASDで歩く・カウンターでEnter・出口で外へ'
            : onPortalOrDoor ? 'Enter / クリックで 調べる・入る' : '矢印キー / WASD で移動'}
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
