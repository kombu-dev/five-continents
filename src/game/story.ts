// 物語 v0.3。5幕構成＋因果システム＋パーク設計会議＋カットイン演出。
// 隠し軸：信念（自分の流儀を貫く選択）／実利（速さと利益を取る選択）。HUDには出さない。
// パーク設計：大陸を重ねるごとに考える項目が増える（里山3→欧州+2→米+2→豪+2→阿+2＝計11項目）。
// vista：ポケモンのバトル画面のような「寄り」の一枚絵。開業式典・契約・制作・終幕で使う（render.ts側で描画）。

import type { G, Step } from './types';

export const GOALS: string[] = [
  /* 0 */ 'アトリエで代表作を作る',
  /* 1 */ 'ギャラリーの柏木に作品を見せる',
  /* 2 */ 'カフェの日野に会う',
  /* 3 */ '大阪駅からビジネス街へ——法務局で会社を登記する',
  /* 4 */ '資金を調達する（みなと銀行 か 鷹司キャピタル）',
  /* 5 */ 'バスで里山町へ——旧・里山小学校を調べる',
  /* 6 */ '地主・小野田を説得する',
  /* 7 */ '町役場で許認可を得る',
  /* 8 */ '戸叶組と改装工事の契約を結ぶ',
  /* 9 */ 'スタッフ採用を決める（役場前の岬）',
  /* 10 */ '開業式典へ——校門を調べる',
  /* 11 */ '空港からヨーロッパへ——マルタ商会と交渉する',
  /* 12 */ '広場の老楽師を訪ねる',
  /* 13 */ '旧倉庫街で開業式典',
  /* 14 */ '港から世界航路へ出る',
];

export function goalOf(g: G): string {
  if (g.stage >= 99) return `エンディング「${g.ending ?? '調和'}」——世界は君の遊び場だ`;
  if (g.stage >= 14 && g.map === 'world') return `残る大陸に灯りを——あと${5 - g.大陸.length}つ`;
  return GOALS[g.stage] ?? GOALS[14];
}

const t = (text: string, speaker?: string, effect?: (g: G) => void, vista?: string): Step => ({ text, speaker, effect, vista });
const has = (g: G, f: string) => g.flags.includes(f);
const ECHO = '（――この選択は、遠くで響く気がする）';

// ==================== パーク設計会議（v0.3） ====================
// 大陸を重ねるごとに項目が増える。各選択は「こだわり」「効率」「中庸」の軸を持ち、
// 信念/実利・資金/評判に即座に反映される＋g.パーク[大陸]に記録が残る（後で見返せる）。

type Axis = 'こだわり' | '効率' | '中庸';
interface DesignOption { label: string; value: string; axis: Axis; note: string }
interface DesignItem { key: string; question: string; speaker?: string; options: DesignOption[] }

function axisEffect(axis: Axis): (s: G) => void {
  return (s: G) => {
    if (axis === 'こだわり') { s.信念 += 1; s.評判 += 2; s.資金 -= 100; }
    else if (axis === '効率') { s.実利 += 1; s.資金 += 150; s.評判 -= 1; }
    else { s.評判 += 1; s.資金 += 20; }
  };
}

function designStep(continent: string, item: DesignItem): Step {
  return {
    choices: item.options.map((o) => ({
      label: o.label,
      steps: [t(o.note, item.speaker)],
      effect: (s: G) => {
        axisEffect(o.axis)(s);
        s.パーク[continent] = { ...(s.パーク[continent] ?? {}), [item.key]: o.value };
      },
    })),
  };
}

/** 設計会議シーン一式。introの後、items数ぶんの問答が続く */
function designMeeting(continent: string, intro: Step[], items: DesignItem[]): Step[] {
  const body: Step[] = [];
  for (const item of items) {
    body.push(t(item.question, item.speaker));
    body.push(designStep(continent, item));
  }
  return [...intro, ...body];
}

const ITEMS_ASIA: DesignItem[] = [
  {
    key: 'テーマ', question: '……で、パーク全体を貫く世界観、どうする？', speaker: '日野',
    options: [
      { label: '学び舎の記憶をテーマにする', value: '学び舎の記憶', axis: 'こだわり', note: '「校舎そのものが物語になる。壊さんでよかったな」' },
      { label: '定番の非日常・遊園地にする', value: '非日常の遊園地', axis: '効率', note: '「わかりやすいのが一番や。早う客呼ぼ」' },
      { label: '里山の暮らしと遊びを融合させる', value: '里山と遊びの融合', axis: '中庸', note: '「田んぼも展示品や。それもありやな」' },
    ],
  },
  {
    key: 'シンボル', question: 'パークの顔になる建造物は？', speaker: '日野',
    options: [
      { label: '校舎の時計台を象徴として残す', value: '思い出の大時計塔', axis: 'こだわり', note: '「時計台、また動くようにしたで」' },
      { label: '大観覧車を新設する', value: '大観覧車', axis: '効率', note: '「遠くからでも見える。広告塔や」' },
      { label: '校庭の巨木をツリーハウスに', value: '巨木のツリーハウス', axis: '中庸', note: '「あの木、まだ元気やったな」' },
    ],
  },
  {
    key: '目玉', question: '一番の目玉アトラクションは？', speaker: '日野',
    options: [
      { label: '体育館を光と音のダークライドに', value: '光と音のダークライド', axis: 'こだわり', note: '「体育館の反響、活かせる思う」' },
      { label: '絶叫系コースターを入れる', value: '絶叫コースター', axis: '効率', note: '「叫び声が一番の広告や」' },
      { label: '参加体験型ワークショップにする', value: '参加体験ワークショップ', axis: '中庸', note: '「自分で作る、が一番残る思う」' },
    ],
  },
];

