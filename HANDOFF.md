# 引き継ぎ書 — 五大陸テーマパーク物語

最終更新: 2026-07-25／v0.4（未コミット）／ブランチ: `master`

新しいチャットで作業を再開する人（AIでも人でも）が、このファイル1本で状況を把握し、
すぐ手を動かせることを目標に書いている。詳しい経緯・決定理由は
`Obsidian Vault/Projects/五大陸テーマパーク物語.md` の Decision Log を見ること
（このファイルは「今どうなっているか」、Vaultは「なぜそうしたか」の記録）。

## これは何か

大阪の創作者が世界五大陸にテーマパークを作るまでを描く、初代ポケモン風ドット絵ストーリーRPG。
前身は人生シミュレーション『Life Quest』（`../life-quest/`）だったが、発注者フィードバックで
「五大陸テーマパークを作る流れをそのままなぞるゲーム」へ全面ピボットした（2026-07-19）。
Life Questのコードは資産として凍結保存されており、triggerされない限り触らない。

## 起動方法

```
npm install   # 初回のみ
npm run dev   # → http://localhost:5183
```

または `.claude/launch.json` の `five-continents` エントリから `preview_start` で起動。
矢印キー/WASDで移動、Enter/クリックで調べる・話す・入る。

## 今の状態（v0.4）

発注者から2回フィードバックを受け、2回作り込んだ後、**3回目のフィードバックで「世界航路に出ると
アフリカにしか行けない（アメリカへの陸路が繋がっていない）」の再発報告**。修正済み＋タイトル画面・
建物内部の見た目強化・クリア画面を一括実装。**発注者の再プレイ待ち**。

- **v0.1**: 5幕構成の縦スライス（大阪→ビジネス街→里山町→欧州→世界航路、全18章）
- **v0.2**: 人型スプライト・建物の作り込み・Web AudioのBGM/SE・信念/実利の隠し軸による因果システム・5種エンディング
- **v0.3**: 世界航路の詰まりバグ修正（ドア周辺）／NPC衝突判定／建物内部（入って中で会話）／カットイン演出／パーク設計会議システム
- **v0.4**: 世界航路の陸路接続バグ修正（今回）／タイトル画面／建物内部の見た目強化／クリア画面（エンディング結果画面）

**v0.4で直したバグ**: v0.3の`doorClear()`は「ドアの直近4マス」しか強制的に開けない安全策で、
「ドアから他の建物まで陸路/航路が繋がっているか」は検証していなかった。世界航路の横の航路
（`routeH(g, 13, ...)`）が`x=15〜33`の範囲でしか敷かれておらず、欧州/オセアニアの縦航路(x=9)と
アメリカ/アジアの縦航路(x=39)のどちらにも届いていなかった——母港から北上するとアフリカの縦航路
(x=24)にしか接続されず、他の4大陸が孤立していた。`routeH(g, 13, 9, 39)`に範囲を広げ、3本の縦航路
を1本の横断ルートで橋渡しして解決（`src/game/maps.ts`のworldGrid）。
再発防止として**`assertConnected(mapId, g, layouts)`**を新設し、`doorClear()`の直後に全マップで
呼ぶようにした（開発時のみ、BFSで全ドアの相互到達性を検証してconsole.errorで警告する）。
**新しいマップ・航路・建物を追加するときは、`doorClear()`だけでなく`assertConnected()`も必ず通すこと**
——`doorClear()`は「ドア周りの詰まり」、`assertConnected()`は「陸路が繋がっていない詰まり」を防ぐ、
別クラスの安全策。

**検証時の注意（v0.4で踏んだ罠）**: 母港付近には船乗りNPC（`sailor`, 座標(26,23)）が常駐しており、
移動先がNPCと重なるマスは`blockedByNpc`判定で通行不可になる（v0.3の仕様）。最短経路の自動検証で
NPCの存在を考慮せずキー列を組むと「詰まっているように見える」が、これはマップの接続バグではなく
単にNPCを避けて歩けば通れる。自動検証でルートを組むときはNPC座標も避けること。

