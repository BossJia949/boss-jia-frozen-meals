(function () {
  // 限時組合（任選 N 包）。設定全部讀 HTML 上的 data-*，
  // 所以換檔期、換品項、換價格都只要改 index.html 那一塊，不用動這支程式。
  var sec = document.getElementById("combo");
  if (!sec) return;

  var C = window.BossJiaCampaign;
  var SIZE = Number(sec.dataset.size) || 5;
  var PRICE = Number(sec.dataset.price) || 0;
  var COMPARE = Number(sec.dataset.compare) || 0;
  var TITLE = ((sec.querySelector(".combo-title") || {}).textContent || "限時組合").trim();

  // 上架前先看長什麼樣用的。會標明是預覽，免得自己看到忘了它其實還沒開賣。
  var PREVIEW = /[?&]preview=combo(&|$)/.test(location.search);

  var g = C.read(sec);

  // ── 要三個條件同時成立，客人才看得到。缺任何一個都整塊移除。 ──
  // （日期判斷在 js/campaign.js 的 read()，兩個檔期區塊共用同一份規則）
  //
  // ① data-live 必須正好是 "on"。**這是人工開關**：沒有老闆家點頭，
  //    就算日期到了也不會上架。活動還在討論、價格還沒定的草稿，
  //    絕對不會因為日曆翻頁就自己跑出來給客人看。
  // ② 起訖日兩個都要填。只填一個 = 設定沒寫完 = 不顯示。
  // ③ 今天要在起訖日之間（含當天）。過期自動下架，不用記得回來移除。
  //
  // 區塊在 HTML 裡預設帶 hidden，所以連這支程式沒跑到（瀏覽器擋掉 JS）也是不顯示。
  // 失敗方向永遠是「看不到」—— 不會讓客人看到沒拍板的價格然後下單。
  if (!(g.live && g.inRange) && !PREVIEW) {
    sec.remove();
    return;
  }
  sec.hidden = false;

  var datesEl = document.getElementById("combo-dates");
  if (datesEl) {
    var draft = !g.live || !g.inRange;
    // 預覽時要講清楚「為什麼客人看不到」，才知道還差哪一步沒做
    datesEl.textContent = !draft
      ? "活動期間 " + g.range + "　‧　整組 NT$" + PRICE +
        (COMPARE > PRICE ? "（單買 " + SIZE + " 包要 $" + COMPARE + "，省 $" + (COMPARE - PRICE) + "）" : "")
      : "👁 預覽模式．客人看不到　‧　" +
        (!g.live ? "草稿（data-live 還不是 on）" : "尚未到檔期") + "：" + g.range;
    datesEl.classList.toggle("is-preview", draft);
  }

  // 常見問題有一條寫「五入組合需要同口味才有組合優惠」，跟任選這一檔直接衝突。
  // 客人看到活動能混搭、又看到 FAQ 說不能混，會以為網站講話不算話。
  //
  // 補在這裡而不是去改 index.html 的 FAQ 本文 —— 程式只有活動上線（或老闆家
  // 自己開預覽）才會跑到這行，所以這句話會跟著檔期一起消失，不會變成檔期過後
  // 還掛在網站上的過期訊息。
  //
  // 順帶一個好處：js/faq.js 是在載入時讀 .faq-a 的 innerHTML 建搜尋索引，
  // 而它排在這支程式後面，所以客人搜「混搭」看到的答案也會一起更新，不用另外處理。
  var faqA = document.querySelector("#faq-combo .faq-a");
  if (faqA) {
    var note = document.createElement("p");
    note.className = "faq-combo-live";
    var tag = document.createElement("b");
    tag.textContent = "限時活動期間例外：";
    note.appendChild(tag);
    note.appendChild(document.createTextNode(
      "「" + TITLE + "」可以混搭，六種雞湯自由組合" +
      (g.hasDates ? "（" + g.range + "）" : "") + "。"
    ));
    faqA.insertBefore(note, faqA.firstChild);
  }

  C.picker(sec, {
    size: SIZE,
    countEl: document.getElementById("combo-count"),
    addBtn: document.getElementById("combo-add"),
    readyText: "整組 NT$" + PRICE,
    onAdd: function (variant) {
      // 整組算一筆、價格是整組價，所以免運門檻也會自動把它算進去
      if (window.BossJiaCart) window.BossJiaCart.add(TITLE, variant, PRICE);
    },
  });
})();
