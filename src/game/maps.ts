// マップ定義（v0.3）。グリッドはビルダー関数で生成。
// タイル: '.'草 '='道/航路 '~'水 '#'木 'M'山 'o'花 'b'橋 'r'田 'T'鳥居。ブロック＝ '#','~','M'＋建物。
// v0.3: 全ドアの周囲は doorClear() で強制的に開ける（詰まり防止の安全策）。世界航路は島を拡大して再設計。
// 建物はほぼ全て withInterior() で内部に入れる（v0.3・発注者要望）。

import type { G, MapDef } from './types';
import { withInterior } from './interiors';

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
/** 楕円の島（cx,cy中心、rx,ry半径・小数可）を c で塗る */
const blob = (g: Grid, cx: number, cy: number, rx: number, ry: number, c: string) => {
  const y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
  const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) put(g, x, y, c);
    }
  }
};
/** 水面（'~'）のセルだけ航路 '=' を敷く（島は削らない） */
const routeH = (g: Grid, y: number, x1: number, x2: number) => { for (let x = x1; x <= x2; x++) if (g[y]?.[x] === '~') g[y][x] = '='; };
const routeV = (g: Grid, x: number, y1: number, y2: number) => { for (let y = y1; y <= y2; y++) if (g[y]?.[x] === '~') g[y][x] = '='; };
const rows = (g: Grid): string[] => g.map((r) => r.join(''));

interface Layout { x: number; y: number; w: number; h: number; door: { x: number; y: number } }

