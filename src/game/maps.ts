// マップ定義（v0.2・広大化）。グリッドはビルダー関数で生成（手書きASCIIはズレるため）。
// タイル: '.'草 '='道 '~'水 '#'木 'M'山 'o'花 'b'橋 'r'田 'T'鳥居。ブロック＝ '#','~','M'＋建物。
// 大阪30×20／ビジネス街28×16／里山町32×20／欧州30×18／世界航路48×28（壮大の主役）。

import type { G, MapDef } from './types';

// ---- グリッドビルダー ----
type Grid = string[][];
const field = (w: number, h: number, fill = '.', border = '#'): Grid => {
  const g: Grid = [];
  for (let y = 0; y < h; y++) {
    g.push([]);
    for (let x = 0; x < w; x++) {
      g[y].push(x === 0 || y === 0 || x === w - 1 || y === h - 1 ? border : fill);
    }
  }
  return g;
};
const put = (g: Grid, x: number, y: number, c: string) => { if (g[y]?.[x] !== undefined) g[y][x] = c; };
const hline = (g: Grid, y: number, x1: number, x2: number, c: string) => { for (let x = x1; x <= x2; x++) put(g, x, y, c); };
const vline = (g: Grid, x: number, y1: number, y2: number, c: string) => { for (let y = y1; y <= y2; y++) put(g, x, y, c); };
const rectF = (g: Grid, x: number, y: number, w: number, h: number, c: string) => { for (let j = 0; j < h; j++) hline(g, y + j, x, x + w - 1, c); };
/** 楕円の島（cx,cy中心、rx,ry半径）を c で塗る */
const blob = (g: Grid, cx: number, cy: number, rx: number, ry: number, c: string) => {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) put(g, x, y, c);
    }
  }
};
/** 水面（'~'）のセルだけ航路 '=' を敷く（島は削らない） */
const routeH = (g: Grid, y: number, x1: number, x2: number) => { for (let x = x1; x <= x2; x++) if (g[y]?.[x] === '~') g[y][x] = '='; };
const routeV = (g: Grid, x: number, y1: number, y2: number) => { for (let y = y1; y <= y2; y++) if (g[y]?.[x] === '~') g[y][x] = '='; };
const rows = (g: Grid): string[] => g.map((r) => r.join(''));

// ---- 大阪・下町（30×20）----
const osakaGrid = (() => {
  const g = field(30, 20);
  vline(g, 23, 1, 18, '~'); vline(g, 24, 1, 18, '~');       // 川
  hline(g, 10, 2, 27, '=');                                 // 大通り
  put(g, 23, 10, 'b'); put(g, 24, 10, 'b');                 // 橋
  vline(g, 19, 7, 9, '='); vline(g, 27, 7, 9, '=');
  hline(g, 17, 2, 21, '=');                                 // 下町通り
  vline(g, 8, 11, 16, '=');
  put(g, 27, 9, 'T');                                       // 鳥居
  for (const [x, y] of [[3, 3], [4, 3], [3, 4], [8, 4], [9, 4], [15, 12], [16, 12], [21, 4], [21, 5]]) put(g, x, y, '#');
  for (const [x, y] of [[7, 2], [16, 9], [21, 11], [6, 13], [26, 12], [28, 16], [13, 12], [26, 16]]) put(g, x, y, 'o');
  return rows(g);
})();

const OSAKA: MapDef = {
  id: 'osaka',
  名前: '大阪・下町',
  grid: osakaGrid,
  buildings: [
    { id: 'cafe', 名前: 'カフェ環', アイコン: '☕', x: 3, y: 7, w: 4, h: 3, door: { x: 5, y: 10 }, style: 'cafe' },
    { id: 'gallery', 名前: 'ギャラリー柏木', アイコン: '🖼', x: 10, y: 7, w: 5, h: 3, door: { x: 12, y: 10 }, style: 'gallery' },
    { id: 'company', 名前: '勤め先', アイコン: '🏢', x: 17, y: 3, w: 5, h: 4, door: { x: 19, y: 7 }, style: 'office' },
    { id: 'shrine', 名前: '住吉さん', アイコン: '⛩', x: 26, y: 4, w: 3, h: 3, door: { x: 27, y: 7 }, style: 'shrine' },
    { id: 'home', 名前: '自室', アイコン: '🛏', x: 3, y: 14, w: 4, h: 3, door: { x: 5, y: 17 }, style: 'house' },
    { id: 'atelier', 名前: 'アトリエ', アイコン: '🎨', x: 10, y: 14, w: 5, h: 3, door: { x: 12, y: 17 }, style: 'workshop' },
    { id: 'station_osaka', 名前: '大阪駅', アイコン: '🚉', x: 17, y: 14, w: 5, h: 3, door: { x: 19, y: 17 }, style: 'station' },
  ],
  npcs: [
    { id: 'shoten', 名前: '商店主', x: 9, y: 11, palette: { H: '#3a3a3a', C: '#8a5a3c' } },
    { id: 'kids', 名前: '子ども', x: 14, y: 9, palette: { H: '#141414', C: '#d24b3a' } },
    { id: 'obaa', 名前: 'おばあさん', x: 26, y: 13, palette: { H: '#e6e6e6', C: '#7a4bbf' } },
  ],
  portals: [
    { x: 19, y: 17, to: 'biz', tx: 5, ty: 12, 名前: 'ビジネス街へ', 条件: (g: G) => g.stage >= 3, 拒否: '（今はまだ、電車に乗る用事がない）' },
  ],
};