## ファイル構成と役割

```
src/game/
  types.ts       状態(G)・シーン(Step)・建物(Building)・NPC・ポータル・内部(Interior)の型
  maps.ts        5マップの地形・建物配置・NPC・ポータル定義。doorClear()安全策あり
  interiors.ts   建物内部（全建物共通7×5の間取り）の生成・当たり判定
  story.ts       物語本体。GOALS配列＋sceneFor()の巨大switch＋パーク設計会議データ
  sprites.ts     16×16人型ドットスプライト（4方向×2フレーム）
  render.ts      タイル・建物・観覧車・建物内部・カットイン(vista)のcanvas描画
  audio.ts       Web Audio合成のBGM5曲＋SE4種
src/ui/
  GameScreen.tsx 移動・当たり判定・会話送り・入退室・描画ループ・HUD。最大の統合ファイル。SAVE_KEY/fmtMoney/fameWordをexport
  TitleScreen.tsx タイトル画面（vista:'title'背景・セーブ有無で文言分岐・Enter/クリックで開始）
  EndingResult.tsx クリア画面（stage>=99&&!sceneで表示。vista:'ending'背景＋最終ステータス＋歩んだ道）
  App.tsx        タイトル画面⇄GameScreenの表示切替（useState<boolean> started）のみ
```

## 状態モデル（`G`型・types.ts）

プレイヤーの全状態。localStorage `five-continents-save-v3` に自動保存される
（スキーマを壊す変更をしたら**セーブキーの末尾数字を上げる**——過去にv2→v3で一度やった）。

- `map/x/y`: 現在地。`inside`があれば建物内部にいて、内部ローカル座標は`inside.x/y`
- `資金/評判/仲間/大陸`: HUDに出る表の状態
- `stage`: メインクエストの進行度。`story.ts`の`GOALS`配列のインデックスと対応
- `信念/実利`: **隠しパラメータ**（HUD非表示）。選択の軸で増減し、5種エンディングを決める
- `flags`: 文字列配列。過去の選択を後の幕が参照する（例: `融資`→米国で審査難航）
- `パーク`: `{大陸名: {項目: 選択した値}}`。設計会議で選んだ内容の記録

## 主要な設計判断（踏まえて作業すること）

1. **建物内部は全て同じ7×5レイアウト**（`interiors.ts`の`INT_W/INT_H/ATTENDANT/START/EXIT`）。
   座標を統一しているので新しい建物を足しても詰まりが起きない。装飾（家具アイコン・床壁色）だけ
   `BuildingStyle`で変える。新しい建物は`maps.ts`で`withInterior({...}, attendantId)`を使うだけでよい。
2. **`attendantId`は`story.ts`の`sceneFor(id, g)`のswitchケースと一致させる**。カウンターに近づいて
   Enterを押すとこのidでシーンが発火する。
3. **ドアと接続の安全策（v0.4で二重化）**: 新しいマップ・建物を足したら、そのマップのグリッド生成の
   最後で必ず`doorClear(g, Object.values(該当Layout))`→`assertConnected(mapId, g, Object.values(該当Layout))`
   の順で呼ぶ。前者は「ドア周りの詰まり」、後者は「陸路/航路が他の建物まで届いていない詰まり」を防ぐ。
   後者はBFSで全ドアの相互到達性を検証し、開発時のみconsole.errorで警告する（実行を止めない）。
4. **ポータルとドアの座標が衝突しないよう注意**——`interact()`はポータル判定を建物ドア判定より
   先に見るので、同じ座標に両方置くと建物内部が永久に開けなくなる（v0.3で`port_world`をこれで
   一度やった。修正済みだが同じ罠に注意）。
5. **パーク設計会議はデータ駆動**（`story.ts`の`ITEMS_ASIA/EUROPE/AMERICA/OCEANIA/AFRICA`配列＋
   `designMeeting()`関数）。新しい項目を足すなら配列に`DesignItem`を追加するだけで、
   `designMeeting()`が自動で問答・選択・`g.パーク`への記録・信念実利/資金評判反映をやる。