/** ドア周囲（上下左右＋ドア自身）を、建物の内側でない限り強制的に開ける（詰まり防止・v0.3安全策） */
const doorClear = (g: Grid, layouts: Layout[]) => {
  for (const b of layouts) {
    for (const [dx, dy] of [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = b.door.x + dx, ny = b.door.y + dy;
      const inAnyBuilding = layouts.some((o) => nx >= o.x && nx < o.x + o.w && ny >= o.y && ny < o.y + o.h);
      if (!inAnyBuilding) put(g, nx, ny, '.');
    }
  }
};

// ==================== 大阪・下町（30×20） ====================
const osakaLayout = {
  cafe:     { x: 3, y: 7, w: 4, h: 3, door: { x: 5, y: 10 } },
  gallery:  { x: 10, y: 7, w: 5, h: 3, door: { x: 12, y: 10 } },
  company:  { x: 17, y: 3, w: 5, h: 4, door: { x: 19, y: 7 } },
  shrine:   { x: 26, y: 4, w: 3, h: 3, door: { x: 27, y: 7 } },
  home:     { x: 3, y: 14, w: 4, h: 3, door: { x: 5, y: 17 } },
  atelier:  { x: 10, y: 14, w: 5, h: 3, door: { x: 12, y: 17 } },
  station_osaka: { x: 17, y: 14, w: 5, h: 3, door: { x: 19, y: 17 } },
};
const osakaGrid = (() => {
  const g = field(30, 20);
  vline(g, 23, 1, 18, '~'); vline(g, 24, 1, 18, '~');
  hline(g, 10, 2, 27, '=');
  put(g, 23, 10, 'b'); put(g, 24, 10, 'b');
  vline(g, 19, 7, 9, '='); vline(g, 27, 7, 9, '=');
  hline(g, 17, 2, 21, '=');
  vline(g, 8, 11, 16, '=');
  put(g, 27, 9, 'T');
  for (const [x, y] of [[3, 3], [4, 3], [3, 4], [8, 4], [9, 4], [15, 12], [16, 12], [21, 4], [21, 5]]) put(g, x, y, '#');
  for (const [x, y] of [[7, 2], [16, 9], [21, 11], [6, 13], [26, 12], [28, 16], [13, 12], [26, 16]]) put(g, x, y, 'o');
  doorClear(g, Object.values(osakaLayout));
  return rows(g);
})();

const OSAKA: MapDef = {
  id: 'osaka',
  名前: '大阪・下町',
  grid: osakaGrid,
  buildings: [
    withInterior({ id: 'cafe', 名前: 'カフェ環', アイコン: '☕', style: 'cafe', ...osakaLayout.cafe }),
    withInterior({ id: 'gallery', 名前: 'ギャラリー柏木', アイコン: '🖼', style: 'gallery', ...osakaLayout.gallery }),
    withInterior({ id: 'company', 名前: '勤め先', アイコン: '🏢', style: 'office', ...osakaLayout.company }),
    { id: 'shrine', 名前: '住吉さん', アイコン: '⛩', style: 'shrine', ...osakaLayout.shrine },
    withInterior({ id: 'home', 名前: '自室', アイコン: '🛏', style: 'house', ...osakaLayout.home }),
    withInterior({ id: 'atelier', 名前: 'アトリエ', アイコン: '🎨', style: 'workshop', ...osakaLayout.atelier }),
    { id: 'station_osaka', 名前: '大阪駅', アイコン: '🚉', style: 'station', ...osakaLayout.station_osaka },
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

// ==================== ビジネス街（28×16） ====================
const bizLayout = {
  houmukyoku: { x: 3, y: 2, w: 4, h: 3, door: { x: 5, y: 5 } },
  bank:       { x: 10, y: 2, w: 5, h: 3, door: { x: 12, y: 5 } },
  vc:         { x: 18, y: 2, w: 5, h: 4, door: { x: 20, y: 6 } },
  office:     { x: 10, y: 8, w: 5, h: 3, door: { x: 12, y: 11 } },
  station_biz: { x: 3, y: 9, w: 4, h: 3, door: { x: 5, y: 12 } },
  bus_biz:    { x: 19, y: 9, w: 5, h: 3, door: { x: 21, y: 12 } },
};
const bizGrid = (() => {
  const g = field(28, 16);
  hline(g, 5, 2, 25, '=');
  hline(g, 12, 2, 25, '=');
  vline(g, 20, 5, 6, '='); vline(g, 12, 5, 7, '=');
  rectF(g, 13, 13, 2, 2, '~');
  for (const [x, y] of [[3, 13], [24, 13], [8, 7], [17, 13]]) put(g, x, y, 'o');
  for (const [x, y] of [[25, 7], [26, 7], [2, 7]]) put(g, x, y, '#');
  doorClear(g, Object.values(bizLayout));
  return rows(g);
})();

const BIZ: MapDef = {
  id: 'biz',
  名前: 'ビジネス街',
  grid: bizGrid,
  buildings: [
    withInterior({ id: 'houmukyoku', 名前: '法務局', アイコン: '🏛', style: 'townhall', ...bizLayout.houmukyoku }),
    withInterior({ id: 'bank', 名前: 'みなと銀行', アイコン: '🏦', style: 'office', ...bizLayout.bank }),
    withInterior({ id: 'vc', 名前: '鷹司キャピタル', アイコン: '💼', style: 'tower', ...bizLayout.vc }),
    withInterior({
      id: 'office', 名前: '空きテナント', アイコン: '🚪', style: 'office', ...bizLayout.office,
      変化: (g: G) => (g.stage >= 4 ? { 名前: '(株)ワンダー環', アイコン: '🎈' } : null),
    }),
    { id: 'station_biz', 名前: '駅', アイコン: '🚉', style: 'station', ...bizLayout.station_biz },
    { id: 'bus_biz', 名前: 'バスターミナル', アイコン: '🚌', style: 'station', ...bizLayout.bus_biz },
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

// ==================== 里山町（32×20） ====================
const ruralLayout = {
  school:   { x: 11, y: 3, w: 8, h: 5, door: { x: 14, y: 8 } },
  jinushi:  { x: 4, y: 11, w: 4, h: 3, door: { x: 6, y: 14 } },
  yakuba:   { x: 24, y: 11, w: 4, h: 3, door: { x: 26, y: 14 } },
  tokoh:    { x: 4, y: 15, w: 4, h: 3, door: { x: 6, y: 18 } },
  airport:  { x: 13, y: 15, w: 5, h: 3, door: { x: 15, y: 18 } },
  bus_rural: { x: 24, y: 15, w: 4, h: 3, door: { x: 26, y: 18 } },
};
const ruralGrid = (() => {
  const g = field(32, 20);
  for (let x = 2; x <= 29; x++) { put(g, x, 1, 'M'); if (x % 2 === 0) put(g, x, 2, 'M'); }
  rectF(g, 3, 4, 5, 4, 'r');
  hline(g, 8, 2, 29, '=');
  hline(g, 14, 2, 29, '=');
  hline(g, 18, 2, 29, '=');
  vline(g, 9, 9, 17, '=');
  put(g, 28, 4, '~'); put(g, 29, 4, '~'); put(g, 28, 5, '~'); put(g, 29, 5, '~');
  for (const [x, y] of [[21, 5], [22, 5], [21, 6], [28, 10], [29, 10]]) put(g, x, y, '#');
  for (const [x, y] of [[10, 12], [20, 12], [3, 10], [29, 16], [12, 10]]) put(g, x, y, 'o');
  doorClear(g, Object.values(ruralLayout));
  return rows(g);
})();

const RURAL: MapDef = {
  id: 'rural',
  名前: '里山町',
  grid: ruralGrid,
  buildings: [
    withInterior({
      id: 'school', 名前: '旧・里山小学校', アイコン: '🏫', style: 'school', ...ruralLayout.school,
      変化: (g: G) =>
        g.stage >= 11 ? { 名前: 'ワンダー環・里山', アイコン: '🎡', style: 'park' }
        : g.stage >= 9 ? { 名前: '改装工事中', アイコン: '🚧', style: 'workshop' }
        : null,
    }),
    withInterior({ id: 'jinushi', 名前: '小野田家', アイコン: '🏠', style: 'house', ...ruralLayout.jinushi }),
    withInterior({ id: 'yakuba', 名前: '町役場', アイコン: '🏣', style: 'townhall', ...ruralLayout.yakuba }),
    withInterior({ id: 'tokoh', 名前: '戸叶組', アイコン: '🔨', style: 'workshop', ...ruralLayout.tokoh }),
    { id: 'airport', 名前: '空港リムジン', アイコン: '✈', style: 'station', ...ruralLayout.airport },
    { id: 'bus_rural', 名前: 'バス停', アイコン: '🚌', style: 'station', ...ruralLayout.bus_rural },
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

// ==================== 欧州・旧市街（30×18） ====================
const europeLayout = {
  broker:    { x: 4, y: 2, w: 4, h: 3, door: { x: 6, y: 5 } },
  eusite:    { x: 12, y: 2, w: 6, h: 4, door: { x: 14, y: 6 } },
  cityhall:  { x: 22, y: 2, w: 5, h: 4, door: { x: 24, y: 6 } },
  airport_eu: { x: 4, y: 11, w: 4, h: 3, door: { x: 6, y: 14 } },
  port_eu:   { x: 22, y: 11, w: 5, h: 3, door: { x: 24, y: 14 } },
};
const europeGrid = (() => {
  const g = field(30, 18);
  hline(g, 6, 2, 27, '=');
  hline(g, 14, 2, 27, '=');
  rectF(g, 10, 8, 10, 4, '=');
  rectF(g, 14, 9, 2, 2, '~');
  hline(g, 16, 2, 27, '~');
  vline(g, 15, 7, 7, '=');
  for (const [x, y] of [[3, 8], [27, 8], [8, 12], [21, 12], [3, 13]]) put(g, x, y, 'o');
  for (const [x, y] of [[2, 2], [27, 2]]) put(g, x, y, '#');
  doorClear(g, Object.values(europeLayout));
  return rows(g);
})();

const EUROPE: MapDef = {
  id: 'europe',
  名前: '欧州・旧市街',
  grid: europeGrid,
  buildings: [
    withInterior({ id: 'broker', 名前: 'マルタ商会', アイコン: '🏬', style: 'office', ...europeLayout.broker }),
    withInterior({
      id: 'eusite', 名前: '旧倉庫街(候補地)', アイコン: '🏚', style: 'warehouse', ...europeLayout.eusite,
      変化: (g: G) => (g.stage >= 14 ? { 名前: 'ワンダー環・欧州', アイコン: '🎡', style: 'park' } : null),
    }),
    withInterior({ id: 'cityhall', 名前: '市庁舎', アイコン: '🏛', style: 'clocktower', ...europeLayout.cityhall }),
    { id: 'airport_eu', 名前: '空港', アイコン: '✈', style: 'station', ...europeLayout.airport_eu },
    { id: 'port_eu', 名前: '港', アイコン: '⚓', style: 'port', ...europeLayout.port_eu },
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

// ==================== 世界航路（48×28・v0.3で島を拡大し再設計） ====================
// 島を大きくし（各rx6以上）、ドアの外側が確実に島の内側の陸地に来るよう座標を計算で検証。
// さらにdoorClear()で二重に安全策をかける。
const worldLayout = {
  europe_node: { x: 7, y: 4, w: 4, h: 3, door: { x: 9, y: 7 } },
  america:     { x: 37, y: 4, w: 4, h: 3, door: { x: 39, y: 7 } },
  africa:      { x: 22, y: 12, w: 4, h: 3, door: { x: 24, y: 15 } },
  oceania:     { x: 7, y: 19, w: 4, h: 3, door: { x: 9, y: 22 } },
  asia_node:   { x: 37, y: 19, w: 4, h: 3, door: { x: 39, y: 22 } },
  port_world:  { x: 22, y: 22, w: 4, h: 3, door: { x: 24, y: 25 } },
};
const worldGrid = (() => {
  const g = field(48, 28, '~', '~');
  blob(g, 9, 6, 6, 4, '.');     // ヨーロッパ島
  blob(g, 39, 6, 6, 4, '.');    // アメリカ島
  blob(g, 24, 14, 7, 5, '.');   // アフリカ島（最大）
  blob(g, 9, 21, 6, 4, '.');    // オセアニア島
  blob(g, 39, 21, 6, 4, '.');   // アジア島
  blob(g, 24, 23, 5, 3.5, '.'); // 母港の島
  // 航路（島と島の間の海を渡る）
  routeV(g, 24, 10, 19);
  routeH(g, 13, 15, 33);
  routeV(g, 9, 10, 17);
  routeV(g, 39, 10, 17);
  routeV(g, 24, 19, 20);
  // 島の飾り（中心部を避けて縁に置く）
  for (const [x, y] of [[6, 3], [12, 4], [36, 3], [42, 4], [19, 10], [29, 17], [5, 18], [43, 18], [33, 22]]) put(g, x, y, '#');
  for (const [x, y] of [[8, 3], [25, 10], [40, 17]]) put(g, x, y, 'M');
  for (const [x, y] of [[12, 7], [19, 16], [11, 23], [43, 23], [36, 4]]) put(g, x, y, 'o');
  doorClear(g, Object.values(worldLayout));
  return rows(g);
})();

const parkNode = (
  key: keyof typeof worldLayout, 名前: string, 大陸名: string, attendantId: string,
) => withInterior({
  id: key, 名前, アイコン: '🌍', style: 'house' as const, ...worldLayout[key],
  変化: (g: G) => (g.大陸.includes(大陸名) ? { 名前, アイコン: '🎡', style: 'park' as const } : null),
}, attendantId);

const WORLD: MapDef = {
  id: 'world',
  名前: '世界航路',
  grid: worldGrid,
  buildings: [
    parkNode('europe_node', 'ヨーロッパ', 'ヨーロッパ', 'europe_node'),
    parkNode('america', 'アメリカ', 'アメリカ', 'america'),
    parkNode('africa', 'アフリカ', 'アフリカ', 'africa'),
    parkNode('oceania', 'オセアニア', 'オセアニア', 'oceania'),
    parkNode('asia_node', 'アジア(日本)', 'アジア', 'asia_node'),
    // port_worldのドアは欧州への帰還ポータルと同座標——「入室」ではなく「出航」の意味なので内部は作らない
    { id: 'port_world', 名前: '母港', アイコン: '⚓', style: 'port', ...worldLayout.port_world },
  ],
  npcs: [
    { id: 'sailor', 名前: '船乗り', x: 26, y: 23, palette: { H: '#141414', C: '#2f6fb0' } },
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