// ---- ビジネス街（28×16）----
const bizGrid = (() => {
  const g = field(28, 16);
  hline(g, 5, 2, 25, '=');
  hline(g, 12, 2, 25, '=');
  vline(g, 20, 5, 6, '='); vline(g, 12, 5, 7, '=');
  rectF(g, 13, 13, 2, 2, '~');                              // 噴水
  for (const [x, y] of [[3, 13], [24, 13], [8, 7], [17, 13]]) put(g, x, y, 'o');
  for (const [x, y] of [[25, 7], [26, 7], [2, 7]]) put(g, x, y, '#');
  return rows(g);
})();

const BIZ: MapDef = {
  id: 'biz',
  名前: 'ビジネス街',
  grid: bizGrid,
  buildings: [
    { id: 'houmukyoku', 名前: '法務局', アイコン: '🏛', x: 3, y: 2, w: 4, h: 3, door: { x: 5, y: 5 }, style: 'townhall' },
    { id: 'bank', 名前: 'みなと銀行', アイコン: '🏦', x: 10, y: 2, w: 5, h: 3, door: { x: 12, y: 5 }, style: 'office' },
    { id: 'vc', 名前: '鷹司キャピタル', アイコン: '💼', x: 18, y: 2, w: 5, h: 4, door: { x: 20, y: 6 }, style: 'tower' },
    {
      id: 'office', 名前: '空きテナント', アイコン: '🚪', x: 10, y: 8, w: 5, h: 3, door: { x: 12, y: 11 }, style: 'office',
      変化: (g: G) => (g.stage >= 4 ? { 名前: '(株)ワンダー環', アイコン: '🎈' } : null),
    },
    { id: 'station_biz', 名前: '駅', アイコン: '🚉', x: 3, y: 9, w: 4, h: 3, door: { x: 5, y: 12 }, style: 'station' },
    { id: 'bus_biz', 名前: 'バスターミナル', アイコン: '🚌', x: 19, y: 9, w: 5, h: 3, door: { x: 21, y: 12 }, style: 'station' },
  ],
  npcs: [
    { id: 'salaryman', 名前: '会社員', x: 8, y: 6, palette: { H: '#141414', C: '#31425a' } },
    { id: 'uketsuke', 名前: '受付', x: 17, y: 7, palette: { H: '#5a2a10', C: '#c85a28' } },
  ],
  portals: [
    { x: 5, y: 12, to: 'osaka', tx: 19, ty: 17, 名前: '大阪へ' },
    { x: 21, y: 12, to: 'rural', tx: 26, ty: 18, 名前: '里山町へ', 条件: (g: G) => g.stage >= 5, 拒否: '（郊外に行く理由が、まだない）' },
  ],
};

// ---- 里山町（32×20）----
const ruralGrid = (() => {
  const g = field(32, 20);
  for (let x = 2; x <= 29; x++) { put(g, x, 1, 'M'); if (x % 2 === 0) put(g, x, 2, 'M'); }  // 山並み
  rectF(g, 3, 4, 5, 4, 'r');                                // 田んぼ
  hline(g, 8, 2, 29, '=');
  hline(g, 14, 2, 29, '=');
  hline(g, 18, 2, 29, '=');
  vline(g, 9, 9, 17, '=');
  put(g, 28, 4, '~'); put(g, 29, 4, '~'); put(g, 28, 5, '~'); put(g, 29, 5, '~');  // ため池
  for (const [x, y] of [[21, 5], [22, 5], [21, 6], [28, 10], [29, 10]]) put(g, x, y, '#');
  for (const [x, y] of [[10, 12], [20, 12], [3, 10], [29, 16], [12, 10]]) put(g, x, y, 'o');
  return rows(g);
})();

