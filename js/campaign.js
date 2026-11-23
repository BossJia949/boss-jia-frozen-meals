/* 限時檔期的共用零件。js/combo.js 與 js/secret.js 都靠這支，所以要排在它們前面。
 *
 * 為什麼要抽出來共用：
 *   read()   決定「客人到底看不看得到這一塊」。那是整個機制裡唯一會出事的地方 ——
 *            判斷錯就是把還沒拍板的價格秀給客人看，然後他真的下單。
 *            規則只能有一份，不能改了一邊忘記另一邊。
 *   picker() 純粹是因為兩個區塊的「任選 N 包」長得一模一樣，沒必要寫兩次。
 */
window.BossJiaCampaign = (function () {

  /** 今天（當地時間）的 YYYY-MM-DD。用字串比大小就夠，這種格式字典順序等於時間順序 */
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  /** 2026-11-28 → 11/28 */
  function slash(iso) {
    var p = (iso || "").split("-");
    return p.length === 3 ? Number(p[1]) + "/" + Number(p[2]) : "";
  }

  /**
   * 讀區塊上的 data-live / data-start / data-end，回傳檔期本身的判斷。
   *
   * 只回報事實，**不決定要不要顯示** —— 各區塊的條件不一樣（隱藏版還多一個
   * 「網址要帶專屬 key」），所以最後那個 if 留給各自的程式去組。
   */
  function read(sec) {
    var start = sec.dataset.start;
    var end = sec.dataset.end;
    var now = today();
    var hasDates = !!(start && end);
    return {
      live: sec.dataset.live === "on",   // 人工開關，預設 off
      hasDates: hasDates,                // 只填一個 = 設定沒寫完
      inRange: hasDates && now >= start && now <= end,
      start: start,
      end: end,
      range: hasDates ? slash(start) + " – " + slash(end) : "日期還沒填",
    };
  }

  /**
   * 接起一個「任選 N 包」的選單。
   * root 底下要有 .combo-opt（每個帶 data-name）與 −／＋ 按鈕。
   * cfg: { size, countEl, addBtn, readyText, onAdd(variant) }
   */
  function picker(root, cfg) {
    var opts = [].slice.call(root.querySelectorAll(".combo-opt"));
    var picks = {};   // 品名 → 包數

    function total() {
      return Object.keys(picks).reduce(function (s, k) { return s + picks[k]; }, 0);
    }

    function render() {
      var n = total();
      var left = cfg.size - n;

      opts.forEach(function (li) {
        var q = picks[li.dataset.name] || 0;
        li.querySelector("[data-qty]").textContent = q;
        li.classList.toggle("is-picked", q > 0);
        // 選滿了就不讓再加，否則客人加到超過才發現不行
        li.querySelector('[data-step="1"]').disabled = left <= 0;
        li.querySelector('[data-step="-1"]').disabled = q <= 0;
      });

      cfg.countEl.textContent = left > 0
        ? "已選 " + n + " 包，還要再選 " + left + " 包"
        : "已選滿 " + cfg.size + " 包，" + cfg.readyText;
      cfg.countEl.classList.toggle("is-ready", left <= 0);
      cfg.addBtn.disabled = left > 0;
    }

    root.addEventListener("click", function (e) {
      var btn = e.target.closest(".combo-step");
      if (!btn || btn.disabled) return;
      var li = btn.closest(".combo-opt");
      var name = li.dataset.name;
      var step = Number(btn.dataset.step);
      if (step > 0 && total() >= cfg.size) return;
      var next = (picks[name] || 0) + step;
      if (next < 0) next = 0;
      picks[name] = next;
      if (!next) delete picks[name];
      render();
    });

    cfg.addBtn.addEventListener("click", function () {
      if (total() !== cfg.size) return;
      // 規格寫成「義式番茄肉醬×6・日式肉味噌×4」，老闆家收到訂單就知道要做哪幾包
      var variant = opts
        .filter(function (li) { return picks[li.dataset.name]; })
        .map(function (li) { return li.dataset.name + "×" + picks[li.dataset.name]; })
        .join("・");

      cfg.onAdd(variant);

      picks = {};
      render();
      var label = cfg.addBtn.textContent;
      cfg.addBtn.textContent = "✓ 已加入購物車";
      setTimeout(function () { cfg.addBtn.textContent = label; }, 2500);
    });

    render();
  }

  return { today: today, slash: slash, read: read, picker: picker };
})();
