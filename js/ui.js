(function () {
  // 回頂端按鈕：滑過首圖才出現，免得一進站就有東西擋畫面。
  //
  // 用 IntersectionObserver 觀察首圖，不用 scroll 事件 —— scroll + requestAnimationFrame
  // 在分頁沒被顯示時會被瀏覽器凍結，IntersectionObserver 是看版面不是看繪製，比較可靠。
  //
  // CSS 預設按鈕可見；這裡才把 html 標成 js-scroll-aware 切換成「滑過才出現」。
  // 所以沒有 JavaScript 或瀏覽器太舊時，按鈕是常駐可用的，不會消失。
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
