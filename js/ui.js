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
})();
