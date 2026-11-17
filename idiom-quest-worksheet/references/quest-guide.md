# quest.js 撰寫指南

quest.js 只宣告一個 `const QUEST = {...}`，build.py 會用 node 讀它（同時載入 `assets/lib.js` 的繪圖函式）。

```js
const QUEST = {
  title: '成語圖文探險單',   // 標題，也是輸出檔名
  grade: '三年級',           // 選填，顯示在標題旁
  subtitle: '第十二課',      // 選填
  seed: 7,                   // 打亂順序的種子
  idioms: [                  // 剛好 6 個；1～3 在第一關，4～6 在第二關
    {
      word: '畫蛇添足',
      meaning: '做了【多餘的事】，反而把事情弄糟。',
      sentence: '這幅畫原本已經很美了，他卻又隨便塗上幾筆，結果變得好難看，真是（）。',
      prompt: '一個小男孩在畫紙上畫一條蛇，正得意地幫蛇加上四隻腳',
      art: (T) => room(...) + kid(...),   // 或 img: 'images/1.png'
    },
    // …共 6 個
  ],
  frames: [   // 第四關方法一，3 句
    { word: '畫蛇添足', text: '因為＿＿＿＿＿＿＿＿，簡直是「畫蛇添足」！' },
  ],
  notes: ['……'],   // 教師版使用建議
};
```

## 寫作重點

- `meaning` 一行半內（約 28 字），太長會讓連連看列變高、第一頁擠不下。
- `sentence` 約 30～45 字，一行半內；答案位置寫 `（）`。六句的情境要不同，且不能只靠關鍵字猜答案。
- `frames` 只給連接詞或頭尾（因為／如果／雖然……但是／……之後），每段空白 6～10 個 `＿`。

## 插圖（art）

- 畫布 1280×720，所有繪圖函式以 (x, y) 為腳底中心。探險單只顯示 x 160～1120 的 4:3 區域，卡片約 35×26 mm，所以：主角要大（小孩 `s` 約 1.5～1.8）、背景簡單、不要寫字。
- 常用函式（詳見 assets/lib.js 開頭註解）：
  - 背景：`room(牆色, 地板色, 地板y)`、`grassField(T, 天空1, 天空2, 地面y)`、`bg(c1, c2)`、`cloud`、`sun`、`tree`、`windowBox`、`table`
  - 人物：`kid(x, y, s, T, {hair:'boy'|'girl'|'bun', shirt, skirt, face:'smile'|'happy'|'wow'|'think'|'sad'|'angry'|'proud'|'scared', L, R（手臂角度 0 下垂～170 舉高）, flip, tilt, hat})`、`adult(...)`
  - 動物：`rabbit`、`duck`、`tiger`、`crab`、`dove`
  - 效果：`thought(x, y, w, h, 內容, 1)` 想法泡泡、`sparkles`、`notes`（音符）、`star`、`heart`
  - 工具：`g(transform, 內容)`、`tr(x, y, 縮放, 旋轉)`、`OL`（描邊色）
- `T` 傳入固定值，畫面是靜態的；`A` 類參數（例如 `thought` 的第 6 個參數）填 1 表示完全出現。
- `flip: true` 的小孩面向左；這時右手（R）會出現在畫面左側，手拿道具要用 R。
