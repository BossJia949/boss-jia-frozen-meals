# 老闆家 Boss Jia｜手作料理冷凍包

用營養師的標準做料理．用給家人的標準選食材

線上菜單與訂購網站。客人在網頁上選好品項與規格，一鍵把訂單內容帶進 LINE 傳給店家。

## 這個網站有什麼

- **商品菜單**：6 大分類、35 項商品，每項可選不同規格（小／大／3包／5包／6包），價格自動帶入
- **購物車**：即時計算金額，並顯示「再差多少錢達到免運門檻」
- **一鍵下單**：把購物車內容整理成訂單文字，開啟 LINE 直接傳給店家
- **無需金流**：不在網站上收款，訂單成立與收款都在 LINE 上由店家親自處理
- **分類大圖導覽**：6 張照片當入口，點了跳到對應分類
- **自助問答**：客人打字問常見問題，聽不懂的直接把原句帶進 LINE 轉給店家

## 訂購方式

加 LINE 訂購：[@727qzmzu](https://lin.ee/PQPzlSx)

- 滿 $1300 享超商冷凍取貨免運
- 滿 $3300 享黑貓冷凍宅配免運

## 技術

純靜態網站，沒有任何後端或建置流程 —— HTML + CSS + 原生 JavaScript，開檔即可修改。

```
index.html          頁面內容、商品資料、問答內容
css/style.css       樣式與配色
js/cart.js          購物車與 LINE 訂單邏輯
js/faq.js           自助問答的比對邏輯（內容不在這裡）
js/ui.js            回頂端按鈕
images/             形象照、料理照、LINE QR
冷凍包菜單.pdf       完整菜單（可下載轉傳）
```

### 本機預覽

```bash
npx serve .
```

### 改商品或價格

直接編輯 `index.html`。每一項商品長這樣，改文字與數字即可：

```html
<div class="menu-item">
  <span class="item-name">三杯雞腿丁</span>
  <select class="item-variant" aria-label="三杯雞腿丁 規格">
    <option value="小|150">小 $150</option>
    <option value="5包|700">5包 $700</option>
  </select>
  <button class="btn btn-add" data-name="三杯雞腿丁">加入</button>
</div>
```

`<option>` 的 `value` 格式是 `規格名稱|價格數字`，購物車靠這個計算金額，中間的 `|` 不能省略。

### 改問答內容

**問答內容只寫在 `index.html` 的 `<details class="faq-item">` 裡**，沒有另外的資料檔。
`js/faq.js` 是從畫面上讀取的，所以同一份內容同時給客人看、給程式比對、給搜尋引擎爬。

```html
<details class="faq-item" id="faq-spicy"
  data-keywords="會辣,辣不辣,辣度,能吃辣,不辣,小孩吃,怕辣">
  <summary>會辣嗎？小朋友可以吃嗎？</summary>
  <div class="faq-a">
    <p>答案寫這裡，可以用 &lt;ul&gt; &lt;ol&gt; &lt;b&gt;。</p>
  </div>
</details>
```

- `data-keywords`：**客人可能怎麼問**，用半形逗號隔開。寫越多種講法，聽懂的機率越高
- 比對是「脫水後做兩字一組的相似度」，所以「請問這個會不會很辣啊？」也能命中「會辣」
- 分數低於 0.55 就轉真人，並把客人打的原句帶進 LINE

⚠️ **改完要同步更新 `<head>` 裡的 `FAQPage` 結構化標記**，兩邊題目要一致。

> 註：Google 自 2023 年起只對政府與醫療網站顯示 FAQ 搜尋結果，這段標記對一般店家
> 不會變成搜尋結果上的問答框；留著是給搜尋引擎與 AI 檢索器讀懂頁面用的。

### 改照片

分類大圖與品牌故事的照片還沒到齊的位置，用的是佔位元件：

```html
<div class="photo-placeholder">
  <span class="ph-emoji" aria-hidden="true">🥘</span>
  <span class="ph-name">絕配美味</span>
  <span class="ph-size">照片待補 800×600</span>
</div>
```

拿到照片後，把整個 `<div class="photo-placeholder">…</div>` 換成：

```html
<img src="images/dish-xxx.jpg" alt="絕配美味分類代表料理" loading="lazy" width="800" height="600">
```

建議 800×600 橫式。補一張換一張，不必等全部到齊。

### 配色

取自菜單實際用色，定義在 `css/style.css` 最上方的 `:root`。深色版面，
**參考柴窯的版型但不照抄它的黑**——版型是通用的，配色是品牌的資產。

| 用途 | 色碼 |
|---|---|
| 頁面底（深墨綠） | `#233B34` |
| 卡片底 | `#2C4A42` |
| 頁首／頁尾（最深） | `#1A2C27` |
| 主文字（米白） | `#F8F8E8` |
| 次要文字 | `#B7C7C1` |
| 訂購區面板 | `#35594F` |
| 金黃（標題／CTA） | `#F8B858` |
| 亮黃（預約區底） | `#F8D858` |

深底上的紅要用 `#FF9AA2`，原本的莓紅 `#9A1B27` 在深底看不見。
`#5C8F84` 對比只有 3.4，**只能用在大字或邊框，不可用於內文**。

所有文字／底色組合都量過，達 WCAG AA（內文 4.5:1、大字 3:1）。
唯一例外是 LINE 按鈕的白字綠底（2.25:1）——那是 LINE 官方品牌色，
改掉客人會認不出那是 LINE 按鈕，取捨後保留原樣。
