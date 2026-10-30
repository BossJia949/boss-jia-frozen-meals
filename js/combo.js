(function () {
  // 限時組合（任選 N 包）。設定全部讀 HTML 上的 data-*，
  // 所以換檔期、換品項、換價格都只要改 index.html 那一塊，不用動這支程式。
  var sec = document.getElementById("combo");
  if (!sec) return;

  var SIZE = Number(sec.dataset.size) || 5;
  var PRICE = Number(sec.dataset.price) || 0;
  var COMPARE = Number(sec.dataset.compare) || 0;
  var TITLE = (sec.querySelector(".combo-title") || {}).textContent || "限時組合";
  TITLE = TITLE.trim();

  // 上架前先看長什麼樣用的。會標明是預覽，免得自己看到忘了它其實還沒開賣。
  var PREVIEW = /[?&]preview=combo(&|$)/.test(location.search);

  /** 今天（當地時間）的 YYYY-MM-DD。用字串比大小就夠，這種格式字典順序等於時間順序 */
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  /** 2026-11-10 → 11/10 */
  function slash(iso) {
    var p = (iso || "").split("-");
    return p.length === 3 ? Number(p[1]) + "/" + Number(p[2]) : "";
  }

  var start = sec.dataset.start;
  var end = sec.dataset.end;
  var now = today();
  var inRange = (!start || now >= start) && (!end || now <= end);

  // 檔期外就整塊移除 —— 老闆家要的是「期限過後把區塊拿掉」。
  // 區塊在 HTML 裡預設帶 hidden，所以沒跑到這裡（例如瀏覽器擋掉 JS）也是不顯示，
  // 失敗方向永遠是「看不到」，不會讓客人看到過期的價格然後下單。
  if (!inRange && !PREVIEW) {
    sec.remove();
    return;
  }
  sec.hidden = false;

  var datesEl = document.getElementById("combo-dates");
  if (datesEl) {
    var range = slash(start) + " – " + slash(end);
    datesEl.textContent = PREVIEW && !inRange
      ? "👁 預覽模式：這檔是 " + range + "，客人現在看不到"
      : "活動期間 " + range + "　‧　整組 NT$" + PRICE +
        (COMPARE > PRICE ? "（單買 " + SIZE + " 包要 $" + COMPARE + "，省 $" + (COMPARE - PRICE) + "）" : "");
    if (PREVIEW && !inRange) datesEl.classList.add("is-preview");
  }

  var countEl = document.getElementById("combo-count");
  var addBtn = document.getElementById("combo-add");
  var opts = [].slice.call(sec.querySelectorAll(".combo-opt"));
  var picks = {};   // 品名 → 包數

  function total() {
    return Object.keys(picks).reduce(function (s, k) { return s + picks[k]; }, 0);
  }

  function render() {
    var n = total();
    var left = SIZE - n;

    opts.forEach(function (li) {
      var name = li.dataset.name;
      var q = picks[name] || 0;
      li.querySelector("[data-qty]").textContent = q;
      li.classList.toggle("is-picked", q > 0);
      // 選滿了就不讓再加，否則客人加到第 6 包才發現不行
      li.querySelector('[data-step="1"]').disabled = left <= 0;
      li.querySelector('[data-step="-1"]').disabled = q <= 0;
    });

    countEl.textContent = left > 0
      ? "已選 " + n + " 包，還要再選 " + left + " 包"
      : "已選滿 " + SIZE + " 包，整組 NT$" + PRICE;
    countEl.classList.toggle("is-ready", left <= 0);
    addBtn.disabled = left > 0;
  }

  sec.addEventListener("click", function (e) {
    var btn = e.target.closest(".combo-step");
    if (!btn || btn.disabled) return;
    var li = btn.closest(".combo-opt");
    var name = li.dataset.name;
    var next = (picks[name] || 0) + Number(btn.dataset.step);
    if (next < 0) next = 0;
    if (Number(btn.dataset.step) > 0 && total() >= SIZE) return;
    picks[name] = next;
    if (!next) delete picks[name];
    render();
  });

  addBtn.addEventListener("click", function () {
    if (total() !== SIZE) return;
    // 規格寫成「香菇×2・剝皮辣椒×3」，老闆家在 LINE 收到訂單就知道要做哪幾包。
    // 整組算一筆、價格是整組價，所以免運門檻也會自動把它算進去。
    var variant = opts
      .filter(function (li) { return picks[li.dataset.name]; })
      .map(function (li) { return li.dataset.name + "×" + picks[li.dataset.name]; })
      .join("・");

    if (!window.BossJiaCart) return;
    window.BossJiaCart.add(TITLE, variant, PRICE);

    picks = {};
    render();
    addBtn.textContent = "✓ 已加入購物車";
    setTimeout(function () { addBtn.textContent = "加入購物車"; }, 2500);
  });

  render();
})();
