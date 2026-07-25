// 建物内部（v0.4）。全建物共通の7×5間取り——奥に接客カウンター（attendant）、
// 手前に出口。位置を統一することで新たな詰まりを生まない。装飾だけスタイルで変える。
// v0.4：家具を四隅4点に増量＋床の市松模様(accent)＋カウンター奥のラグ(rug)＋
// 背面の壁装飾(deco)を追加し、「家具アイコン＋床壁色のみ」だった見た目を作り込んだ。

import type { Building, BuildingStyle, Furniture, Interior } from './types';

export const INT_W = 7;
export const INT_H = 5;
export const ATTENDANT: [number, number] = [3, 1];
export const START: [number, number] = [3, 3];
export const EXIT: [number, number] = [3, 4];
/** 四隅の家具座席（当たり判定には関与しない外周内側マス） */
export const CORNERS: [number, number][] = [[1, 1], [5, 1], [1, 3], [5, 3]];

/** スタイル別の装飾。当たり判定には関与しない＝純粋な見た目 */
interface Decor {
  /** 四隅に置く家具アイコン（左上・右上・左下・右下） */
  corners: [string, string, string, string];
  floor: string;
  /** 床の市松模様の相方色 */
  accent: string;
  wall: string;
  /** カウンター奥に敷くラグの色 */
  rug: string;
  /** 背面の壁（カウンター上）に掲げる装飾アイコン */
  deco: string;
}

const DECOR: Record<BuildingStyle, Decor> = {
  house:      { corners: ['🛏', '🪟', '📷', '🧺'], floor: '#e8dcc0', accent: '#ddcfa8', wall: '#c9a06a', rug: '#b23b3b', deco: '🖼' },
  cafe:       { corners: ['☕', '🪴', '🍰', '🧁'], floor: '#d8c0a0', accent: '#cdb08c', wall: '#8a5a3c', rug: '#8a3c2a', deco: '📜' },
  gallery:    { corners: ['🖼', '🖼', '🗿', '🖼'], floor: '#e8e4d8', accent: '#dcd8c8', wall: '#4a5a6a', rug: '#7a4bbf', deco: '🎨' },
  office:     { corners: ['💻', '🪴', '🗄', '📎'], floor: '#d0d8e0', accent: '#c2ccd6', wall: '#5a6470', rug: '#3c4650', deco: '📈' },
  tower:      { corners: ['📊', '🌆', '💹', '🗂'], floor: '#c8d0dc', accent: '#b9c2d0', wall: '#3c4650', rug: '#24303c', deco: '🏙' },
  station:    { corners: ['🎫', '🕰', '🧳', '🚦'], floor: '#d8c9a0', accent: '#ccbb8e', wall: '#6a7a4a', rug: '#4a5a34', deco: '🚉' },
  shrine:     { corners: ['🎐', '🎐', '🍡', '📿'], floor: '#f0e8d8', accent: '#e6dcc4', wall: '#c23b22', rug: '#f0e8d8', deco: '⛩' },
  school:     { corners: ['📚', '🖊', '🎒', '🏀'], floor: '#e0d8b8', accent: '#d4caa4', wall: '#7a5a3c', rug: '#3a5a3c', deco: '🔔' },
  townhall:   { corners: ['🚩', '📋', '🗳', '📌'], floor: '#e0e0d0', accent: '#d2d2be', wall: '#4a6a5a', rug: '#2f4a3c', deco: '🏛' },
  workshop:   { corners: ['🔧', '📐', '🪚', '🧰'], floor: '#c9a06a', accent: '#bb905a', wall: '#6a5240', rug: '#4a3a2a', deco: '📐' },
  warehouse:  { corners: ['📦', '📦', '🧱', '📦'], floor: '#b8a890', accent: '#aa9c82', wall: '#5a5048', rug: '#423a32', deco: '📋' },
  clocktower: { corners: ['🕰', '📜', '🗝', '📯'], floor: '#e8dcc8', accent: '#dccebc', wall: '#3c5a7a', rug: '#24384c', deco: '🕰' },
  port:       { corners: ['⚓', '🪢', '🐚', '🧭'], floor: '#b8c4c8', accent: '#a9b8bc', wall: '#2f6fb0', rug: '#1e4a78', deco: '⚓' },
  park:       { corners: ['🎟', '🧸', '🍭', '🎈'], floor: '#f0d8b0', accent: '#e4c896', wall: '#d85a8a', rug: '#b0396a', deco: '🎡' },
};

export function decorOf(style: BuildingStyle) { return DECOR[style]; }

/** 汎用の建物内部を作る。attendantId未指定なら人はいない（家具だけの部屋） */
export function makeInterior(style: BuildingStyle, attendantId?: string): Interior {
  const d = DECOR[style];
  const furniture: Furniture[] = CORNERS.map(([x, y], i) => ({ x, y, icon: d.corners[i] }));
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
