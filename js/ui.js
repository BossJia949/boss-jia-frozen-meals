(function () {
  // 回頂端按鈕：滑過首圖才出現，免得一進站就有東西擋畫面。
  //
  // 用 IntersectionObserver 觀察首圖，不用 scroll 事件 —— scroll + requestAnimationFrame
  // 在分頁沒被顯示時會被瀏覽器凍結，IntersectionObserver 是看版面不是看繪製，比較可靠。
  //
  // CSS 預設按鈕可見；這裡才把 html 標成 js-scroll-aware 切換成「滑過才出現」。
  // 所以沒有 JavaScript 或瀏覽器太舊時，按鈕是常駐可用的，不會消失。
  // 回頂端連結（圓鈕 + 頁首品牌字）保險：
  // 純靠 href="#top" 曾經失效過 —— id="top" 當時掛在 position:sticky 的頁首上，
  // sticky 元素永遠在視窗頂端，瀏覽器判定「錨點已經看得到」就完全不捲動。
  // id 已經拿掉（#top 改走 HTML 規格的「捲到文件最上方」），這裡再用 JS 保證一次。
  var toTopLinks = document.querySelectorAll('a[href="#top"]');
  for (var i = 0; i < toTopLinks.length; i++) {
    toTopLinks[i].addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  featureCarousel();

  var fab = document.getElementById("fab-top");
  var hero = document.querySelector(".hero");
  if (!fab || !hero || typeof IntersectionObserver !== "function") return;

  new IntersectionObserver(
    function (entries) {
      // js-scroll-aware 刻意放在回呼裡才加：萬一觀察器沒動（舊瀏覽器、被凍結的分頁），
      // 這行永遠不會執行，按鈕就維持常駐可見 —— 壞掉的結果是「一直在」，不是「永遠消失」。
      document.documentElement.classList.add("js-scroll-aware");
      // 首圖還看得到 = 還在頁面上方 → 不需要回頂端按鈕
      fab.classList.toggle("is-visible", !entries[0].isIntersecting);
    },
    { threshold: 0 }
  ).observe(hero);

  /**
   * 商品特色手機輪播的圓點與自動播放。
   *
   * 滑動本身是 CSS scroll-snap 做的，這裡只加「圓點指示」與「自動換頁」。
   * 所以這段整個失效也不會壞掉 —— 客人照樣可以用手指滑，只是沒有圓點。
   */
  function featureCarousel() {
    var grid = document.getElementById("feature-grid");
    var dotsEl = document.getElementById("feature-dots");
    if (!grid || !dotsEl) return;

    var cards = [].slice.call(grid.querySelectorAll(".feature-card"));
    if (cards.length < 2) return;

    // 桌機是三欄並排，不需要輪播
    var isCarousel = function () {
      return window.matchMedia("(max-width: 600px)").matches;
    };
    // 使用者若在系統設定關掉動畫，就不要自動播放
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    dotsEl.innerHTML = cards.map(function (c, i) {
      var title = c.querySelector("h3");
      return '<button type="button" class="feature-dot' + (i === 0 ? " is-active" : "") +
             '" data-i="' + i + '" aria-label="看第 ' + (i + 1) + ' 項：' +
             (title ? title.textContent : "") + '"></button>';
    }).join("");
    var dots = [].slice.call(dotsEl.querySelectorAll(".feature-dot"));

    var current = 0;
    var timer = null;

    function setActive(i) {
      current = i;
      for (var d = 0; d < dots.length; d++) {
        dots[d].classList.toggle("is-active", d === i);
      }
    }

    function goTo(i) {
      setActive(i);
      grid.scrollTo({ left: cards[i].offsetLeft - grid.offsetLeft, behavior: "smooth" });
    }

    // 自動換頁。客人一碰就永久停掉 —— 自己在看的時候被系統換掉最惱人，
    // 這同時也滿足 WCAG「自動更新的內容要能停止」。
    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function startAuto() {
      if (reduceMotion || timer || !isCarousel()) return;
      timer = setInterval(function () {
        if (!isCarousel()) return stopAuto();
        goTo((current + 1) % cards.length);
      }, 4500);
    }

    dotsEl.addEventListener("click", function (e) {
      var i = e.target && e.target.getAttribute && e.target.getAttribute("data-i");
      if (i === null || i === undefined) return;
      stopAuto();
      goTo(Number(i));
    });
    ["touchstart", "pointerdown", "wheel"].forEach(function (evt) {
      grid.addEventListener(evt, stopAuto, { passive: true });
    });

    // 用 IntersectionObserver 追蹤目前看到哪一張（不用 scroll 事件，比較省）
    if (typeof IntersectionObserver === "function") {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) setActive(cards.indexOf(en.target));
          });
        },
        { root: grid, threshold: 0.6 }
      );
      cards.forEach(function (c) { io.observe(c); });
    }

    startAuto();
    window.addEventListener("resize", function () {
      if (!isCarousel()) { stopAuto(); setActive(0); } else { startAuto(); }
    });
  }
})();
