// 16×16の人型ドットスプライト（v0.2・初代ポケモン/マリオ文法）。
// 文字→パレット色で塗る。'.'は透明。向き4種×歩行2フレーム。NPCは配色差し替え。

export interface SpritePalette {
  H: string; // 髪
  S: string; // 肌
  E: string; // 目
  C: string; // 服
  P: string; // ズボン
  B: string; // 靴
  O: string; // 輪郭
}

export const HERO_PALETTE: SpritePalette = {
  H: '#5a3a1c', S: '#f0c8a0', E: '#141c28', C: '#2f6fb0', P: '#31425a', B: '#3a2a18', O: '#1a2c14',
};

/** 正面（下向き）フレームA */
const DOWN_A = [
  '................',
  '.....OHHHHO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHSSSSSSHO...',
  '...OSESSSSESO...',
  '...OSSSSSSSSO...',
  '....OSSMMSSO....',
  '....OCCCCCCO....',
  '...OSCCCCCCSO...',
  '...OSCCCCCCSO...',
  '....OCCCCCCO....',
  '....OPPOOPPO....',
  '....OBBO.OBBO...',
  '................',
];
/** 正面フレームB（左足前） */
const DOWN_B = [
  '................',
  '.....OHHHHO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHSSSSSSHO...',
  '...OSESSSSESO...',
  '...OSSSSSSSSO...',
  '....OSSMMSSO....',
  '....OCCCCCCO....',
  '...OSCCCCCCSO...',
  '...OSCCCCCCSO...',
  '....OCCCCCCO....',
  '....OPPOOPPO....',
  '...OBBO..OBB....',
  '................',
];
/** 背面（上向き） */
const UP_A = [
  '................',
  '.....OHHHHO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OSHHHHHHSO...',
  '....OHHHHHHO....',
  '....OCCCCCCO....',
  '...OSCCCCCCSO...',
  '...OSCCCCCCSO...',
  '....OCCCCCCO....',
  '....OPPOOPPO....',
  '....OBBO.OBBO...',
  '................',
];
const UP_B = [
  '................',
  '.....OHHHHO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OSHHHHHHSO...',
  '....OHHHHHHO....',
  '....OCCCCCCO....',
  '...OSCCCCCCSO...',
  '...OSCCCCCCSO...',
  '....OCCCCCCO....',
  '....OPPOOPPO....',
  '...OBBO..OBB....',
  '................',
];
/** 右向き（左は反転） */
const SIDE_A = [
  '................',
  '.....OHHHHO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHSSSSSO....',
  '...OHHSSSESO....',
  '...OHHSSSSSO....',
  '....OSSSSSO.....',
  '....OCCCCCCO....',
  '....OCCCCCSO....',
  '....OCCCCCCO....',
  '....OCCCCCCO....',
  '.....OPPPPO.....',
  '.....OBBOBBO....',
  '................',
];
const SIDE_B = [
  '................',
  '.....OHHHHO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHSSSSSO....',
  '...OHHSSSESO....',
  '...OHHSSSSSO....',
  '....OSSSSSO.....',
  '....OCCCCCCO....',
  '....OCCCCCSO....',
  '....OCCCCCCO....',
  '....OCCCCCCO....',
  '.....OPPPPO.....',
  '....OBB.OBBO....',
  '................',
];

export type Facing = 'down' | 'up' | 'left' | 'right';

const FRAMES: Record<Facing, [string[], string[]]> = {
  down: [DOWN_A, DOWN_B],
  up: [UP_A, UP_B],
  right: [SIDE_A, SIDE_B],
  left: [SIDE_A, SIDE_B], // 描画時に反転
};

/** スプライトを1タイルに描く。frame 0/1、leftは水平反転 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  facing: Facing,
  frame: number,
  pal: SpritePalette,
  px: number,
  py: number,
  tile: number,
): void {
  const rows = FRAMES[facing][frame % 2];
  const s = tile / 16;
  const flip = facing === 'left';
  for (let y = 0; y < 16; y++) {
    const row = rows[y];
    for (let x = 0; x < 16; x++) {
      const ch = row[x] as keyof SpritePalette | '.' | 'M';
      if (ch === '.') continue;
      // M=口は輪郭色を薄く
      ctx.fillStyle = ch === 'M' ? pal.O + 'aa' : (pal[ch as keyof SpritePalette] ?? pal.O);
      const dx = flip ? 15 - x : x;
      ctx.fillRect(px + dx * s, py + y * s, s + 0.5, s + 0.5);
    }
  }
}
