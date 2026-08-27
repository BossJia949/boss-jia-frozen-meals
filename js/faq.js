(function () {
  // 自助問答。刻意不接 AI：
  //   1. 這是靜態網站，API 金鑰放進來等於公開，一定會被撿走去刷帳單。
  //   2. 食材、過敏、辣度這種問題不能讓模型用「聽起來很合理」的方式編答案。
  // 所以答案一律是老闆家寫的，這支程式只負責「聽懂客人在問哪一題」。
  //
  // 資料來源就是畫面上的 <details class="faq-item">，不另外維護資料檔 ——
  // 一份內容同時給客人看、給程式比對、給搜尋引擎爬，改一個地方就好。

  var LINE_ID = "@727qzmzu";

  var form = document.getElementById("faq-form");
  var input = document.getElementById("faq-input");
  var chipsEl = document.getElementById("faq-chips");
  var answerEl = document.getElementById("faq-answer");
  if (!form || !input || !answerEl) return;

  var items = [].slice.call(document.querySelectorAll(".faq-item")).map(function (el) {
    return {
      el: el,
      id: el.id,
      q: el.querySelector("summary").textContent.trim(),
      html: el.querySelector(".faq-a").innerHTML,
      keywords: (el.getAttribute("data-keywords") || "")
        .split(",").map(function (s) { return normalize(s); }).filter(Boolean),
    };
  });
  if (!items.length) return;

  /** 把客人打的字「脫水」：全形轉半形、去掉語助詞與標點，只留下有意義的字 */
  function normalize(raw) {
    return String(raw || "")
      .replace(/[！-～]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
      })
      .toLowerCase()
      .replace(/請問|想問|我想知道|不好意思|你好|您好|是不是|會不會|可不可以|能不能|有沒有|可以|喔喔|謝謝/g, "")
      .replace(/[嗎呢啊喔噢耶欸呀哦的了吧]/g, "")
      .replace(/[\s　,，.。?？!！~～、:：;；'"「」『』（）()【】\[\]\-_/\\]/g, "");
  }

  /** 中文沒有空格切不了詞，用「兩字一組」來比對，錯字與不同語序都還抓得到 */
  function bigrams(s) {
    var set = {};
    if (s.length === 1) set[s] = 1;
    for (var i = 0; i < s.length - 1; i++) set[s.slice(i, i + 2)] = 1;
    return set;
  }

  /** 以較短的一方當分母：客人打的短句只要「包含在」關鍵字裡就算命中 */
  function containment(a, b) {
    var ka = Object.keys(a), kb = Object.keys(b);
    if (!ka.length || !kb.length) return 0;
    var hit = 0;
    for (var i = 0; i < kb.length; i++) if (a[kb[i]]) hit++;
    return hit / Math.min(ka.length, kb.length);
  }

  function scoreItem(queryNorm, queryGrams, item) {
    var best = 0;
    for (var i = 0; i < item.keywords.length; i++) {
      var kw = item.keywords[i];
      // 直接包含就是滿分，不用再算相似度
      if (queryNorm.indexOf(kw) !== -1 || kw.indexOf(queryNorm) !== -1) return 1;
      var s = containment(queryGrams, bigrams(kw));
      if (s > best) best = s;
    }
    return best;
  }

  function rank(query) {
    var n = normalize(query);
    if (!n) return [];
    var g = bigrams(n);
    return items
      .map(function (it) { return { item: it, score: scoreItem(n, g, it) }; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  // 跟 cart.js 同一套判斷：LINE 的 oaMessage 網址只有手機能用，
  // 桌機會被 302 轉去 line.me 首頁，帶的訊息整個不見。
  var CAN_DEEP_LINK = (function () {
    var ua = navigator.userAgent || "";
    if (/Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua)) return true;
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
    return false;
  })();

  var LINE_ADD_URL = "https://lin.ee/PQPzlSx";

  function lineUrl(text) {
    if (!CAN_DEEP_LINK) return LINE_ADD_URL;
    return "https://line.me/R/oaMessage/" + LINE_ID + "/?" + encodeURIComponent(text);
  }

  /** 電腦版按「問老闆家」時，順手把問題複製起來，客人開了 LINE 直接貼 */
  function copyQuestion(text) {
    if (CAN_DEEP_LINK || !text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text);
    } catch (e) { /* 複製失敗不影響開啟 LINE，客人自己打字就好 */ }
  }

  // 電腦版的說明文字不一樣：桌機帶不進訊息，要講清楚是「複製好了，去貼上」
  var ASK_LABEL = CAN_DEEP_LINK ? "直接問老闆家" : "複製問題並開啟 LINE";
  var MISS_CTA = CAN_DEEP_LINK
    ? "把這個問題傳給老闆家"
    : "複製問題並開啟 LINE（電腦版請自行貼上）";

  function showAnswer(item) {
    answerEl.hidden = false;
    answerEl.innerHTML =
      '<h3 class="faq-answer-q">' + escapeHtml(item.q) + "</h3>" +
      '<div class="faq-answer-body">' + item.html + "</div>" +
      '<p class="faq-answer-more">還是不清楚嗎？' +
      '<a class="faq-answer-link" target="_blank" rel="noopener" data-ask="' +
      escapeHtml("您好，我想請問：" + item.q) + '" href="' +
      lineUrl("您好，我想請問：" + item.q) + '">' + ASK_LABEL + "</a></p>";
    answerEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showFallback(query, top) {
    var suggestions = top
      .filter(function (r) { return r.score > 0; })
      .slice(0, 3)
      .map(function (r) {
        return '<button type="button" class="faq-suggest" data-id="' + r.item.id + '">' +
               escapeHtml(r.item.q) + "</button>";
      })
      .join("");

    answerEl.hidden = false;
    answerEl.innerHTML =
      '<p class="faq-miss">這題我不太確定，直接問老闆最準 👇</p>' +
      '<a class="btn btn-line faq-ask-line" target="_blank" rel="noopener" data-ask="' +
      escapeHtml("您好，我想請問：" + query) + '" href="' +
      lineUrl("您好，我想請問：" + query) + '">' + MISS_CTA + "</a>" +
      (suggestions
        ? '<p class="faq-suggest-title">你是不是想問這些？</p><div class="faq-suggest-row">' +
          suggestions + "</div>"
        : "");
    answerEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ask(query) {
    var q = String(query || "").trim();
    if (!q) return;
    var ranked = rank(q);
    // 0.55：實測「請問這個會不會很辣啊」這類講法能中，
    // 而「你們有賣火鍋料嗎」這種沒寫過的題目會落到轉真人
    if (ranked.length && ranked[0].score >= 0.55) showAnswer(ranked[0].item);
    else showFallback(q, ranked);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(input.value);
  });

  // 快捷按鈕：直接用前 6 題的問題文字，不另外維護一份清單
  if (chipsEl) {
    chipsEl.innerHTML = items.slice(0, 6).map(function (it) {
      return '<button type="button" class="faq-chip" data-id="' + it.id + '">' +
             escapeHtml(it.q.replace(/[？?].*$/, "").replace(/^.*[，,]/, "")) + "</button>";
    }).join("");
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.classList) return;
    // 電腦版：點「問老闆家」時先把問題複製起來，客人開了 LINE 直接貼
    if (t.hasAttribute && t.hasAttribute("data-ask")) copyQuestion(t.getAttribute("data-ask"));
    if (t.classList.contains("faq-chip") || t.classList.contains("faq-suggest")) {
      var found = items.filter(function (it) { return it.id === t.getAttribute("data-id"); })[0];
      if (found) {
        input.value = found.q;
        showAnswer(found);
      }
    }
  });
})();
