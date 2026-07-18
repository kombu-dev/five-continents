// 五大陸テーマパーク物語 — 現実の流れをなぞる開拓RPG。
// 第1幕 代表作 → 第2幕 起業・資金 → 第3幕 廃校再生の国内1号 → 第4幕 欧州 → 第5幕 五大陸。

import { GameScreen } from './GameScreen';

export function App() {
  return (
    <div className="lq-app">
      <header style={{ textAlign: 'center', margin: '10px 0 2px' }}>
        <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 2 }}>五大陸テーマパーク物語</h1>
        <div className="lq-muted">〜 大阪の創作者、世界に遊び場を灯す 〜</div>
      </header>
      <GameScreen />
    </div>
  );
}