const RURAL: MapDef = {
  id: 'rural',
  名前: '里山町',
  grid: ruralGrid,
  buildings: [
    {
      id: 'school', 名前: '旧・里山小学校', アイコン: '🏫', x: 11, y: 3, w: 8, h: 5, door: { x: 14, y: 8 }, style: 'school',
      変化: (g: G) =>
        g.stage >= 11 ? { 名前: 'ワンダー環・里山', アイコン: '🎡', style: 'park' }
        : g.stage >= 9 ? { 名前: '改装工事中', アイコン: '🚧', style: 'workshop' }
        : null,
    },
    { id: 'jinushi', 名前: '小野田家', アイコン: '🏠', x: 4, y: 11, w: 4, h: 3, door: { x: 6, y: 14 }, style: 'house' },
    { id: 'yakuba', 名前: '町役場', アイコン: '🏣', x: 24, y: 11, w: 4, h: 3, door: { x: 26, y: 14 }, style: 'townhall' },
    { id: 'tokoh', 名前: '戸叶組', アイコン: '🔨', x: 4, y: 15, w: 4, h: 3, door: { x: 6, y: 18 }, style: 'workshop' },
    { id: 'airport', 名前: '空港リムジン', アイコン: '✈', x: 13, y: 15, w: 5, h: 3, door: { x: 15, y: 18 }, style: 'station' },
    { id: 'bus_rural', 名前: 'バス停', アイコン: '🚌', x: 24, y: 15, w: 4, h: 3, door: { x: 26, y: 18 }, style: 'station' },
  ],
  npcs: [
    {
      id: 'misaki', 名前: '岬', x: 25, y: 13, palette: { H: '#4a2a3a', C: '#b02f6f' },
      条件: (g: G) => g.stage === 9 || (g.stage > 9 && g.仲間.includes('岬')),
    },
    { id: 'farmer', 名前: '農夫', x: 8, y: 6, palette: { H: '#3a3a3a', C: '#3c6a3c' } },
  ],
  portals: [
    { x: 26, y: 18, to: 'biz', tx: 21, ty: 12, 名前: 'ビジネス街へ' },
    { x: 15, y: 18, to: 'europe', tx: 6, ty: 14, 名前: 'ヨーロッパへ', 条件: (g: G) => g.stage >= 11, 拒否: '（海外は、まだ先の話だ）' },
  ],
};

// ---- 欧州・旧市街（30×18）----
const europeGrid = (() => {
  const g = field(30, 18);
  hline(g, 6, 2, 27, '=');
  hline(g, 14, 2, 27, '=');
  rectF(g, 10, 8, 10, 4, '=');                              // 石畳広場
  rectF(g, 14, 9, 2, 2, '~');                               // 噴水
  hline(g, 16, 2, 27, '~');                                 // 運河
  vline(g, 15, 7, 7, '=');
  for (const [x, y] of [[3, 8], [27, 8], [8, 12], [21, 12], [3, 13]]) put(g, x, y, 'o');
  for (const [x, y] of [[2, 2], [27, 2]]) put(g, x, y, '#');
  return rows(g);
})();