const ITEMS_EUROPE: DesignItem[] = [
  {
    key: 'ターゲット層', question: 'この街では、誰に向けたパークにする？', speaker: 'マルタ',
    options: [
      { label: '地元の家族連れを最優先する', value: '地元家族連れ', axis: 'こだわり', note: '「地元が愛さないと、観光客も来ないわ」' },
      { label: '観光客・インバウンド中心にする', value: 'インバウンド中心', axis: '効率', note: '「客単価が違う。割り切りましょ」' },
      { label: '文化好きの大人層を狙う', value: '文化層', axis: '中庸', note: '「祭りに出たあなたなら、分かるでしょ」' },
    ],
  },
  {
    key: '価格戦略', question: 'チケットの値付けは？', speaker: 'マルタ',
    options: [
      { label: '地域価格で薄利多売にする', value: '地域価格', axis: 'こだわり', note: '「この街の人が通える値段にね」' },
      { label: 'ダイナミックプライシングで最大化', value: '変動価格制', axis: '効率', note: '「繁忙期にしっかり回収するのよ」' },
      { label: '年間パス中心の設計にする', value: '年パス中心', axis: '中庸', note: '「常連を作る。悪くないわ」' },
    ],
  },
];

const ITEMS_AMERICA: DesignItem[] = [
  {
    key: 'セキュリティ', question: '安全・セキュリティの水準はどうする？', speaker: 'ハリス',
    options: [
      { label: '業界最高水準＋防災訓練を徹底', value: '最高水準の安全設計', axis: 'こだわり', note: '「訴訟大国だ。これは削れない」' },
      { label: '法定最小限に抑える', value: '法定最小限', axis: '効率', note: '「コストは正直、削れるだけ削る」' },
      { label: '標準的な保険と監視体制にする', value: '標準的な体制', axis: '中庸', note: '「無難だが、それでいい」' },
    ],
  },
  {
    key: 'スポンサー', question: 'コーポレートスポンサーは付ける？', speaker: 'ハリス',
    options: [
      { label: '大型スポンサー複数、冠付きにする', value: '大型スポンサー複数', axis: '効率', note: '「金は出る。名前は少し借りるがな」' },
      { label: 'スポンサーなし、ブランド純度優先', value: 'スポンサーなし', axis: 'こだわり', note: '「……珍しいタイプだな、お前」' },
      { label: '地元企業のみ小口で受ける', value: '地元企業のみ', axis: '中庸', note: '「地に足つけるタイプか」' },
    ],
  },
];

const ITEMS_OCEANIA: DesignItem[] = [
  {
    key: '人員研修', question: 'キャストの育て方は？', speaker: 'ノア',
    options: [
      { label: '本国メソッドを長期研修で叩き込む', value: '本国式長期研修', axis: 'こだわり', note: '「クオリティは揃うけど、時間かかるわよ」' },
      { label: '現地採用、最小限の研修で回す', value: '現地採用・最小研修', axis: '効率', note: '「早く開けるのが一番でしょ」' },
      { label: '現地文化を取り入れた独自研修にする', value: '独自研修', axis: '中庸', note: '「面白いやり方ね、それ」' },
    ],
  },
  {
    key: '飲食物販', question: '何を売る？', speaker: 'ノア',
    options: [
      { label: '土地の食材を使った一点物にする', value: '土地の一点物', axis: 'こだわり', note: '「地元の漁師、喜ぶと思うわよ」' },
      { label: 'グローバル標準メニューで統一', value: 'グローバル標準', axis: '効率', note: '「補充も管理も楽になるわ」' },
      { label: '半分ずつ組み合わせる', value: '半々構成', axis: '中庸', note: '「バランス派ね」' },
    ],
  },
];

const ITEMS_AFRICA: DesignItem[] = [
  {
    key: '環境インフラ', question: '電力と環境配慮はどうする？', speaker: 'アマラ',
    options: [
      { label: '太陽光＋雨水利用のグリーン設計にする', value: 'グリーン設計', axis: 'こだわり', note: '「この土地には、それが一番似合うわ」' },
      { label: '最速で作れる標準インフラにする', value: '標準インフラ', axis: '効率', note: '「まずは開けることが正義よ」' },
      { label: '一部だけグリーン化する', value: '一部グリーン化', axis: '中庸', note: '「現実的な落としどころね」' },
    ],
  },
  {
    key: '将来拡張', question: 'この先の展望は？', speaker: 'アマラ',
    options: [
      { label: 'ここで完成とし、深化させていく', value: '深化重視', axis: 'こだわり', note: '「広げるだけが正解じゃないものね」' },
      { label: 'すぐ次のフェーズ用地を確保する', value: '拡張重視', axis: '効率', note: '「野心的ね。嫌いじゃないわ」' },
      { label: '様子を見て決める', value: '様子見', axis: '中庸', note: '「賢明だと思うわ」' },
    ],
  },
];

// ---- エンディング判定 ----

