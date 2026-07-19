// サウンド（v0.2）。外部ファイルなし——Web Audioでチップチューンを合成する。
// SE: セリフ送りblip／選択のチャリン／ドアの「シュッ」（ポケモン風）／開業ファンファーレ。
// BGM: マップごとに曲・音色・テンポを変えた小さなループ。先読みスケジューリングで再生。

let ctx: AudioContext | null = null;
let muted = localStorage.getItem('fc-mute') === '1';

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** 最初のユーザー操作で呼ぶ（自動再生制限の解除） */
export function unlockAudio(): void { ac(); }

export function isMuted(): boolean { return muted; }
export function setMuted(m: boolean): void {
  muted = m;
  localStorage.setItem('fc-mute', m ? '1' : '0');
  if (m) bgm.stop();
}

function tone(
  freq: number, start: number, dur: number,
  type: OscillatorType = 'square', gain = 0.045,
  slideTo?: number,
): void {
  const a = ac(); if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(a.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

export const se = {
  /** セリフ送り */
  blip(): void { const a = ac(); if (!a) return; tone(720, a.currentTime, 0.045, 'square', 0.035); },
  /** 選択のチャリン */
  coin(): void {
    const a = ac(); if (!a) return;
    tone(988, a.currentTime, 0.07, 'triangle', 0.06);
    tone(1319, a.currentTime + 0.07, 0.12, 'triangle', 0.06);
  },
  /** ドア・入場（下降シュッ） */
  door(): void { const a = ac(); if (!a) return; tone(560, a.currentTime, 0.16, 'square', 0.05, 190); },
  /** 開業ファンファーレ */
  fanfare(): void {
    const a = ac(); if (!a) return;
    const t = a.currentTime;
    const n = (f: number, at: number, d: number) => tone(f, t + at, d, 'square', 0.055);
    n(523, 0, 0.12); n(659, 0.12, 0.12); n(784, 0.24, 0.12); n(1047, 0.36, 0.4);
    tone(523 / 2, t + 0.36, 0.4, 'triangle', 0.05);
  },
  /** 拒否・ブブー */
  buzz(): void { const a = ac(); if (!a) return; tone(180, a.currentTime, 0.15, 'sawtooth', 0.04, 120); },
};

// ---- BGM ----

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

interface Song {
  tempo: number;                 // BPM（1拍=四分）
  wave: OscillatorType;
  gain: number;
  /** [MIDIノート(0=休符), 拍数] の列 */
  lead: [number, number][];
  bass?: [number, number][];
}

// 曲はすべて自作の短いループ。マップの空気に合わせて拍子・音色を変える
const SONGS: Record<string, Song> = {
  // 大阪・下町：軽快な square
  osaka: {
    tempo: 132, wave: 'square', gain: 0.04,
    lead: [
      [72, 0.5], [76, 0.5], [79, 0.5], [76, 0.5], [72, 0.5], [76, 0.5], [79, 1],
      [74, 0.5], [77, 0.5], [81, 0.5], [77, 0.5], [74, 0.5], [77, 0.5], [81, 1],
      [76, 0.5], [79, 0.5], [84, 0.5], [79, 0.5], [77, 0.5], [76, 0.5], [74, 1],
      [72, 0.5], [74, 0.5], [76, 0.5], [74, 0.5], [72, 1.5], [0, 0.5],
    ],
  },
  // ビジネス街：せかせかスタッカート
  biz: {
    tempo: 152, wave: 'square', gain: 0.035,
    lead: [
      [69, 0.25], [0, 0.25], [69, 0.25], [0, 0.25], [72, 0.25], [0, 0.25], [76, 0.5],
      [74, 0.25], [0, 0.25], [74, 0.25], [0, 0.25], [77, 0.25], [0, 0.25], [81, 0.5],
      [79, 0.25], [0, 0.25], [76, 0.25], [0, 0.25], [74, 0.25], [0, 0.25], [72, 0.5],
      [71, 0.25], [0, 0.25], [74, 0.25], [0, 0.25], [69, 1],
    ],
  },
  // 里山町：ゆったり triangle の牧歌
  rural: {
    tempo: 84, wave: 'triangle', gain: 0.06,
    lead: [
      [67, 1], [69, 0.5], [71, 0.5], [74, 1], [71, 1],
      [69, 1], [67, 0.5], [64, 0.5], [67, 2],
      [71, 1], [74, 0.5], [76, 0.5], [79, 1], [76, 1],
      [74, 1], [71, 0.5], [69, 0.5], [67, 2],
    ],
  },
  // 欧州旧市街：三拍子のワルツ
  europe: {
    tempo: 120, wave: 'triangle', gain: 0.055,
    lead: [
      [74, 1], [78, 0.5], [81, 0.5], [78, 0.5], [74, 0.5],
      [76, 1], [79, 0.5], [83, 0.5], [79, 0.5], [76, 0.5],
      [78, 1], [81, 0.5], [86, 0.5], [83, 0.5], [81, 0.5],
      [78, 1], [76, 1], [74, 1],
    ],
  },
  // 世界航路：壮大（二声・ゆっくり・広い音域）
  world: {
    tempo: 96, wave: 'square', gain: 0.04,
    lead: [
      [60, 1], [67, 1], [72, 1], [76, 1],
      [79, 2], [76, 1], [72, 1],
      [74, 1], [77, 1], [81, 1], [84, 1],
      [83, 2], [79, 2],
      [72, 1], [76, 1], [79, 1], [84, 1],
      [88, 3], [86, 0.5], [84, 0.5],
      [83, 1], [79, 1], [76, 1], [74, 1],
      [72, 4],
    ],
    bass: [
      [36, 4], [43, 4], [38, 4], [43, 4], [36, 4], [40, 4], [43, 4], [36, 4],
    ],
  },
};

class BgmPlayer {
  private current: string | null = null;
  private timer: number | null = null;
  private leadIdx = 0;
  private bassIdx = 0;
  private leadTime = 0;
  private bassTime = 0;

  start(id: string): void {
    if (this.current === id) return;
    this.stop();
    const song = SONGS[id];
    const a = ac();
    if (!song || !a) { this.current = id; return; } // ミュート中でも曲名は覚える
    this.current = id;
    this.leadIdx = 0; this.bassIdx = 0;
    this.leadTime = a.currentTime + 0.1;
    this.bassTime = this.leadTime;
    const beat = 60 / song.tempo;
    const tick = () => {
      const now = a.currentTime;
      // 0.5秒先までスケジュール
      while (this.leadTime < now + 0.5) {
        const [m, beats] = song.lead[this.leadIdx % song.lead.length];
        const dur = beats * beat;
        if (m > 0) tone(midi(m), this.leadTime, dur * 0.92, song.wave, song.gain);
        this.leadTime += dur;
        this.leadIdx++;
      }
      if (song.bass) {
        while (this.bassTime < now + 0.5) {
          const [m, beats] = song.bass[this.bassIdx % song.bass.length];
          const dur = beats * beat;
          if (m > 0) tone(midi(m), this.bassTime, dur * 0.95, 'triangle', song.gain + 0.015);
          this.bassTime += dur;
          this.bassIdx++;
        }
      }
    };
    tick();
    this.timer = window.setInterval(tick, 200);
  }

  stop(): void {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    this.current = null;
  }

  /** ミュート解除後に現在マップの曲を再開するため */
  restart(id: string): void { this.current = null; this.start(id); }
}

export const bgm = new BgmPlayer();
