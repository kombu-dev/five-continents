// 五大陸テーマパーク物語 — 現実の流れをなぞる開拓RPG。
// 第1幕 代表作 → 第2幕 起業・資金 → 第3幕 廃校再生の国内1号 → 第4幕 欧州 → 第5幕 五大陸。

import { useState } from 'react';
import { GameScreen } from './GameScreen';
import { TitleScreen } from './TitleScreen';

export function App() {
  const [started, setStarted] = useState(false);
  return (
    <div className="lq-app">
      {started ? (
        <GameScreen onExitToTitle={() => setStarted(false)} />
      ) : (
        <TitleScreen onStart={() => setStarted(true)} />
      )}
    </div>
  );
}