function trail(g: G): Step[] {
  const L: string[] = [];
  L.push(has(g, '融資') ? '資金：銀行から借り、自力で返した' : '資金：鷹司の出資で速度を買った');
  if (has(g, '金で迫った')) L.push('土地：一度、金で迫ってしまった');
  L.push(has(g, '記憶を残す設計') ? '設計：校舎の記憶を残した' : '設計：まっさらから建て直した');
  L.push(has(g, '岬不在') ? '採用：岬を見送った' : '採用：岬が第一号になった');
  L.push(has(g, '直営') ? '欧州：直営で背負った' : '欧州：マルタと組んだ');
  L.push(has(g, '文化軽視') ? '祭り：囃子に背を向けた' : '祭り：山車を担いだ');
  L.push(has(g, 'IPO') ? '米国：市場に打って出た' : '米国：土地の資本と組んだ');
  L.push(has(g, '委譲') ? '豪州：岬に灯りを託した' : has(g, '現場主義') ? '豪州：自分の体で灯した' : '豪州：見知らぬ誰かに賭けた');
  const 里山テーマ = g.パーク['アジア']?.['テーマ'];
  if (里山テーマ) L.push(`原点：里山のテーマは「${里山テーマ}」`);
  return L.map((s) => t(`・${s}`));
}

function endingScene(g: G): Step[] {
  let 名 = '調和';
  if (g.実利 - g.信念 >= 3) 名 = '帝国';
  else if (g.信念 - g.実利 >= 3) 名 = '巡礼';
  else if (g.仲間.includes('岬') && has(g, '委譲')) 名 = '家族';
  else if (has(g, '岬不在') || has(g, '現場主義')) 名 = '独行';

  const fix = (s: G) => { s.ending = 名; s.評判 = 100; if (!s.大陸.includes('アフリカ')) s.大陸.push('アフリカ'); s.stage = 99; };

  const body: Record<string, Step[]> = {
    帝国: [
      t('五つの大陸。時価総額。空港の広告。', undefined, fix, 'ending'),
      t('世界は、あなたの遊び場を「産業」と呼んだ。'),
      t('……悪くない。ただ、ゲートの外の行列を見るたび、'),
      t('最初の校庭の、あの静けさを思い出す。'),
    ],
    巡礼: [
      t('五つの大陸。五つの土地の匂い。', undefined, fix, 'ending'),
      t('どのパークも、少しずつ形が違う。土地が形を決めたからだ。'),
      t('小野田「……ワシの学校が、世界の親玉になっとるとはな」'),
      t('あなたは今日も、どこかの現場で光の当て方を直している。'),
    ],
    家族: [
      t('五つの大陸に、五人の「任された人」がいる。', undefined, fix, 'ending'),
      t('岬「園長、こっちは任せてくださいって言ったでしょ」'),
      t('日野「わしら、もう行くとこ無くなってもうたな」'),
      t('遊び場は、人に渡した分だけ広くなった。'),
    ],
    独行: [
      t('五つの大陸を、あなたはひとりで回り続けた。', undefined, fix, 'ending'),
      t('身体は正直だ。夜、観覧車の一番上の座席でだけ、深く息をつく。'),
      t('それでも、灯りは五つ、確かに点いている。'),
      t('全部、この手で点けた灯りだ。'),
    ],
    調和: [
      t('五つの大陸。五つの灯り。', undefined, fix, 'ending'),
      t('貫いた日もあった。折れた日もあった。その全部が図面になった。'),
      t('マルタ「次は月？」　日野「アホ言え……で、いつ行く？」'),
      t('あなたは笑って、地図を畳んだ。'),
    ],
  };

  return [
    t(`―― エンディング「${名}」 ――`, undefined, undefined, 'ending'),
    ...body[名],
    t('—— 歩んだ道 ——'),
    ...trail(g),
    t('—— THE END ——　遊び続けろ。'),
  ];
}

// ==================== シーン ====================

