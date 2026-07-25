# 五大陸テーマパーク物語

大阪の創作者が、世界五大陸にテーマパークを灯すまでを描くドット絵ストーリーRPG。
初代ポケモン風（GB4階調・DotGothic16・二重枠・▶カーソル）。物語は現実世界の
テーマパーク開発の流れをなぞる——代表作（IP＝核の証明）→ 起業・登記 → 資金調達
（融資 or 出資）→ 廃校再生の国内1号（地主説得・許認可・建設・採用・開業）→
欧州で海外1号（現地パートナー・直営 or 合弁・文化適応）→ 米（IPO or 合弁）・豪
（権限委譲）・アフリカで五大陸達成。全15章＋世界航路＋終章、1周30分前後。

**▶ [ブラウザでプレイする](https://kombu-dev.github.io/five-continents/)**（インストール不要）

## 遊び方

- 矢印キー / WASD で移動。建物のドア（暗い口）に乗って Enter / クリックで入る
- 会話は Enter / クリックで送る。選択肢は物語の後半に効く（5種のエンディングに分岐）
- 進行状況はブラウザのlocalStorageに自動セーブされる。**サーバーには何も送信されない**ので、
  誰がどこでプレイしても、それぞれ自分だけのセーブデータを持てる（アカウント登録不要）
- セーブを消したい場合は、ゲーム内の「タイトルへ戻る」／「はじめから」ボタンを使うこと

## 開発

```
npm install
npm run dev   # → http://localhost:5183 （または .claude/launch.json の five-continents）
npm run build # 型チェック＋本番ビルド
```

- `src/game/types.ts` — 状態（資金・評判・仲間・stage・大陸）とシーンの型
- `src/game/maps.ts` — 5マップ（大阪／ビジネス街／里山町／欧州旧市街／世界航路）
- `src/game/story.ts` — 物語本体（GOALS各章＋各シーン）。**内容を増やすならここ**
- `src/ui/GameScreen.tsx` / `TitleScreen.tsx` / `EndingResult.tsx` — 描画・移動・会話ウィンドウ・HUD・タイトル・クリア画面
- 開発時のみ `window.__lq`（get/set）でテレポート可能（自動テスト用）

画像・音声ファイルは使わず、キャラクター・建物・BGM/SEはすべてcanvas手続き描画とWeb Audio合成。
前身は `life-quest/`（人生シミュレーションエンジン。資産として凍結保存）。

`main` ブランチへのpushで GitHub Actions が自動ビルド・GitHub Pagesへデプロイする
（`.github/workflows/deploy.yml`）。
