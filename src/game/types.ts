// 五大陸テーマパーク物語 — 型定義。
// マップは「地面グリッド＋建物矩形＋NPC＋ポータル」。物語はシーン（Step列）で進む。

export interface G {
  map: string;
  x: number;
  y: number;
  /** 万円。1億 = 10000 */
  資金: number;
  /** 0-100。言葉に変換して表示 */
  評判: number;
  仲間: string[];
  /** メインクエストの段階。story.ts の GOALS と対応 */
  stage: number;
  flags: string[];
  /** 開園済みの大陸（アジア/ヨーロッパ/アメリカ/オセアニア/アフリカ） */
  大陸: string[];
}

export type Effect = (g: G) => void;

/** 会話の1ステップ。text＝メッセージ／choices＝選択肢（ポケモン文法のはい/いいえ窓） */
export type Step =
  | { speaker?: string; text: string; effect?: Effect }
  | { choices: { label: string; steps?: Step[]; effect?: Effect }[] };

export interface Building {
  id: string;
  名前: string;
  アイコン: string;
  x: number; y: number; w: number; h: number;
  door: { x: number; y: number };
  /** flagsやstageで名前・アイコンを差し替える（廃校→工事中→パーク） */
  変化?: (g: G) => { 名前: string; アイコン: string } | null;
}

export interface NpcDef {
  id: string;
  名前: string;
  x: number; y: number;
  記号: string;      // 1文字（例: 師, 相, 地）
  色: string;
  条件?: (g: G) => boolean;
}

export interface Portal {
  x: number; y: number;
  to: string; tx: number; ty: number;
  名前: string;
  条件?: (g: G) => boolean;
  拒否?: string;      // 条件を満たさないときのメッセージ
}

/** 地形タイル: '.'草 '='道 '~'水(通行不可) '#'木(通行不可) 'o'花 */
export interface MapDef {
  id: string;
  名前: string;
  grid: string[];
  buildings: Building[];
  npcs: NpcDef[];
  portals: Portal[];
}
