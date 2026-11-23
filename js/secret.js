(function () {
  // 隱藏版限時特賣。跟 #combo 的差別有兩個：
  //   ① 多一把鎖 —— 網址要帶專屬 key（data-key）才看得到，不給連結就找不到。
  //   ② 一次給好幾個組合（固定組合 ＋ 一個任選），不是單一個任選池。
  //
  // 設定全部讀 HTML 上的 data-*，換檔期／換價格／換品項都只要改 index.html。
  var sec = document.getElementById("secret");
  if (!sec) return;

  var C = window.BossJiaCampaign;

  // 版面預覽用（老闆家自己看）。會標明客人看不到，免得以為已經開賣了。
  var PREVIEW = /[?&]preview=secret(&|$)/.test(location.search);

  var KEY = sec.dataset.key || "";
  // ?vip 這種沒有等號的參數，URLSearchParams.has() 一樣讀得到
  var hasKey = !!KEY && new URLSearchParams(location.search).has(KEY);

  var g = C.read(sec);

  // ── 四個條件同時成立才看得到，缺一個就整塊移除 ──
  //   ① data-live="on"    人工開關，預設 off。沒人點頭，日期到了也不會上架
  //   ② 起訖日兩個都填齊
  //   ③ 今天在起訖日之間（含當天）。過期自動下架
  //   ④ 網址帶了 data-key 指定的參數 ← 這把鎖是「隱藏版」的意思
  //
  // ⚠️ 第④點是「不給連結就看不到」，**不是加密**。這段文字仍然在 index.html 的
  //    原始碼裡，有心人看原始碼找得到。要真的藏，得改成後端渲染 —— 這個站是純靜態的，
  //    做不到。所以隱藏版不要放不能被看到的東西，它的作用是「特別感」不是保密。
  //
  // 區塊在 HTML 裡預設帶 hidden，所以連 JS 沒跑到也是不顯示。
  // 失敗方向永遠是「看不到」。
  if (!(g.live && g.inRange && hasKey) && !PREVIEW) {
    sec.remove();
    return;
  }
  sec.hidden = false;

  var datesEl = document.getElementById("secret-dates");
  if (datesEl) {
    var draft = !g.live || !g.inRange || !hasKey;
    // 預覽時要講清楚卡在哪一關，才知道還差什麼沒做
    var why = !g.live ? "草稿（data-live 還不是 on）"
            : !g.inRange ? "不在檔期內"
            : "網址沒帶 ?" + KEY;
    datesEl.textContent = draft
      ? "👁 預覽模式．客人看不到　‧　" + why + "：" + g.range
      : "活動期間 " + g.range + "　‧　菜單上沒有，只有這一檔買得到";
    datesEl.classList.toggle("is-preview", draft);
  }

  /** 加入購物車之後按鈕閃一下，讓人知道有反應（任選那組由 picker 自己處理） */
  function flash(btn) {
    var label = btn.dataset.label || btn.textContent;
    btn.dataset.label = label;
    btn.textContent = "✓ 已加入購物車";
    setTimeout(function () { btn.textContent = label; }, 2500);
  }

  // ── 固定組合（A／B）：按了就整組進購物車 ──
  [].slice.call(sec.querySelectorAll(".secret-card[data-count]")).forEach(function (card) {
    var price = Number(card.dataset.price);
    var count = Number(card.dataset.count);

    // 單包價用算的，不寫死在 HTML —— 改了組合價忘了改單包價，
    // 就會在客人眼前出現兩個對不起來的數字。
    var unitEl = card.querySelector(".secret-card-unit");
    if (unitEl && count > 0) unitEl.textContent = "一包 $" + Math.round(price / count);

    card.querySelector(".secret-add").addEventListener("click", function () {
      if (!window.BossJiaCart) return;
      window.BossJiaCart.add(card.dataset.name, card.dataset.variant, price);
      flash(this);
    });
  });

  // ── 任選組合（C）：選滿 N 包才能加入 ──
  var pick = sec.querySelector(".secret-pick");
  if (pick) {
    var pickPrice = Number(pick.dataset.price);
    var pickSize = Number(pick.dataset.size);
    var pickName = pick.dataset.name;

    var pickUnit = pick.querySelector(".secret-card-unit");
    if (pickUnit && pickSize > 0) pickUnit.textContent = "一包 $" + Math.round(pickPrice / pickSize);

    C.picker(pick, {
      size: pickSize,
      countEl: document.getElementById("secret-count"),
      addBtn: document.getElementById("secret-add"),
      readyText: "整組 NT$" + pickPrice,
      onAdd: function (variant) {
        if (window.BossJiaCart) window.BossJiaCart.add(pickName, variant, pickPrice);
      },
    });
  }
})();