export function sceneFor(id: string, g: G): Step[] | null {
  switch (id) {
    // ======== 第1幕 大阪 ========
    case 'atelier':
      if (g.stage === 0) {
        return [
          t('静かだ。道具の音だけがする。', undefined, undefined, 'workshop'),
          t('（手が、止まらない――）', undefined, undefined, 'workshop'),
          t('三十六時間後。', undefined, undefined, 'workshop'),
          t('代表作『環（めぐる）』が完成した！', undefined, (s) => { s.評判 += 5; s.stage = 1; }),
          t('（これを、誰かに見せなければ）'),
        ];
      }
      return [t('作業台の隅に、次回作の螺旋がスケッチのまま眠っている。')];

    case 'gallery':
      if (g.stage === 1) {
        return [
          t('ほう……持ち込みか。見せてみなさい。', '柏木'),
          t('…………。', '柏木'),
          t('癖がある。だが、人を立ち止まらせる力だ。', '柏木'),
          t('うちの壁を二週間貸そう。個展をやりなさい。', '柏木'),
          t('個展『環』開催——地元紙に小さく載った。', undefined, (s) => { s.評判 += 10; s.stage = 2; }),
        ];
      }
      if (g.stage < 1) return [t('シャッターに貼り紙。「持ち込み歓迎。ただし本気のみ」')];
      return [t('歩みを止めるな。', '柏木')];

    case 'cafe':
      if (g.stage === 2) {
        return [
          t('よう。ニュース見たで、個展。', '日野'),
          t('なあ。昔から言うてたやん。「世界五大陸にテーマパーク作る」って。', '日野'),
          {
            choices: [
              { label: '本気だ', steps: [t('よっしゃ。ほな、会社やな。わし実務やるわ。', '日野')], effect: (s) => { s.信念 += 1; } },
              { label: '……怖い、正直', steps: [t('怖ないやつの夢は、しょぼいねん。行こか。', '日野')], effect: (s) => { s.信念 += 1; } },
              { label: '儲かると思うか？', steps: [t('知らん。けど、お前が本気なら金は後からついてくる。', '日野')], effect: (s) => { s.実利 += 1; } },
            ],
          },
          t('日野が仲間になった！', undefined, (s) => { s.仲間.push('日野'); s.stage = 3; }),
          t('まず法務局や。会社がなけりゃ土地も金も動かん。', '日野'),
        ];
      }
      if (g.stage < 2) return [t('コーヒーの匂い。奥の席で、旧友の日野が新聞を読んでいる。')];
      return [t('次の一手、決まっとるか？', '日野')];

    case 'company':
      if (g.stage >= 3 && !has(g, '退職') && !has(g, '兼業')) {
        return [
          t('「……会社を作った、だと？」', '上司'),
          t('「で、どうする。うちを辞めるのか」', '上司'),
          {
            choices: [
              {
                label: '辞める。退路を断つ',
                steps: [
                  t('「お前の作るもの、実は好きだったよ。行ってこい」', '上司'),
                  t('退職した。もう、後ろに道はない。', undefined, (s) => { s.flags.push('退職'); s.信念 += 1; }),
                  t(ECHO),
                ],
              },
              {
                label: 'まだ辞めない（二足のわらじ）',
                steps: [
                  t('「賢いな。給料は命綱だ」', '上司'),
                  t('当面、二足のわらじで行く。眠る時間が削れていく。', undefined, (s) => { s.flags.push('兼業'); s.実利 += 1; }),
                  t(ECHO),
                ],
              },
            ],
          },
        ];
      }
      if (has(g, '退職')) return [t('元の職場。窓の灯りが、少しだけ懐かしい。')];
      if (has(g, '兼業')) return [t('デスクの引き出しに、パークの図面が隠してある。')];
      return [t('今日も定時までデスクワーク。（夢の時間は、夜にある）')];

    case 'home':
      return [t('（記録した。……よく眠れそうだ）')];

    case 'shrine':
      if (!has(g, '参拝')) {
        return [
          t('小さな社。柏手の音が、川面に抜けていく。'),
          t('（……何かが、澄んだ気がする）', undefined, (s) => { s.flags.push('参拝'); s.信念 += 1; }),
        ];
      }
      return [t('絵馬が風に鳴っている。「五大陸」と書いた字は、もう少し乾いていない。')];

    case 'shoten':
      if (g.stage >= 11) return [t('里山のパーク、テレビで見たで！ あんたやろ？ コロッケおまけしたる！', '商店主')];
      return [t('うちのコロッケ、日本一やで。夢見る前にまず食べ。', '商店主')];

    case 'kids':
      if (g.stage >= 11) return [t('観覧車のらせて！ 五回のらせて！', '子ども')];
      return [t('おっちゃん、なにしてる人ー？', '子ども')];

    case 'obaa':
      return [t('川の向こうとこっち、橋があるだけでひとつの町や。世界もそうやとええな。', 'おばあさん')];

    // ======== 第2幕 ビジネス街 ========
    case 'houmukyoku':
      if (g.stage === 3) {
        return [
          t('書類、書類、また書類。'),
          t('定款の目的欄は……「テーマパークの企画・運営」と。', '窓口'),
          t('登録免許税など30万円を納めた。', undefined, (s) => { s.資金 -= 30; }),
          t('株式会社ワンダー環、設立！', undefined, (s) => { s.stage = 4; }),
          t('次は金や。夢は無料やけど、工事は有料やで。', '日野'),
        ];
      }
      return [t('登記簿の中で、会社は今日も生きている。')];

    case 'bank':
      if (g.stage === 4) {
        return [
          t('事業計画書を拝見……廃校を改装した体験型パーク、ですか。', '支店長'),
          t('実績は個展のみ。ですが——地域創生枠で検討できます。', '支店長'),
          {
            choices: [
              {
                label: '融資を受ける（3,000万円・毎月返済）',
                steps: [
                  t('ご返済は、きっちりと。', '支店長', undefined, 'contract'),
                  t('3,000万円を調達した。会社は自分たちのもの。ただし毎月、返済日が来る。', undefined,
                    (s) => { s.資金 += 3000; s.flags.push('融資'); s.信念 += 1; s.stage = 5; }),
                  t(ECHO),
                  t('いきなり夢の国は建たん。小さい一号で証明や。バスで里山町、行くで。', '日野'),
                ],
              },
              { label: 'やめておく', steps: [t('（鷹司キャピタルという手もある）')] },
            ],
          },
        ];
      }
      if (has(g, '融資')) return [t('返済は今月も遅れなし。支店長の会釈が、少しずつ深くなる。', '支店長')];
      return [t('金利のポスターが、静かにこちらを見ている。')];

    case 'vc':
      if (g.stage === 4) {
        return [
          t('五大陸？ ふかしにしては、目が本気だな。', '鷹司'),
          t('出資しよう。5,000万。ただし取締役会には私も座る。', '鷹司'),
          {
            choices: [
              {
                label: '出資を受ける（5,000万円・口も出る）',
                steps: [
                  t('いい判断だ。金だけじゃなく、人も紹介する。', '鷹司', undefined, 'contract'),
                  t('5,000万円を調達した。速度と引き換えに、株主という同乗者を得た。', undefined,
                    (s) => { s.資金 += 5000; s.flags.push('外部資本'); s.実利 += 1; s.stage = 5; }),
                  t(ECHO),
                  t('いきなり夢の国は建たん。小さい一号で証明や。バスで里山町、行くで。', '日野'),
                ],
              },
              { label: '考え直す', steps: [t('ドアはしばらく開けておく。', '鷹司')] },
            ],
          },
        ];
      }
      if (has(g, '外部資本')) return [t('数字はどうした。夢の進捗を、数字で語れ。', '鷹司')];
      return [t('受付の胡蝶蘭が、場違いなほど立派だ。')];

    case 'office':
      if (g.stage >= 4) return [t('ホワイトボードに日野の字。「五大陸まで、あと' + (5 - g.大陸.length) + 'つ」')];
      return [t('空きテナント。「貸事務所」の貼り紙が斜めになっている。')];

    case 'salaryman':
      return [t('起業ぉ？ やめとけやめとけ……いや、ほんまは、うらやましいわ。', '会社員')];

    case 'uketsuke':
      if (has(g, '外部資本')) return [t('鷹司は最近、あなたの話ばかりしています。……珍しいことです。', '受付')];
      return [t('アポイントのない方は、まず実績をお持ちください。', '受付')];

    // ======== 第3幕 里山町 ========
    case 'school':
      if (g.stage === 5) {
        return [
          t('蔦の絡んだ校門。「旧・里山小学校」。'),
          t('体育館。プール跡。錆びた雲梯。広すぎる校庭。'),
          t('（頭の中に、入口ゲートが立ち上がった）'),
          t('ええやん……ここや。地主に話つけよ。小野田いう元校長らしいわ。', '日野', (s) => { s.stage = 6; }),
        ];
      }
      if (g.stage >= 6 && g.stage <= 8) return [t('校庭に風。まだ、誰の声もしない。')];
      if (g.stage === 9) {
        if (has(g, '兼業')) return [t('槌音が響く。（有給はもう一日も残っていない……）')];
        return [t('槌音が響く。校舎が、遊び場に生まれ変わっていく。')];
      }
      if (g.stage === 10) {
        const meeting = designMeeting(
          'アジア',
          [t('工事の目処が立った。開業前に——中身を決めなあかん。', '日野'), t('これが、一番最初の設計会議になる。')],
          ITEMS_ASIA,
        );
        const openSteps: Step[] = [t('設計、固まったな。……ほな、開けよか。', '日野', undefined, 'ceremony')];
        openSteps.push(t('開業当日。校門の前に、行列ができている。', undefined, undefined, 'ceremony'));
        if (has(g, '金で迫った')) {
          openSteps.push(t('来賓席に、小野田の姿はなかった。', undefined, undefined, 'ceremony'));
          openSteps.push(t('（あの日の言葉は、まだ返しきれていない）', undefined, undefined, 'ceremony'));
        } else {
          openSteps.push(t('……子どもらの声や。ほんまに戻ってきよった。', '小野田', undefined, 'ceremony'));
          if (has(g, '記憶を残す設計')) openSteps.push(t('教室の黒板に、来場者が最初の落書きをした。小野田が、それを消さずに笑った。', undefined, undefined, 'ceremony'));
        }
        openSteps.push(has(g, '岬不在')
          ? t('スタッフはまだ、日野と二人だけだ。回るのか、これで。', undefined, undefined, 'ceremony')
          : t('岬「開門しまーす！」の声が、校庭に響いた。', undefined, undefined, 'ceremony'));
        openSteps.push(t(`テープカット！ 「ワンダー環・里山（${g.パーク['アジア']?.['テーマ'] ?? '環'}）」開業！`, undefined, undefined, 'ceremony'));
        openSteps.push(t(
          has(g, '金で迫った') ? '初日来場者988人。悪くない。だが町の空気は、まだ少し硬い。' : '初日来場者1,204人。「廃校がテーマパークに」とSNSで話題に。',
          undefined,
          (s) => { s.資金 += 800; s.評判 += has(s, '金で迫った') ? 12 : 20; s.大陸.push('アジア'); s.stage = 11; },
        ));
        if (has(g, '外部資本')) openSteps.push(t('悪くない滑り出しだ。——次は海外だな？', '鷹司'));
        openSteps.push(t('海外から視察の連絡や。ヨーロッパの事業家、マルタさん。空港行くで。', '日野'));
        return [...meeting, ...openSteps];
      }
      return [t('観覧車がゆっくり回る。今日も家族連れの声がする。')];

    case 'jinushi':
      if (g.stage === 6) {
        const persuade: Step[] = [];
        if (has(g, '金で迫った')) {
          persuade.push(t('「まず……先日の非礼を、詫びさせてください」'));
          persuade.push(t('…………続けてみい。', '小野田'));
        }
        persuade.push(t('…………。', '小野田'));
        persuade.push(t('……校舎、壊さんのか。', '小野田'));
        persuade.push(t('「教室も黒板も、遊びの舞台として残します」'));
        persuade.push(t('……年100万。安うしとく。子どもらの声が戻るんなら、や。', '小野田',
          (s) => { s.資金 -= 100; s.flags.push('土地'); s.stage = 7; }, 'contract'));
        persuade.push(t('次は役場や。許認可がないと工事も営業もできん。', '日野'));
        return [
          t('学校を、遊び場にする……やと？', '小野田'),
          t('あそこには六十年ぶんの卒業生の思い出が詰まっとる。', '小野田'),
          {
            choices: [
              { label: '作品と構想を見せる', steps: persuade },
              {
                label: '相場の倍を提示する',
                steps: [
                  t('帰れ。', '小野田'),
                  t('……金の話やない。それが分からんうちは、二度と来るな。', '小野田',
                    (s) => { if (!s.flags.includes('金で迫った')) { s.flags.push('金で迫った'); s.実利 += 1; } }),
                  t(ECHO),
                ],
              },
            ],
          },
        ];
      }
      if (g.stage < 6) return [t('表札「小野田」。庭の手入れが行き届いている。')];
      if (has(g, '金で迫った')) return [t('……ワシは、金の話は忘れとらんぞ。仕事で見せてみい。', '小野田')];
      return [t('ワシも開業日にはコロッケ揚げて行くでな。', '小野田')];

    case 'yakuba':
      if (g.stage === 7) {
        const steps: Step[] = [
          t('廃校活用！！ 待ってました！！', '観光課・湊'),
          t('ただし手続きは山です。用途変更、建築確認、消防、保健所……', '観光課・湊'),
        ];
        if (has(g, '融資')) steps.push(t('銀行の担当も同席した。返済計画に、許認可の日程が直結するからだ。'));
        steps.push(t('——三週間、役場に通い詰めた。'));
        steps.push(t('許認可、すべて下りた！', undefined, (s) => { s.stage = 8; }));
        steps.push(t('次は工事や。戸叶組いう地元の建設会社がええらしい。', '日野'));
        return steps;
      }
      if (g.stage < 7) return [t('掲示板に「人口、また減りました」の広報紙。')];
      return [t('町の観光パンフ、表紙が観覧車になりました！', '観光課・湊')];

    case 'tokoh':
      if (g.stage === 8) {
        return [
          t('廃校の改装ね。見積もり……全面改装なら2,500万。', '戸叶'),
          t('校舎を活かす設計なら1,500万。思い出ごと残す、ってやつだ。', '戸叶'),
          {
            choices: [
              {
                label: '全面改装（2,500万円）',
                steps: [
                  t('まっさらから作る。それも覚悟だ。', '戸叶',
                    (s) => { s.資金 -= 2500; s.flags.push('全面改装'); s.実利 += 1; }),
                  ...(has(g, '融資') ? [t('（返済を考えると、腹の底が冷える）')] : []),
                ],
              },
              {
                label: '校舎を活かす（1,500万円）',
                steps: [
                  t('……いい選択だ。思い出は最強のアトラクションだからな。', '戸叶',
                    (s) => { s.資金 -= 1500; s.評判 += 5; s.flags.push('記憶を残す設計'); s.信念 += 1; }),
                ],
              },
            ],
          },
          t('工事が始まった。', undefined, (s) => { s.stage = 9; }),
          t(ECHO),
          t('三ヶ月で仕上げる。あんたはその間に、人を集めな。', '戸叶'),
        ];
      }
      return [t('ヘルメットが並ぶ。今日も現場は動いている。')];

    case 'misaki':
      if (g.stage === 9) {
        return [
          t('あの、求人を見て来ました。地元出身です。', '岬'),
          t('小さい頃……この学校に通ってたんです。', '岬'),
          {
            choices: [
              {
                label: '採用する',
                steps: [
                  t('岬が仲間になった！ スタッフ第一号。', undefined, (s) => { s.仲間.push('岬'); s.stage = 10; }),
                  t('開業式典、絶対いい日にしましょうね！', '岬'),
                ],
              },
              {
                label: '人件費を抑えたい。今回は見送る',
                steps: [
                  t('……また、来ます。', '岬',
                    (s) => { s.flags.push('岬不在'); s.実利 += 1; s.stage = 10; }),
                  t('（開業はまず、日野と二人で回すしかない）'),
                  t(ECHO),
                ],
              },
            ],
          },
        ];
      }
      if (g.stage >= 10 && g.仲間.includes('岬')) return [t('今日の来場者アンケート、ほぼ満点です！', '岬')];
      return null;

    case 'farmer':
      if (g.stage >= 11) return [t('孫が年間パス欲しい言うとる。ワシの田んぼも見学コースに入れてくれや。', '農夫')];
      return [t('学校なぁ。また賑やかになるんか、あそこは。', '農夫')];

    // ======== 第4幕 ヨーロッパ ========
    case 'broker':
      if (g.stage === 11) {
        const intro: Step[] = [
          t('ようこそ。里山の映像、観たわ。子どもの目の色が違った。', 'マルタ'),
          t('うちの街の旧倉庫街で、二号をやらない？', 'マルタ'),
        ];
        if (has(g, '外部資本')) intro.push(t('（同席の鷹司）直営でやれ。出した金は、利益で返してもらうぞ。', '鷹司'));
        const sealed: Step[] = [
          t('契約成立。ただし——', 'マルタ', (s) => { s.stage = 12; }, 'contract'),
          t('この街を知らずに作るのは、やめてね。広場の老楽師を訪ねなさい。', 'マルタ'),
        ];
        const choices: Step = {
          choices: [
            g.資金 >= 2000
              ? {
                  label: '直営でやる（自社2,000万・利益は全部）',
                  steps: [
                    t('肝が太いのね。いいわ、土地は世話する。', 'マルタ',
                      (s) => { s.資金 -= 2000; s.flags.push('直営'); s.実利 += 1; }),
                    ...(has(g, '外部資本') ? [t('それでいい。', '鷹司')] : []),
                    ...sealed,
                  ],
                }
              : {
                  label: '直営でやる（……資金が足りない）',
                  steps: [t('（2,000万は出せない。今は、組むしかない）')],
                },
            {
              label: '合弁にする（マルタ資本・ブランド監修は自社）',
              steps: [
                t('賢い。海外一発目は、土地の人と組むのが定石よ。', 'マルタ',
                  (s) => { s.flags.push('合弁'); s.信念 += 1; }),
                ...(has(g, '外部資本')
                  ? [t('……好きにしろ。だが、覚えておけ。', '鷹司', (s) => { s.flags.push('鷹司と対立'); }), t(ECHO)]
                  : []),
                ...sealed,
              ],
            },
          ],
        };
        return [...intro, choices];
      }
      if (g.stage < 11) return [t('石造りの商会。扉は重い。')];
      return [t('進捗はどう？ 焦らなくていいけど、休むのは禁止よ。', 'マルタ')];

    case 'gakushi':
      if (g.stage === 12) {
        return [
          t('東洋の遊び場屋か。話は聞いとる。', '老楽師'),
          t('祭りはな、観るもんじゃない。担ぐもんだ。……で、どうする。', '老楽師'),
          {
            choices: [
              {
                label: '祭りに参加する',
                steps: [
                  t('——山車を担いだ。火を囲んだ。歌の意味を教わった。', undefined, undefined, 'workshop'),
                  t('（この土地の「遊びの記憶」が、体に入った）', undefined,
                    (s) => { s.評判 += 5; s.flags.push('文化適応'); s.信念 += 1; s.stage = 13; }),
                  t('倉庫街に行け。お前の国の遊びと、混ぜてみせろ。', '老楽師'),
                ],
              },
              {
                label: '設計が押している。参加は見送る',
                steps: [
                  t('……そうかい。囃子は、待たんよ。', '老楽師',
                    (s) => { s.flags.push('文化軽視'); s.実利 += 1; s.stage = 13; }),
                  t(ECHO),
                ],
              },
            ],
          },
        ];
      }
      if (g.stage > 12) {
        if (has(g, '文化軽視')) return [t('……囃子は待たんと言ったろう。', '老楽師')];
        return [t('開業の日は、わしの楽団が先導するでな。', '老楽師')];
      }
      return null;

    case 'cityhall':
      if (has(g, '文化適応')) return [t('石畳の改修許可、すんなり下りた。「あの祭りに出た人だから」だそうだ。')];
      return [t('窓口の列が長い。この街の時間は、ゆっくり流れる。')];

    case 'machibito':
      if (has(g, '文化軽視')) return [t('祭りに来なかった東洋人の話、みんなしてるよ。……この街は、覚えてるからね。', '街の人')];
      if (has(g, '文化適応')) return [t('山車、担いでたね！ あんた、もうこの街の人だよ。', '街の人')];
      return [t('広場の鳩は、観光客の数だけ太る。', '街の人')];

    case 'eusite':
      if (g.stage === 13) {
        const meeting = designMeeting(
          'ヨーロッパ',
          [t('海外一号だ。ここでは、また違う項目を詰めなあかん。', '日野'), t('客層と、値付け。決めよか。')],
          ITEMS_EUROPE,
        );
        if (has(g, '文化軽視')) {
          return [...meeting,
            t('旧倉庫街のゲート前。石畳は、静かだった。', undefined, undefined, 'ceremony'),
            t('……言ったでしょ、って顔はしないであげる。', 'マルタ', undefined, 'ceremony'),
            t('「ワンダー環・欧州」開業。客足は、初日から伸び悩んだ。', undefined,
              (s) => { s.資金 += 600; s.評判 += 8; s.大陸.push('ヨーロッパ'); s.flags.push('欧州苦戦'); s.stage = 14; }, 'ceremony'),
            t('祭りの街で、祭りに出んかった。……効いとるなあ。', '日野'),
            t('港から世界航路が開いた。……巻き返すで。', '日野'),
          ];
        }
        return [...meeting,
          t('旧倉庫街のゲート前。石畳に、あの祭りの提灯が揺れる。', undefined, undefined, 'ceremony'),
          t('老楽師の楽団が、先導の一節を吹いた。', undefined, undefined, 'ceremony'),
          t('あなたの国の遊びと、この街の記憶の混ぜ物。悪くないでしょ。', 'マルタ', undefined, 'ceremony'),
          t('「ワンダー環・欧州」開業！ 二つ目の大陸。', undefined,
            (s) => { s.資金 += 1500; s.評判 += 15; s.大陸.push('ヨーロッパ'); s.stage = 14; }, 'ceremony'),
          t('港から世界航路が開いたで。ここからは、地図の話や。', '日野'),
        ];
      }
      if (g.stage < 13) return [t('煤けた旧倉庫。だが——骨格がいい。')];
      return [t('石畳の上を、観覧車の影がゆっくり滑っていく。')];

    // ======== 第5幕 世界航路 ========
    case 'sailor':
      return [t('五つの海を渡るんだろ？ ……いい顔してるよ、あんた。', '船乗り')];

    case 'asia_node':
      return [t('遠く、里山の観覧車が回っている。ここから、すべてが始まった。')];

    case 'europe_node':
      if (has(g, '欧州苦戦')) return [t('提灯のないパーク。それでも少しずつ、客足は戻り始めている。')];
      return [t('提灯と石畳のパーク。老楽師の楽団の音が、風に乗って届く。')];

    case 'america':
      if (g.大陸.includes('アメリカ')) return [t('三年かけたパークが、地平線まで続いている。')];
      if (g.stage >= 14) {
        const meeting = designMeeting(
          'アメリカ',
          [t('ここは桁が違うぞ。決めることも増える。', 'ハリス'), t('安全とスポンサー、まず詰めよう。', 'ハリス')],
          ITEMS_AMERICA,
        );
        const intro: Step[] = [t('本気の資本が要る。どう作る？', 'ハリス')];
        if (has(g, '外部資本')) intro.push(t('上場しろ。それが最短だ。', '鷹司'));
        const ipoSteps: Step[] = has(g, '融資')
          ? [
              t('借入があると、上場審査は厳しい。', 'ハリス'),
              t('審査は難航した。……最後に効いたのは、遅れなしの返済実績だった。', undefined,
                (s) => { s.資金 += 4000; s.flags.push('IPO'); s.実利 += 2; }, 'contract'),
              t('株主という名の観客が、何万人も増えた。'),
            ]
          : [
              t('株主という名の観客が、何万人も増えた。', undefined,
                (s) => { s.資金 += 5000; s.flags.push('IPO'); s.実利 += 2; }, 'contract'),
            ];
        const jvSteps: Step[] = [
          t('速い。ただし手綱は共有だ。', 'ハリス', (s) => { s.資金 += 3000; s.flags.push('米国合弁'); s.信念 += 1; }, 'contract'),
        ];
        if (has(g, '鷹司と対立')) {
          jvSteps.push(t('——また私の反対を押し切るのか。', '鷹司'));
          if (g.評判 >= 60) {
            jvSteps.push(t('「数字より先に、土地の信頼を取る。欧州で証明したはずです」'));
            jvSteps.push(t('…………。いいだろう。今回だけだ。', '鷹司', (s) => { s.信念 += 1; }));
          } else {
            jvSteps.push(t('取締役会は紛糾した。鷹司の持ち株を、2,000万で買い戻すことになった。', undefined,
              (s) => { s.資金 -= 2000; s.flags.push('株を買い戻した'); }));
          }
        }
        return [...meeting, ...intro,
          { choices: [
            { label: '上場して資金を作る（IPO）', steps: ipoSteps },
            { label: '現地財閥と合弁する', steps: jvSteps },
          ] },
          t('——三年の建設を経て。'),
          t('「ワンダー環・アメリカ」開業！', undefined,
            (s) => { s.評判 += 15; if (!s.大陸.includes('アメリカ')) s.大陸.push('アメリカ'); }, 'ceremony'),
        ];
      }
      return null;

    case 'oceania':
      if (g.大陸.includes('オセアニア')) return [t('海風のパーク。朝礼の声が、波音に混ざって聞こえる。')];
      if (g.stage >= 14) {
        const meeting = designMeeting(
          'オセアニア',
          [t('人と、味。ここではその二つを詰めよう。', 'ノア')],
          ITEMS_OCEANIA,
        );
        const choices: { label: string; steps?: Step[]; effect?: (s: G) => void }[] = [];
        if (g.仲間.includes('岬')) {
          choices.push({
            label: '岬を現地代表として送る',
            steps: [
              t('……任せてください。あの学校で教わったこと、全部やります。', '岬',
                (s) => { s.flags.push('委譲'); s.信念 += 1; }),
              t('空港で、岬は一度だけ振り返って、深く礼をした。'),
            ],
          });
        }
        choices.push({
          label: '自分が一年、住み込む',
          steps: [
            t('体は正直よ。ほどほどにね。', 'ノア',
              (s) => { s.flags.push('現場主義'); s.資金 -= 500; }),
            t('一年後。工事は完璧だった。——咳だけが、少し長引いた。', undefined,
              (s) => { s.flags.push('無理がたたる'); }),
            t(ECHO),
          ],
        });
        if (has(g, '岬不在')) {
          choices.push({
            label: '現地で一から採用する',
            steps: [
              t('顔も知らない誰かに、灯りを預ける。', undefined,
                (s) => { s.flags.push('現地任せ'); s.実利 += 1; }),
              t('（岬を採っていれば……いや、考えるな）'),
            ],
          });
        }
        return [...meeting,
          t('ここまで来ると、あなたの体は一つしかないのが問題ね。', 'ノア'),
          t('もう、全部の現場には立てない。', 'ノア'),
          { choices },
          t('「ワンダー環・オセアニア」開業！ 四つ目の大陸。', undefined,
            (s) => { s.資金 += 3000; s.評判 += 10; if (!s.大陸.includes('オセアニア')) s.大陸.push('オセアニア'); }, 'ceremony'),
          t('残るは——あと一つ。'),
        ];
      }
      return null;

    case 'africa':
      if (g.大陸.includes('アフリカ')) return [t('五つ目の観覧車が、夕陽の中で回っている。')];
      if (g.stage >= 14 && g.大陸.length >= 4) {
        const meeting = designMeeting(
          'アフリカ',
          [t('最後の大陸。ここでは、未来の話も決めておこう。', 'アマラ')],
          ITEMS_AFRICA,
        );
        const intro: Step[] = [t('最後の大陸へ、ようこそ。', 'アマラ')];
        if (has(g, '文化軽視')) intro.push(t('ヨーロッパでは、祭りに出なかったそうね。——ここでは、そうはいかないわ。', 'アマラ'));
        intro.push(t('一つだけ聞かせて。あなたは、なぜ作り続けるの？', 'アマラ'));
        return [...meeting, ...intro,
          {
            choices: [
              { label: '子どもの頃の自分のため', steps: [t('なら、その子はもう報われてるわ。', 'アマラ', (s) => { s.信念 += 1; })] },
              { label: 'まだ見ぬ観客のため', steps: [t('その人たちは、もう門の外に並んでる。', 'アマラ', (s) => { s.信念 += 1; })] },
              { label: 'もう、理由は要らない', steps: [t('……それが一番強い答えね。', 'アマラ', (s) => { s.flags.push('無心'); })] },
            ],
          },
          t('——「ワンダー環・アフリカ」開業。', undefined, undefined, 'ceremony'),
          t('五つの大陸に、灯りが点いた。', undefined, undefined, 'ceremony'),
          ...endingScene(g),
        ];
      }
      if (g.stage >= 14) return [t('まだ早いわ。他の大陸を灯しておいで。', 'アマラ')];
      return null;

    default:
      return null;
  }
}