const EUROPE: MapDef = {
  id: 'europe',
  名前: '欧州・旧市街',
  grid: europeGrid,
  buildings: [
    { id: 'broker', 名前: 'マルタ商会', アイコン: '🏬', x: 4, y: 2, w: 4, h: 3, door: { x: 6, y: 5 }, style: 'office' },
    {
      id: 'eusite', 名前: '旧倉庫街(候補地)', アイコン: '🏚', x: 12, y: 2, w: 6, h: 4, door: { x: 14, y: 6 }, style: 'warehouse',
      変化: (g: G) => (g.stage >= 14 ? { 名前: 'ワンダー環・欧州', アイコン: '🎡', style: 'park' } : null),
    },
    { id: 'cityhall', 名前: '市庁舎', アイコン: '🏛', x: 22, y: 2, w: 5, h: 4, door: { x: 24, y: 6 }, style: 'clocktower' },
    { id: 'airport_eu', 名前: '空港', アイコン: '✈', x: 4, y: 11, w: 4, h: 3, door: { x: 6, y: 14 }, style: 'station' },
    { id: 'port_eu', 名前: '港', アイコン: '⚓', x: 22, y: 11, w: 5, h: 3, door: { x: 24, y: 14 }, style: 'port' },
  ],
  npcs: [
    { id: 'gakushi', 名前: '老楽師', x: 15, y: 12, palette: { H: '#e0e0e0', C: '#7a4bbf' }, 条件: (g: G) => g.stage >= 11 },
    { id: 'machibito', 名前: '街の人', x: 9, y: 13, palette: { H: '#8a5a1c', C: '#a03050' } },
  ],
  portals: [
    { x: 6, y: 14, to: 'rural', tx: 15, ty: 18, 名前: '帰国する' },
    { x: 24, y: 14, to: 'world', tx: 24, ty: 25, 名前: '世界航路へ', 条件: (g: G) => g.stage >= 14, 拒否: '（世界航路は、まだ開いていない）' },
  ],
};

// ---- 世界航路（48×28・壮大）----
const worldGrid = (() => {
  const g = field(48, 28, '~', '~');
  blob(g, 10, 6, 5, 3, '.');    // ヨーロッパ
  blob(g, 39, 6, 6, 3, '.');    // アメリカ
  blob(g, 24, 13, 6, 4, '.');   // アフリカ
  blob(g, 10, 21, 5, 3, '.');   // オセアニア
  blob(g, 38, 21, 6, 3, '.');   // アジア
  blob(g, 24, 23, 3, 2, '.');   // 母港の島
  // 航路（海のみ・島は削らない）
  routeV(g, 24, 4, 25);
  routeH(g, 13, 6, 42);
  routeV(g, 10, 9, 18);
  routeV(g, 39, 9, 18);
  // 島の飾り
  for (const [x, y] of [[7, 4], [12, 5], [36, 4], [43, 5], [20, 11], [27, 15], [7, 20], [41, 20], [35, 22]]) put(g, x, y, '#');
  for (const [x, y] of [[9, 4], [26, 11], [41, 19]]) put(g, x, y, 'M');
  for (const [x, y] of [[13, 7], [21, 15], [12, 22], [42, 22], [37, 5]]) put(g, x, y, 'o');
  return rows(g);
})();

const parkNode = (id: string, 名前: string, 大陸名: string, x: number, y: number, dx: number, dy: number) => ({
  id, 名前, アイコン: '🌍', x, y, w: 4, h: 3, door: { x: dx, y: dy }, style: 'house' as const,
  変化: (g: G) => (g.大陸.includes(大陸名) ? { 名前, アイコン: '🎡', style: 'park' as const } : null),
});

const WORLD: MapDef = {
  id: 'world',
  名前: '世界航路',
  grid: worldGrid,
  buildings: [
    parkNode('europe_node', 'ヨーロッパ', 'ヨーロッパ', 8, 4, 10, 7),
    parkNode('america', 'アメリカ', 'アメリカ', 37, 4, 39, 7),
    parkNode('africa', 'アフリカ', 'アフリカ', 22, 11, 24, 14),
    parkNode('oceania', 'オセアニア', 'オセアニア', 8, 19, 10, 22),
    parkNode('asia_node', 'アジア(日本)', 'アジア', 36, 19, 38, 22),
    { id: 'port_world', 名前: '母港', アイコン: '⚓', x: 22, y: 22, w: 4, h: 3, door: { x: 24, y: 25 }, style: 'port' },
  ],
  npcs: [
    { id: 'sailor', 名前: '船乗り', x: 24, y: 21, palette: { H: '#141414', C: '#2f6fb0' } },
  ],
  portals: [
    { x: 24, y: 25, to: 'europe', tx: 24, ty: 14, 名前: '欧州へ戻る' },
  ],
};

export const MAPS: Record<string, MapDef> = {
  osaka: OSAKA, biz: BIZ, rural: RURAL, europe: EUROPE, world: WORLD,
};

/** タイルが通行可能か。doorは常に可・建物のfootprintは不可・木/水/山は不可 */
export function walkable(map: MapDef, x: number, y: number): boolean {
  const t = map.grid[y]?.[x];
  if (t === undefined) return false;
  for (const b of map.buildings) {
    if (x === b.door.x && y === b.door.y) return true;
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return false;
  }
  return t !== '#' && t !== '~' && t !== 'M';
}
