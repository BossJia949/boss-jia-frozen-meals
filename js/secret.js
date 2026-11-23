(function () {
  // 「隱藏版」限時特賣。
  //
  // ⚠️ 這裡的「隱藏版」是**商品的說法**（這兩款平常不在菜單上，像餐廳的隱藏版菜單），
  //    **不是技術上的隱藏**。所有客人都看得到，顯示條件跟 #combo 完全一樣。
  //    2026-11-23 第一版曾經做成「網址要帶 ?vip 才看得到」—— 那是誤解老闆家的意思，
  //    當天就改掉了。**不要再把這塊做成憑連結存取。**
  //
  // 跟 #combo 的差別只剩一個：一次給好幾個組合（固定組合 ＋ 一個任選），
  // 不是單一個任選池。設定全部讀 HTML 的 data-*，換檔期／價格／品項只要改 index.html。
  var sec = document.getElementById("secret");
  if (!sec) return;

  var C = window.BossJiaCampaign;

  // 版面預覽用（老闆家自己看）。會標明客人看不到，免得以為已經開賣了。
  var PREVIEW = /[?&]preview=secret(&|$)/.test(location.search);

  var g = C.read(sec);

  // ── 三個條件同時成立才看得到，缺一個就整塊移除 ──
  //   ① data-live="on"  人工開關，預設 off。沒人點頭，日期到了也不會上架
  //   ② 起訖日兩個都填齊。只填一個 = 設定沒寫完 = 不顯示
  //   ③ 今天在起訖日之間（含當天）。過期自動下架，不用回來處理
  //
  // 區塊在 HTML 裡預設帶 hidden，所以連 JS 沒跑到也是不顯示。
  // 失敗方向永遠是「看不到」。
  if (!(g.live && g.inRange) && !PREVIEW) {
    sec.remove();
    return;
  }
  sec.hidden = false;

  var datesEl = document.getElementById("secret-dates");
  if (datesEl) {
    var draft = !g.live || !g.inRange;
    // 預覽時要講清楚卡在哪一關，才知道還差什麼沒做
    var why = !g.live ? "草稿（data-live 還不是 on）" : "不在檔期內";
    datesEl.textContent = draft
      ? "👁 預覽模式．客人看不到　‧　" + why + "：" + g.range
      // 「菜單上沒有」那句留給底下的 .secret-sub 講，這裡只報檔期，不要講兩次
      : "活動期間 " + g.range;
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
