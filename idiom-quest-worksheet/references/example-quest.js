/* 成語圖文探險單：範例課程檔（瑪莉模板的 6 個成語）
   只宣告 const QUEST = {...}。插圖 art 用 assets/lib.js 的繪圖函式，畫布 1280×720，
   探險單只顯示中間 4:3 區域（x 160～1120），主角放中間、畫大。
   老師自己生圖時，把圖片放進 images/ 並在該成語寫 img: 'images/檔名.png'（img 優先於 art）。 */
const QUEST = {
  title: '成語圖文探險單',
  // grade: '三年級',        // 選填：顯示在標題下方
  // subtitle: '第十二課',   // 選填：課次或主題
  seed: 7,                   // 打亂順序用的種子；換數字就換一種排列
  idioms: [
    /* ---------- 1 畫蛇添足（負面結果） ---------- */
    {
      word: '畫蛇添足',
      meaning: '做了【多餘的事】，反而把事情弄糟。',
      sentence: '這幅畫原本已經很美了，他卻又隨便塗上幾筆，結果變得好難看，真是（）。',
      prompt: '一個小男孩在畫紙上畫一條綠色的蛇，正得意地幫蛇加上四隻腳，旁邊的小女孩搖頭',
      art: (T) => room('#fff4e0', '#e9c48f', 600)
        + `<g transform="translate(330 130) rotate(-4)"><rect width="420" height="300" rx="10" fill="#fff" stroke="${OL}" stroke-width="7"/>`
        + `<path d="M60 210 C110 120 170 260 230 170 S330 110 360 150" stroke="${OL}" stroke-width="40" fill="none" stroke-linecap="round"/>`
        + `<path d="M60 210 C110 120 170 260 230 170 S330 110 360 150" stroke="#5cc05a" stroke-width="28" fill="none" stroke-linecap="round"/>`
        + `<circle cx="366" cy="146" r="9" fill="${OL}"/><path d="M380 156 l22 6 l-6 -10 m6 10 l-12 8" stroke="#e8505b" stroke-width="5" fill="none" stroke-linecap="round"/>`
        + [[110, 185], [165, 215], [225, 185], [290, 140]].map(([x, y]) => `<path d="M${x} ${y} l-8 46 m0 0 l-12 6 m12 -6 l4 10 m-4 -10 l12 2" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/>`).join('')
        + `</g>`
        + kid(880, 780, 1.75, T, { hair: 'boy', shirt: '#ff6b35', face: 'proud', L: 150, flip: true, prop: '' })
        + kid(250, 790, 1.55, T, { hair: 'girl', shirt: '#9b5de5', skirt: true, pants: '#3a86ff', face: 'sad', L: 30 })
        + `<path d="M190 330 l-30 -16 M188 360 l-34 0" stroke="${OL}" stroke-width="6" stroke-linecap="round"/>`,
    },
    /* ---------- 2 守株待兔（負面結果） ---------- */
    {
      word: '守株待兔',
      meaning: '妄想不勞而獲，或死守舊經驗，【不知變通】。',
      sentence: '成功必須靠自己努力爭取，如果整天只想靠運氣（），是不會有收穫的。',
      prompt: '田野裡一個農夫坐在樹樁旁邊撐著下巴發呆，身後的田地長滿雜草，他想像著兔子撞上樹樁',
      art: (T) => grassField(T, '#9fd8ff', '#eaf8ff', 520)
        + [200, 290, 380, 1000, 1090].map((x, i) => `<path d="M${x} 600 q-10 -50 -24 -70 M${x} 600 q4 -60 14 -80 M${x} 600 q16 -40 34 -52" stroke="#4f9a3a" stroke-width="8" fill="none" stroke-linecap="round"/>`).join('')
        + `<path d="M520 600 L530 470 Q590 450 650 470 L660 600Z" fill="#a8693c" stroke="${OL}" stroke-width="7" stroke-linejoin="round"/><ellipse cx="590" cy="470" rx="62" ry="20" fill="#e3b07a" stroke="${OL}" stroke-width="7"/><path d="M560 470 a30 10 0 0 0 60 0" fill="none" stroke="#a8693c" stroke-width="4"/>`
        + kid(800, 790, 1.7, T, { hair: 'boy', shirt: '#2a9d8f', face: 'think', look: [-6, -4], L: 150, R: 10, hat: `<g transform="translate(0 -56)"><ellipse rx="96" ry="22" fill="#f1d27a" stroke="${OL}" stroke-width="5"/><path d="M-46 0 Q0 -60 46 0Z" fill="#f1d27a" stroke="${OL}" stroke-width="5"/></g>` })
        + thought(470, 200, 300, 200, `<g transform="translate(-20 70)"><path d="M10 0 L16 -60 Q46 -70 76 -60 L82 0Z" fill="#a8693c" stroke="${OL}" stroke-width="5"/>` + rabbit(-70, 10, .9, T) + `<path d="M-14 -70 l20 -10 m-20 24 l24 0" stroke="${OL}" stroke-width="5" stroke-linecap="round"/></g>`, 1, 200, 160),
    },
    /* ---------- 3 亡羊補牢（提醒：出錯後補救） ---------- */
    {
      word: '亡羊補牢',
      meaning: '發生錯誤或損失後，趕緊【想辦法補救】。',
      sentence: '這次數學小考沒考好沒關係，只要趕緊（），把錯題弄懂，下次一定會進步。',
      prompt: '一個小男孩拿著鐵鎚，把羊圈木頭柵欄的破洞釘上新木板，柵欄裡有幾隻小羊',
      art: (T) => {
        const sheep = (x, y, s) => g(tr(x, y, s), [[-30, -60], [0, -74], [30, -60], [-36, -34], [0, -40], [36, -34]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="30" fill="#fff" stroke="${OL}" stroke-width="5"/>`).join('') + `<rect x="-30" y="-16" width="14" height="22" rx="5" fill="${OL}"/><rect x="16" y="-16" width="14" height="22" rx="5" fill="${OL}"/><ellipse cx="-62" cy="-64" rx="26" ry="30" fill="#555" stroke="${OL}" stroke-width="5"/><circle cx="-70" cy="-70" r="5" fill="#fff"/><ellipse cx="-80" cy="-84" rx="16" ry="7" fill="#555" stroke="${OL}" stroke-width="4"/>`);
        let fence = '';
        for (let i = 0; i < 9; i++) { const x = 200 + i * 110; if (i === 4) continue; fence += `<rect x="${x}" y="500" width="56" height="110" rx="6" fill="#d9a066" stroke="${OL}" stroke-width="6"/><path d="M${x} 420 l24 -24 l24 24" fill="#d9a066" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>`; }
        fence = `<rect x="180" y="520" width="960" height="26" fill="#c98b4f" stroke="${OL}" stroke-width="6"/><rect x="180" y="572" width="960" height="26" fill="#c98b4f" stroke="${OL}" stroke-width="6"/>` + fence;
        return grassField(T, '#bfe6ff', '#f0faff', 600) + sheep(380, 510, 1.15) + sheep(560, 500, .95) + fence
          + g(tr(668, 490, 1, 6), `<rect width="56" height="120" rx="6" fill="#f6c98a" stroke="${OL}" stroke-width="6"/><circle cx="28" cy="40" r="6" fill="${OL}"/><circle cx="28" cy="92" r="6" fill="${OL}"/>`)
          + kid(870, 800, 1.6, T, { hair: 'boy', shirt: '#3a86ff', face: 'think', look: [-6, 0], R: 120, L: 10, flip: true })
          + g(tr(716, 531, 1, -35), `<rect x="-7" y="-110" width="14" height="120" rx="5" fill="#8d5a34" stroke="${OL}" stroke-width="4"/><rect x="-30" y="-134" width="60" height="28" rx="5" fill="#9aa3ad" stroke="${OL}" stroke-width="5"/>`)
          + sfx(560, 340, '叩叩', 1, 50, '#FFE14D', -10);
      },
    },
    /* ---------- 4 井底之蛙（負面結果） ---------- */
    {
      word: '井底之蛙',
      meaning: '比喻【見識狹窄】、眼界很小的人。',
      sentence: '我們要多看書、多觀察世界，才不會變成眼界狹小的（）。',
      prompt: '一隻小青蛙坐在深深的古井底部，抬頭看著井口一小塊圓圓的天空，井外是遼闊的藍天白雲',
      art: (T) => {
        let bricks = '';
        for (let r = 0; r < 9; r++) for (const side of [0, 1]) { const x0 = side ? 790 : 330, off = r % 2 ? 40 : 0; for (let c = -1; c < 3; c++) { const x = x0 + c * 80 + off; if (x < x0 - 10 || x > x0 + 120) continue; bricks += `<rect x="${x}" y="${120 + r * 60}" width="80" height="60" fill="#9aa3ad" stroke="${OL}" stroke-width="4"/>`; } }
        return bg('#8fd3ff', '#e3f6ff') + cloud(250, 80, .7) + cloud(1050, 70, .6)
          + `<rect x="330" y="120" width="620" height="600" fill="#2f3e46"/>` + bricks
          + `<rect x="300" y="90" width="230" height="40" rx="8" fill="#7d868f" stroke="${OL}" stroke-width="6"/><rect x="750" y="90" width="230" height="40" rx="8" fill="#7d868f" stroke="${OL}" stroke-width="6"/>`
          + `<rect x="530" y="120" width="220" height="600" fill="#3d5160"/><ellipse cx="640" cy="160" rx="100" ry="26" fill="#9fd8ff" stroke="#fff" stroke-width="4"/>`
          + `<ellipse cx="640" cy="690" rx="130" ry="30" fill="#4a7c59"/>`
          + g(tr(640, 680, 1.25), `<ellipse cx="0" cy="-40" rx="64" ry="44" fill="#6fd16a" stroke="${OL}" stroke-width="6"/><circle cx="-30" cy="-86" r="24" fill="#6fd16a" stroke="${OL}" stroke-width="6"/><circle cx="30" cy="-86" r="24" fill="#6fd16a" stroke="${OL}" stroke-width="6"/><circle cx="-30" cy="-90" r="12" fill="#fff" stroke="${OL}" stroke-width="3"/><circle cx="30" cy="-90" r="12" fill="#fff" stroke="${OL}" stroke-width="3"/><circle cx="-30" cy="-95" r="6" fill="${OL}"/><circle cx="30" cy="-95" r="6" fill="${OL}"/><path d="M-26 -36 Q0 -16 26 -36" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-60 -10 q-20 10 -30 10 M60 -10 q20 10 30 10" stroke="${OL}" stroke-width="10" stroke-linecap="round"/>`)
          + `<path d="M600 520 l-16 -40 M640 510 v-44 M680 520 l16 -40" stroke="#FFE14D" stroke-width="7" stroke-linecap="round"/>`;
      },
    },
    /* ---------- 5 對牛彈琴 ---------- */
    {
      word: '對牛彈琴',
      meaning: '對不懂道理的人講深奧的道理，【白費力氣】。',
      sentence: '跟完全沒學過樂理的小寶寶解釋交響曲的結構，簡直就是（）。',
      prompt: '草地上一個小男孩很認真地彈古箏給一頭乳牛聽，乳牛卻只顧著低頭吃草，完全沒在聽',
      art: (T) => {
        const cow = g(tr(860, 600, 1.15), `<rect x="-120" y="-90" width="26" height="90" rx="10" fill="#fff" stroke="${OL}" stroke-width="5"/><rect x="60" y="-90" width="26" height="90" rx="10" fill="#fff" stroke="${OL}" stroke-width="5"/><ellipse cx="-20" cy="-150" rx="150" ry="85" fill="#fff" stroke="${OL}" stroke-width="6"/><ellipse cx="-60" cy="-170" rx="44" ry="30" fill="#3b2a20"/><ellipse cx="40" cy="-130" rx="36" ry="26" fill="#3b2a20"/><path d="M128 -170 q40 20 30 80" stroke="${OL}" stroke-width="6" fill="none"/>`
          + g('translate(-170 -40) rotate(20)', `<ellipse cx="0" cy="-40" rx="58" ry="66" fill="#fff" stroke="${OL}" stroke-width="6"/><path d="M-50 -90 l-34 -20 l20 32 M50 -90 l34 -20 l-20 32" fill="#fff" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><ellipse cx="0" cy="6" rx="44" ry="28" fill="#ffc2cf" stroke="${OL}" stroke-width="5"/><circle cx="-14" cy="6" r="6" fill="${OL}"/><circle cx="14" cy="6" r="6" fill="${OL}"/><path d="M-30 -56 q8 -8 16 0 M14 -56 q8 -8 16 0" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`)
          + `<path d="M-230 40 q8 -30 16 -36 M-212 44 q2 -26 10 -40" stroke="#4f9a3a" stroke-width="7" fill="none" stroke-linecap="round"/>`);
        return grassField(T, '#bfe6ff', '#f0faff', 560) + tree(1130, 600, .9)
          + kid(380, 770, 1.6, T, { hair: 'boy', shirt: '#3a86ff', face: 'happy', L: 60, R: 60 })
          + `<rect x="200" y="560" width="360" height="40" rx="12" fill="#c98b4f" stroke="${OL}" stroke-width="6"/>` + [0, 1, 2, 3, 4, 5].map(i => `<line x1="${230 + i * 54}" y1="566" x2="${236 + i * 54}" y2="594" stroke="#fff4dc" stroke-width="4"/>`).join('')
          + notes(560, 300, 1.2, 4, '#9b5de5') + cow;
      },
    },
    /* ---------- 6 自相矛盾 ---------- */
    {
      word: '自相矛盾',
      meaning: '說話或做事前後【互相抵觸】、不一致。',
      sentence: '小明早上說自己最討厭吃青菜，中午卻把整盤青菜吃光光，真是（）。',
      prompt: '古代市集上，一個商人一手高舉長矛、一手拿著盾牌大聲叫賣，旁邊圍觀的人歪著頭、一臉疑惑',
      art: (T) => room('#fff1d6', '#e9c48f', 600)
        + `<path d="M160 120 L1120 120 L1080 200 L200 200Z" fill="#e8505b" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>` + [0, 1, 2, 3, 4, 5].map(i => `<path d="M${200 + i * 150} 200 q75 40 150 0" fill="#fff" stroke="${OL}" stroke-width="5"/>`).join('')
        + adult(560, 680, 1.25, T, { hair: 'bun', shirt: '#2a9d8f', face: 'proud', L: 30, R: 165 })
        + g(tr(700, 470, 1, 8), `<rect x="-8" y="-300" width="16" height="320" rx="6" fill="#8d5a34" stroke="${OL}" stroke-width="4"/><path d="M0 -360 L22 -300 H-22Z" fill="#c9d3dc" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>`)
        + g(tr(430, 470, 1), `<path d="M0 -110 Q90 -100 90 -20 Q80 70 0 110 Q-80 70 -90 -20 Q-90 -100 0 -110Z" fill="#ffb703" stroke="${OL}" stroke-width="7"/><circle r="30" fill="#e8505b" stroke="${OL}" stroke-width="5"/>`)
        + kid(960, 790, 1.5, T, { hair: 'girl', shirt: '#9b5de5', skirt: true, pants: '#3a86ff', face: 'think', tilt: 14, L: 150, flip: true })
        + `<text x="1010" y="250" font-size="90" font-weight="900" fill="#3a86ff" stroke="${OL}" stroke-width="5" paint-order="stroke">?</text>`,
    },
  ],
  /* 第四關方法一：半開放句型（3 個成語；只給連接詞或頭尾，＿ 代表學生要寫的地方） */
  frames: [
    { word: '畫蛇添足', text: '因為＿＿＿＿＿＿＿＿，簡直是「畫蛇添足」！' },
    { word: '井底之蛙', text: '如果只會＿＿＿＿＿＿＿＿，就像「井底之蛙」一樣。' },
    { word: '亡羊補牢', text: '＿＿＿＿＿＿＿＿之後，趕緊「亡羊補牢」，還來得及。' },
  ],
  /* 教師版補充說明 */
  notes: [
    '「亡羊補牢」的「亡」是丟失，「牢」是關羊的圈；重點在「出錯後趕快補救，還來得及」，是正面的提醒。',
    '「守株待兔」「井底之蛙」「對牛彈琴」帶有批評的意思，通常不是稱讚。',
    '「自相矛盾」的「矛」是長槍、「盾」是盾牌，可以搭配故事說明「最利的矛刺最堅固的盾」為什麼說不通。',
  ],
};
