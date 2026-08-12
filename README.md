# 老闆家 Boss Jia｜手作料理冷凍包

用營養師的標準做料理．用給家人的標準選食材

線上菜單與訂購網站。客人在網頁上選好品項與規格，一鍵把訂單內容帶進 LINE 傳給店家。

## 這個網站有什麼

- **商品菜單**：6 大分類、35 項商品，每項可選不同規格（小／大／3包／5包／6包），價格自動帶入
- **購物車**：即時計算金額，並顯示「再差多少錢達到免運門檻」
- **一鍵下單**：把購物車內容整理成訂單文字，開啟 LINE 直接傳給店家
- **無需金流**：不在網站上收款，訂單成立與收款都在 LINE 上由店家親自處理

## 訂購方式

加 LINE 訂購：[@727qzmzu](https://lin.ee/PQPzlSx)

- 滿 $1300 享超商冷凍取貨免運
- 滿 $3300 享黑貓冷凍宅配免運

## 技術

純靜態網站，沒有任何後端或建置流程 —— HTML + CSS + 原生 JavaScript，開檔即可修改。

```
index.html          頁面內容與商品資料
css/style.css       樣式與配色
js/cart.js          購物車與 LINE 訂單邏輯
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

### 配色

取自菜單實際用色，定義在 `css/style.css` 最上方的 `:root`：

| 用途 | 色碼 |
|---|---|
| 主色 墨綠 | `#43766C` |
| 深墨綠 | `#35594F` |
| 金黃 | `#F8B858` |
| 亮黃 | `#F8D858` |
| 米白 | `#F8F8E8` |
