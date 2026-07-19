// 描画（v0.2）。タイル・建物・観覧車をcanvasに手続き描画する。
// 建物はスタイルごとに壁色・屋根・窓・付帯物（時計/暖簾/煙突/クレーン等）を変える。

import type { Building, BuildingStyle, G, MapDef } from './types';

export const TILE = 32;

const T = TILE;

// ---- タイル ----

const TILE_COL = {
  grass: '#a8c058', grass2: '#9cb84e', path: '#d8c9a0', pathEdge: '#c4b088',
  sea: '#39648f', seaDeep: '#2d5379', route: '#5f88ad',
  tree: '#3c6a3c', treeDark: '#2c5030', trunk: '#5a3a1c',
  mountain: '#8a8a7a', mountainSnow: '#e8e8e0', mountainDark: '#6a6a5c',
  flowerA: '#e8b0c8', flowerB: '#ffe86b',
  bridge: '#b08a5a', bridgeDark: '#8a6a40',
  rice: '#7aa048', riceDark: '#5a8038',
  ink: '#1a2c14',
};

export function drawTile(
  ctx: CanvasRenderingContext2D, ch: string, px: number, py: number, gx: number, gy: number, time: number,
): void {
  const checker = (gx + gy) % 2 === 0;
  switch (ch) {
    case '#': // 木：草の上に樹冠＋幹
      ctx.fillStyle = checker ? TILE_COL.grass : TILE_COL.grass2;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = TILE_COL.trunk;
      ctx.fillRect(px + T * 0.42, py + T * 0.62, T * 0.16, T * 0.3);
      ctx.fillStyle = TILE_COL.tree;
      ctx.beginPath(); ctx.arc(px + T / 2, py + T * 0.4, T * 0.36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = TILE_COL.treeDark;
      ctx.beginPath(); ctx.arc(px + T * 0.62, py + T * 0.48, T * 0.2, 0, Math.PI * 2); ctx.fill();
      break;
    case '~': { // 水：ゆらぎのハイライト
      ctx.fillStyle = checker ? TILE_COL.sea : TILE_COL.seaDeep;
      ctx.fillRect(px, py, T, T);
      const ph = Math.sin(time / 700 + gx * 1.3 + gy * 0.7);
      if (ph > 0.3) {
        ctx.fillStyle = '#5a86ad';
        ctx.fillRect(px + T * 0.15, py + T * 0.45, T * 0.4, 2);
      }
      break;
    }
    case '=': // 道（世界航路では航路の点線に見える色をGameScreen側で選ばない——ここで統一）
      ctx.fillStyle = TILE_COL.path;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = TILE_COL.pathEdge;
      if ((gx + gy) % 3 === 0) ctx.fillRect(px + T * 0.3, py + T * 0.3, 3, 3);
      break;
    case 'M': // 山：三角＋雪
      ctx.fillStyle = checker ? TILE_COL.grass : TILE_COL.grass2;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = TILE_COL.mountain;
      ctx.beginPath();
      ctx.moveTo(px + T * 0.1, py + T * 0.95);
      ctx.lineTo(px + T * 0.5, py + T * 0.08);
      ctx.lineTo(px + T * 0.9, py + T * 0.95);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = TILE_COL.mountainDark;
      ctx.beginPath();
      ctx.moveTo(px + T * 0.5, py + T * 0.08);
      ctx.lineTo(px + T * 0.9, py + T * 0.95);
      ctx.lineTo(px + T * 0.62, py + T * 0.95);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = TILE_COL.mountainSnow;
      ctx.beginPath();
      ctx.moveTo(px + T * 0.38, py + T * 0.34);
      ctx.lineTo(px + T * 0.5, py + T * 0.08);
      ctx.lineTo(px + T * 0.62, py + T * 0.34);
      ctx.closePath(); ctx.fill();
      break;
    case 'o': // 花
      ctx.fillStyle = checker ? TILE_COL.grass : TILE_COL.grass2;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = (gx * 7 + gy * 3) % 2 === 0 ? TILE_COL.flowerA : TILE_COL.flowerB;
      ctx.fillRect(px + T * 0.3, py + T * 0.3, 5, 5);
      ctx.fillRect(px + T * 0.6, py + T * 0.55, 4, 4);
      break;
    case 'b': // 橋
      ctx.fillStyle = TILE_COL.bridge;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = TILE_COL.bridgeDark;
      for (let i = 0; i < 4; i++) ctx.fillRect(px, py + (i + 0.35) * T / 4, T, 2);
      break;
    case 'r': // 田んぼ
      ctx.fillStyle = TILE_COL.rice;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = TILE_COL.riceDark;
      for (let i = 0; i < 3; i++) ctx.fillRect(px + 2, py + (i + 0.5) * T / 3, T - 4, 2);
      break;
    case 'T': // 鳥居
      ctx.fillStyle = checker ? TILE_COL.grass : TILE_COL.grass2;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = '#c23b22';
      ctx.fillRect(px + T * 0.15, py + T * 0.12, T * 0.12, T * 0.8);
      ctx.fillRect(px + T * 0.73, py + T * 0.12, T * 0.12, T * 0.8);
      ctx.fillRect(px + T * 0.05, py + T * 0.1, T * 0.9, T * 0.14);
      ctx.fillRect(px + T * 0.12, py + T * 0.32, T * 0.76, T * 0.1);
      break;
    default: // 草
      ctx.fillStyle = checker ? TILE_COL.grass : TILE_COL.grass2;
      ctx.fillRect(px, py, T, T);
      if ((gx * 13 + gy * 7) % 11 === 0) {
        ctx.fillStyle = TILE_COL.grass2;
        ctx.fillRect(px + T * 0.2, py + T * 0.6, 2, 4);
        ctx.fillRect(px + T * 0.7, py + T * 0.3, 2, 4);
      }
  }
}

// ---- 建物 ----

interface StyleSpec { wall: string; wallShade: string; roof: string; roofLight: string; window: string }

const STYLES: Record<BuildingStyle, StyleSpec> = {
  house:      { wall: '#e0cfa8', wallShade: '#c9b58a', roof: '#a04a30', roofLight: '#c06848', window: '#ffe86b' },
  cafe:       { wall: '#e8d8c0', wallShade: '#d0bc9c', roof: '#6a4028', roofLight: '#8a5a3c', window: '#ffd884' },
  gallery:    { wall: '#f0ece0', wallShade: '#d4cfbe', roof: '#4a5a6a', roofLight: '#6a7a8a', window: '#cfe8ff' },
  office:     { wall: '#c8d0d8', wallShade: '#a8b2bc', roof: '#5a6470', roofLight: '#788492', window: '#bfe0ff' },
  tower:      { wall: '#9aa8b8', wallShade: '#7e8c9c', roof: '#3c4650', roofLight: '#586470', window: '#e0f0ff' },
  station:    { wall: '#d8c9a0', wallShade: '#bcae86', roof: '#6a7a4a', roofLight: '#8a9a64', window: '#fff0b0' },
  shrine:     { wall: '#f0e8d8', wallShade: '#d8cfba', roof: '#c23b22', roofLight: '#d85a40', window: '#f0e8d8' },
  school:     { wall: '#e8e0c8', wallShade: '#ccc4aa', roof: '#7a5a3c', roofLight: '#96745a', window: '#d8f0ff' },
  townhall:   { wall: '#e0e0d0', wallShade: '#c4c4b2', roof: '#4a6a5a', roofLight: '#648a76', window: '#f0f0d8' },
  workshop:   { wall: '#c9a06a', wallShade: '#ab854e', roof: '#6a5240', roofLight: '#867058', window: '#ffe0a0' },
  warehouse:  { wall: '#a89888', wallShade: '#8a7c6e', roof: '#5a5048', roofLight: '#746860', window: '#b8ae9e' },
  clocktower: { wall: '#e8dcc8', wallShade: '#ccc0ac', roof: '#3c5a7a', roofLight: '#5a7a9a', window: '#fff0c0' },
  port:       { wall: '#b8c4c8', wallShade: '#9aa8ac', roof: '#2f6fb0', roofLight: '#4a8ac8', window: '#d8f0ff' },
  park:       { wall: '#f0d8b0', wallShade: '#d4bc94', roof: '#d85a8a', roofLight: '#f07aa8', window: '#fff0b0' },
};

export function drawBuilding(
  ctx: CanvasRenderingContext2D, b: Building, g: G, camX: number, camY: number, time: number,
): void {
  const v = b.変化?.(g);
  const style = v?.style ?? b.style;
  const 名前 = v?.名前 ?? b.名前;
  const sp = STYLES[style];
  const px = (b.x - camX) * T, py = (b.y - camY) * T;
  const w = b.w * T, h = b.h * T;
  const roofH = T * 0.85;

  // 壁＋陰影
  ctx.fillStyle = sp.wall;
  ctx.fillRect(px, py + roofH, w, h - roofH);
  ctx.fillStyle = sp.wallShade;
  ctx.fillRect(px, py + roofH, 3, h - roofH);
  ctx.fillRect(px + w - 3, py + roofH, 3, h - roofH);
  ctx.fillRect(px, py + h - 3, w, 3);

  // 屋根（軒の張り出し＋棟のハイライト＋軒下の影）
  ctx.fillStyle = sp.roof;
  ctx.fillRect(px - 3, py, w + 6, roofH);
  ctx.fillStyle = sp.roofLight;
  ctx.fillRect(px - 3, py, w + 6, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(px - 3, py + roofH - 3, w + 6, 3);

  // 窓（ドア列を避けて格子配置・時間で一部が消灯）
  const doorCol = b.door.x - b.x;
  const winRows = b.h >= 3 ? 2 : 1;
  for (let r = 0; r < winRows; r++) {
    const wy = py + roofH + 6 + r * (T * 0.9);
    if (wy + T * 0.45 > py + h - 4) continue;
    for (let c = 0; c < b.w; c++) {
      if (r === winRows - 1 && c === doorCol) continue;
      const lit = (c * 5 + r * 3 + b.x + b.y) % 4 !== 0;
      ctx.fillStyle = TILE_COL.ink;
      ctx.fillRect(px + c * T + T * 0.24, wy, T * 0.52, T * 0.5);
      ctx.fillStyle = lit ? sp.window : sp.wallShade;
      ctx.fillRect(px + c * T + T * 0.28, wy + 2, T * 0.44, T * 0.42);
      ctx.fillStyle = TILE_COL.ink + '55';
      ctx.fillRect(px + c * T + T * 0.28, wy + T * 0.22, T * 0.44, 1.5);
    }
  }

  // ドア（枠＋扉＋踏み段。ドアタイルの上に描く）
  const dx = (b.door.x - camX) * T, dyTop = py + h - T * 0.95;
  ctx.fillStyle = TILE_COL.ink;
  ctx.fillRect(dx + T * 0.18, dyTop, T * 0.64, T * 0.95);
  ctx.fillStyle = '#4e2e18';
  ctx.fillRect(dx + T * 0.24, dyTop + 3, T * 0.52, T * 0.9);
  ctx.fillStyle = '#ffe86b';
  ctx.fillRect(dx + T * 0.62, dyTop + T * 0.5, 3, 3); // ノブ
  ctx.fillStyle = TILE_COL.pathEdge;
  ctx.fillRect(dx + T * 0.12, (b.door.y - camY) * T + 1, T * 0.76, 4); // 踏み段

  // ---- スタイル別の付帯物 ----
  const cx = px + w / 2;
  if (style === 'cafe') { // 縞の日よけ
    for (let i = 0; i < Math.floor(w / 10); i++) {
      ctx.fillStyle = i % 2 === 0 ? '#d24b3a' : '#f0ece0';
      ctx.fillRect(px + i * 10, py + roofH, 10, 7);
    }
  }
  if (style === 'gallery') { // 垂れ幕
    ctx.fillStyle = '#7a4bbf';
    ctx.fillRect(cx - 5, py + roofH + 2, 10, h - roofH - 10);
    ctx.fillStyle = '#f0ece0';
    ctx.fillRect(cx - 3, py + roofH + 6, 6, 6);
  }
  if (style === 'shrine') { // しめ縄
    ctx.fillStyle = '#e8d8a0';
    ctx.fillRect(px + 4, py + roofH + 2, w - 8, 4);
  }
  if (style === 'school' || style === 'townhall' || style === 'clocktower') { // 時計
    const cy = py + roofH * 0.5;
    ctx.fillStyle = '#f0ece0';
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = TILE_COL.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 3.5, cy + 1); ctx.stroke();
  }
  if (style === 'clocktower' || style === 'tower') { // 塔屋
    ctx.fillStyle = sp.roof;
    ctx.fillRect(cx - T * 0.35, py - T * 0.8, T * 0.7, T * 0.8);
    ctx.fillStyle = sp.roofLight;
    ctx.beginPath();
    ctx.moveTo(cx - T * 0.45, py - T * 0.8);
    ctx.lineTo(cx, py - T * 1.25);
    ctx.lineTo(cx + T * 0.45, py - T * 0.8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = sp.window;
    ctx.fillRect(cx - 4, py - T * 0.6, 8, 9);
  }
  if (style === 'workshop') { // 天窓＋煙突
    ctx.fillStyle = sp.window;
    ctx.fillRect(cx - T * 0.4, py + 6, T * 0.8, roofH * 0.4);
    ctx.strokeStyle = TILE_COL.ink; ctx.lineWidth = 1;
    ctx.strokeRect(cx - T * 0.4, py + 6, T * 0.8, roofH * 0.4);
    ctx.fillStyle = sp.wallShade;
    ctx.fillRect(px + w - T * 0.5, py - T * 0.4, T * 0.28, T * 0.5);
  }
  if (style === 'warehouse') { // シャッター線
    ctx.strokeStyle = TILE_COL.ink + '44'; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(px + 6, py + roofH + (h - roofH) * i / 4);
      ctx.lineTo(px + w - 6, py + roofH + (h - roofH) * i / 4);
      ctx.stroke();
    }
  }
  if (style === 'port') { // クレーン
    ctx.strokeStyle = '#5a6470'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + w - 6, py + roofH);
    ctx.lineTo(px + w - 6, py - T * 0.7);
    ctx.lineTo(px + w + T * 0.5, py - T * 0.4);
    ctx.stroke();
    ctx.strokeStyle = '#3c4650'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + w + T * 0.5, py - T * 0.4);
    ctx.lineTo(px + w + T * 0.5, py + T * 0.2);
    ctx.stroke();
  }
  if (style === 'station') { // 看板
    ctx.fillStyle = '#f0ece0';
    ctx.fillRect(cx - T * 0.6, py + roofH + 3, T * 1.2, 9);
    ctx.strokeStyle = TILE_COL.ink; ctx.lineWidth = 1;
    ctx.strokeRect(cx - T * 0.6, py + roofH + 3, T * 1.2, 9);
  }
  if (style === 'park') { // 観覧車（回る）＋ゲート旗
    drawFerrisWheel(ctx, cx, py - T * 0.4, T * 1.35, time);
    for (let i = 0; i < b.w; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#d24b3a' : '#ffe86b';
      ctx.beginPath();
      ctx.moveTo(px + i * T + 4, py + roofH + 1);
      ctx.lineTo(px + i * T + T / 2, py + roofH + 9);
      ctx.lineTo(px + i * T + T - 4, py + roofH + 1);
      ctx.closePath(); ctx.fill();
    }
  }

  // 名前（建物の下）
  ctx.fillStyle = TILE_COL.ink;
  ctx.font = '10px DotGothic16, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(名前, cx, py + h + 2);
}