6. **カットイン(vista)は`Step.vista`にID文字列を置くだけ**。今あるのは
   `ceremony/contract/workshop/ending/title`の5種（`render.ts`の`VISTAS`）。増やすときは
   `VISTAS`に描画関数を足すだけでよい。v0.4でエンディングは`ending`が最初の数行だけでなく
   トレイル・THE ENDまで全ステップに付くよう変更（クリア画面として最後まで一枚絵の上に乗る）。
7. **タイトル画面⇄ゲームの遷移はApp.tsxの`started`状態のみ**（GameScreen/TitleScreenはマウント/
   アンマウントで完全に切り替わる）。エンディングからの「タイトルへ戻る」はセーブを消して
   `onExitToTitle()`を呼ぶ＝App側で`started=false`にしてTitleScreenへ戻す設計。
8. **開発サーバーのポートは`vite.config.ts`で`Number(process.env.PORT) || 5183`**（v0.4で固定値から変更）。
   `.claude/launch.json`の`five-continents`に`"autoPort": true`を追加済み——他チャットが5183を
   使用中でも自動で空きポートに切り替わる。

## 検証のやり方（このセッションで確立した手法）

このBrowser paneの`computer`（スクリーンショット）は**このマシンで頻繁にタイムアウトする**。
代わりに以下を使うこと：

1. **色数チェック**でcanvasが空でないか確認:
   ```js
   const cv = document.querySelector('canvas.pixel');
   const d = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
   const colors = new Set(); for (let i=0;i<d.length;i+=40) colors.add(`${d[i]},${d[i+1]},${d[i+2]}`);
   colors.size // 20以上なら豊かに描画されている
   ```
2. **開発時デバッグフック** `window.__lq`（`GameScreen.tsx`、`import.meta.env.DEV`時のみ有効）:
   - `window.__lq.get()` — 現在の`G`状態を取得
   - `window.__lq.set(patch)` — 状態を直接書き換え（テレポート・フラグ操作に使う）
3. **通しプレイの自動化パターン**（実績あり・v0.2/v0.3でこれで全ビート検証済み）:
   `MessageChannel`でマイクロタスクをポンプしてReactの再描画を待ち、
   `window.__lq.set({map,x,y,inside:undefined})`でドア位置にワープ→Enterで入室→
   `window.__lq.set({inside:{id,x:3,y:2}})`でカウンター前に直接ワープ→Enterで発話→
   ダイアログのボタンを`.dialog-box button`から拾って選択肢を消化、を繰り返す。
   具体的なコード例は直前のコミットメッセージやこのセッションの実行ログを参照
   （現在のコードには残っていない使い捨てスクリプトなので、必要なら書き直すこと）。
4. 変更後は必ず `npm run build` で型チェック＋ビルドが通ることを確認してからコミットする。

## 次にやること（Vaultの Tasks と同期）

- [ ] 発注者の再プレイ確認（世界航路が5大陸すべてに通るか、タイトル/クリア画面・建物内部の手触り）
- [ ] 失敗・資金難イベント（運営の現実味を増すビート）
- [ ] 歩行アニメの滑らか化（今はタイル単位のカクカク移動）
- [ ] 回想モード（一度見たエンディングを見返せる）

v0.4で完了: タイトル画面／建物内部の見た目強化（4隅家具・床市松・ラグ・壁装飾）／クリア画面（エンディング結果画面）。

## 外部脳（Vault）との関係

このフォルダの親（`新たなる開発withclaude/`）には`Obsidian Vault/`という複数AI共有の
外部脳がある。作業開始時は`Obsidian Vault/CLAUDE.md`（憲法）→
`Obsidian Vault/Profile/Current State.md`→`Obsidian Vault/Projects/五大陸テーマパーク物語.md`
の順で読むこと。重要な決定・ミス・教訓はコード側でなくこのVaultノートのDecision Logに追記する。
セッションの終わりには`Obsidian Vault/Sessions/2026-07.md`に数行の足跡を残す。
