// 建物内部（v0.3）。全建物共通の7×5間取り——奥に接客カウンター（attendant）、
// 手前に出口。位置を統一することで新たな詰まりを生まない。装飾だけスタイルで変える。

import type { Building, BuildingStyle, Furniture, Interior } from './types';

export const INT_W = 7;
export const INT_H = 5;
export const ATTENDANT: [number, number] = [3, 1];
export const START: [number, number] = [3, 3];
export const EXIT: [number, number] = [3, 4];

/** スタイル別の装飾（左右の据え置き＋床色）。当たり判定には関与しない＝純粋な見た目 */
const DECOR: Record<BuildingStyle, { left: string; right: string; floor: string; wall: string }> = {
  house:      { left: '🛏', right: '🪟', floor: '#e8dcc0', wall: '#c9a06a' },
  cafe:       { left: '☕', right: '🪴', floor: '#d8c0a0', wall: '#8a5a3c' },
  gallery:    { left: '🖼', right: '🖼', floor: '#e8e4d8', wall: '#4a5a6a' },
  office:     { left: '💻', right: '🪴', floor: '#d0d8e0', wall: '#5a6470' },
  tower:      { left: '📊', right: '🌆', floor: '#c8d0dc', wall: '#3c4650' },
  station:    { left: '🎫', right: '🕰', floor: '#d8c9a0', wall: '#6a7a4a' },
  shrine:     { left: '🎐', right: '🎐', floor: '#f0e8d8', wall: '#c23b22' },
  school:     { left: '📚', right: '🖊', floor: '#e0d8b8', wall: '#7a5a3c' },
  townhall:   { left: '🚩', right: '📋', floor: '#e0e0d0', wall: '#4a6a5a' },
  workshop:   { left: '🔧', right: '📐', floor: '#c9a06a', wall: '#6a5240' },
  warehouse:  { left: '📦', right: '📦', floor: '#b8a890', wall: '#5a5048' },
  clocktower: { left: '🕰', right: '📜', floor: '#e8dcc8', wall: '#3c5a7a' },
  port:       { left: '⚓', right: '🪢', floor: '#b8c4c8', wall: '#2f6fb0' },
  park:       { left: '🎟', right: '🧸', floor: '#f0d8b0', wall: '#d85a8a' },
};

export function decorOf(style: BuildingStyle) { return DECOR[style]; }

/** 汎用の建物内部を作る。attendantId未指定なら人はいない（家具だけの部屋） */
export function makeInterior(style: BuildingStyle, attendantId?: string): Interior {
  const d = DECOR[style];
  const furniture: Furniture[] = [
    { x: 1, y: 1, icon: d.left },
    { x: 5, y: 1, icon: d.right },
  ];
  return {
    w: INT_W, h: INT_H, furniture,
    exit: { x: EXIT[0], y: EXIT[1] },
    start: { x: START[0], y: START[1] },
    attendant: attendantId ? { x: ATTENDANT[0], y: ATTENDANT[1], id: attendantId } : undefined,
  };
}

/** 内部の当たり判定：出口タイルは境界上でも常に歩ける。それ以外の外周壁とカウンターはブロック */
export function interiorWalkable(interior: Interior, x: number, y: number): boolean {
  if (x === interior.exit.x && y === interior.exit.y) return true;
  if (x <= 0 || y <= 0 || x >= interior.w - 1 || y >= interior.h - 1) return false;
  if (interior.attendant && x === interior.attendant.x && y === interior.attendant.y) return false;
  return true;
}

/** 建物にenterable+interiorを一括付与するショートハンド */
export function withInterior<T extends Omit<Building, 'interior' | 'enterable'>>(
  b: T, attendantId?: string,
): Building {
  return { ...b, enterable: true, interior: () => makeInterior(b.style, attendantId ?? b.id) };
}
