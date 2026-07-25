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
  /** 隠し軸（v0.2）：選択が積み上がりエンディングを分ける。HUDには出さない */
  信念: number;
  実利: number;
  /** 到達したエンディング名（stage99で確定） */
  ending?: string;
  /** パーク設計（v0.3）：大陸名 → 設計会議で決めた項目（テーマ/シンボル/目玉/客層/価格/方針/電源） */
  パーク: Record<string, Record<string, string>>;
  /** 建物の中にいるとき（v0.3）。位置は屋内ローカル座標 */
  inside?: { id: string; x: number; y: number };
}

export type Effect = (g: G) => void;

/** 会話の1ステップ。text＝メッセージ／choices＝選択肢（ポケモン文法のはい/いいえ窓）。
 * vista＝そのステップの間、フィールドの代わりに「寄り」の一枚絵を表示（開業式典・契約など） */
export type Step =
  | { speaker?: string; text: string; effect?: Effect; vista?: string }
  | { choices: { label: string; steps?: Step[]; effect?: Effect }[]; vista?: string };

/** 建物の描画スタイル（v0.2）。屋根色・窓・付帯物が変わる */
export type BuildingStyle =
  | 'house' | 'cafe' | 'gallery' | 'office' | 'tower' | 'station' | 'shrine'
  | 'school' | 'townhall' | 'workshop' | 'warehouse' | 'clocktower' | 'port' | 'park';

export interface Building {
  id: string;
  名前: string;
  アイコン: string;
  x: number; y: number; w: number; h: number;
  door: { x: number; y: number };
  style: BuildingStyle;
  /** flagsやstageで名前・アイコン・スタイルを差し替える（廃校→工事中→パーク） */
  変化?: (g: G) => { 名前: string; アイコン: string; style?: BuildingStyle } | null;
  /** 内部に入れるか（v0.3）。falseなら従来通りドアで直接シーン発火 */
  enterable?: boolean;
  /** 内部の間取り（enterable時）。状態で変わってよい */
  interior?: (g: G) => Interior;
}

/** 建物内部の家具アイコン配置（v0.3） */
export interface Furniture { x: number; y: number; icon: string }

/** 建物内部マップ（v0.3）。8×6程度の小部屋。exitは外へ戻るタイル */
export interface Interior {
  /** 部屋の広さ */
  w: number; h: number;
  /** 内装スタイル（床・壁の色はbuilding.styleを継承、furnitureだけ個別） */
  furniture: Furniture[];
  /** 出口タイル（そこに乗ってEnterで外へ） */
  exit: { x: number; y: number };
  /** 入室時の初期位置 */
  start: { x: number; y: number };
  /** 話しかけ相手（いれば）。位置とシーン発火id（story.sceneForに渡す） */
  attendant?: { x: number; y: number; id: string };
}

/** NPCスプライトの配色（髪/肌/服/ズボン）。省略はデフォルト */
export interface NpcPalette { H?: string; S?: string; C?: string; P?: string }

export interface NpcDef {
  id: string;
  名前: string;
  x: number; y: number;
  palette: NpcPalette;
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