const CABIN_COLORS = ['#d24b3a', '#ffe86b', '#2f6fb0', '#3c8a4a', '#7a4bbf', '#c85a28', '#b02f6f', '#f0ece0'];

/** 回転する観覧車。cx=中心x、baseY=支柱の足元 */
export function drawFerrisWheel(ctx: CanvasRenderingContext2D, cx: number, baseY: number, r: number, time: number): void {
  const cy = baseY - r - 6;
  // 支柱
  ctx.strokeStyle = '#5a6470'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.5, baseY); ctx.lineTo(cx, cy);
  ctx.lineTo(cx + r * 0.5, baseY);
  ctx.stroke();
  // 輪
  ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  // スポーク＋ゴンドラ
  const a0 = time / 4000;
  for (let i = 0; i < 8; i++) {
    const a = a0 + (i * Math.PI) / 4;
    const gx = cx + Math.cos(a) * r, gy = cy + Math.sin(a) * r;
    ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(gx, gy); ctx.stroke();
    ctx.fillStyle = CABIN_COLORS[i];
    ctx.fillRect(gx - 4, gy - 2, 8, 7);
    ctx.strokeStyle = '#1a2c14'; ctx.lineWidth = 1;
    ctx.strokeRect(gx - 4, gy - 2, 8, 7);
  }
  // 軸
  ctx.fillStyle = '#3c4650';
  ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
}

/** マップ全景のうちビューポート内を描く（タイルのみ。建物・人物は呼び出し側） */
export function drawTiles(
  ctx: CanvasRenderingContext2D, map: MapDef, camX: number, camY: number, viewW: number, viewH: number, time: number,
): void {
  for (let y = 0; y < viewH; y++) {
    for (let x = 0; x < viewW; x++) {
      const gx = camX + x, gy = camY + y;
      const ch = map.grid[gy]?.[gx] ?? '~';
      drawTile(ctx, ch, x * T, y * T, gx, gy, time);
    }
  }
}
