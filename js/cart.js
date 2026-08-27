(function () {
  // 加好友用官方短連結；送出訂單必須用 oaMessage 格式才能帶入訂單內容
  const LINE_ID = "@727qzmzu";
  const LINE_ADD_URL = "https://lin.ee/PQPzlSx";
  const cart = {};

  const cartListEl = document.getElementById("cart-list");
  const cartTotalEl = document.getElementById("cart-total");
  const cartLineBtn = document.getElementById("cart-line-btn");
  const shippingHintEl = document.getElementById("shipping-hint");
  const miniCartEl = document.getElementById("mini-cart");
  const miniCountEl = document.getElementById("mini-cart-count");
  const miniTotalEl = document.getElementById("mini-cart-total");
  const shippingRadios = document.querySelectorAll('input[name="shipping"]');
  const desktopBox = document.getElementById("cart-desktop");
  const copyBtn = document.getElementById("cart-copy-btn");
  const orderTextEl = document.getElementById("cart-order-text");

  /**
   * 這台裝置能不能用 LINE 的 oaMessage 網址一鍵帶入訊息？
   *
   * 只有手機可以。桌機瀏覽器打 line.me/R/oaMessage/... 會被 LINE 302 轉到
   * line.me 首頁，訂單整個消失（2026-08-15 老闆家回報，實測確認）。
   * 判斷失準的後果很輕：手機被誤判成電腦只是多看到複製按鈕，不會壞掉。
   */
  function canOpenLineWithMessage() {
    const ua = navigator.userAgent || "";
    if (/Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua)) return true;
    // iPad 從 iOS 13 起 UA 會偽裝成 Mac，改用觸控點數辨識
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
    return false;
  }

  const canDeepLink = canOpenLineWithMessage();

  /** 目前選的配送方式。超商 門檻$1300/運費$129、黑貓 門檻$3300/運費$225，兩者都不同 */
  function selectedShipping() {
    const picked = document.querySelector('input[name="shipping"]:checked');
    return {
      label: picked.value,
      threshold: Number(picked.dataset.threshold),
      fee: Number(picked.dataset.fee),
      pay: picked.dataset.pay,
    };
  }

  /** 付款方式跟配送方式綁定：超商＝貨到付款、黑貓＝匯款。選的當下就講，不要等客人問 */
  function renderPaymentHint() {
    const el = document.getElementById("payment-hint");
    if (!el) return;
    const { pay } = selectedShipping();
    el.textContent = pay === "匯款"
      ? "這個方式是「匯款」，訂單確認後跟老闆家拿匯款資訊"
      : "這個方式是「貨到付款」，到超商取貨時付款";
  }

  function renderCart() {
    const items = Object.values(cart);
    cartListEl.innerHTML = "";

    if (items.length === 0) {
      cartListEl.innerHTML = '<li class="cart-empty">尚未選購商品</li>';
    } else {
      items.forEach((item) => {
        const li = document.createElement("li");
        const label = document.createElement("span");
        label.textContent = `${item.name}（${item.variant}）x${item.qty}`;

        const right = document.createElement("span");
        right.textContent = `NT$ ${item.price * item.qty}`;

        const removeBtn = document.createElement("button");
        removeBtn.className = "cart-remove";
        removeBtn.textContent = "移除";
        removeBtn.dataset.key = item.key;
        right.appendChild(removeBtn);

        li.appendChild(label);
        li.appendChild(right);
        cartListEl.appendChild(li);
      });
    }

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    cartTotalEl.textContent = total;
    miniCartEl.hidden = count === 0;
    miniCountEl.textContent = `${count} 項`;
    miniTotalEl.textContent = `NT$ ${total}`;
    renderShippingHint(total);
    renderPaymentHint();
    updateLineLink(items, total);
  }

  function renderShippingHint(total) {
    const { threshold, fee } = selectedShipping();
    if (total === 0) {
      shippingHintEl.textContent = "";
    } else if (total < threshold) {
      // 同時講「還差多少」與「現在要付多少運費」，客人才有辦法決定要不要湊
      shippingHintEl.textContent =
        `再 NT$${threshold - total} 就免運（未滿運費 NT$${fee}）`;
    } else {
      shippingHintEl.textContent = "已達免運門檻！";
    }
  }

  /** 訂單文字。手機拿去塞進 LINE 網址，電腦拿去給客人複製，同一份不會不一致 */
  function buildOrderText(items, total) {
    const lines = items.map(
      (i) => `${i.name}（${i.variant}）x${i.qty}　NT$${i.price * i.qty}`
    );
    const ship = selectedShipping();
    // 未達免運就把運費寫進訂單，老闆家不用自己記哪一種要收多少
    const shipNote =
      total >= ship.threshold ? "（已達免運）" : `（未達免運，運費 NT$${ship.fee}）`;
    return (
      "您好，我想訂購：\n" +
      lines.join("\n") +
      `\n合計：NT$${total}` +
      `\n配送方式：${ship.label}${shipNote}` +
      // 寫進訂單，省掉「那我要怎麼付錢」這一輪來回
      `\n付款方式：${ship.pay}`
    );
  }

  function updateLineLink(items, total) {
    const empty = items.length === 0;

    // 電腦版：沒有購物車內容就不用出現複製區，免得畫面上都是空按鈕
    if (desktopBox) desktopBox.hidden = canDeepLink || empty;

    if (empty) {
      cartLineBtn.href = LINE_ADD_URL;
      if (orderTextEl) orderTextEl.value = "";
      return;
    }

    const message = buildOrderText(items, total);
    if (orderTextEl) orderTextEl.value = message;

    if (canDeepLink) {
      cartLineBtn.href = `https://line.me/R/oaMessage/${LINE_ID}/?${encodeURIComponent(message)}`;
    } else {
      // 桌機打 oaMessage 會被 LINE 轉去首頁、訂單消失，所以連結只留加好友用
      cartLineBtn.href = LINE_ADD_URL;
    }
  }

  /** 複製訂單。優先用新的剪貼簿 API，失敗再退回選取 textarea 的老方法 */
  async function copyOrder() {
    const text = orderTextEl ? orderTextEl.value : "";
    if (!text) return;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (e) {
      ok = false;
    }
    if (!ok) {
      try {
        orderTextEl.removeAttribute("readonly");
        orderTextEl.focus();
        orderTextEl.setSelectionRange(0, text.length);
        ok = document.execCommand("copy");
        orderTextEl.setAttribute("readonly", "");
      } catch (e) {
        ok = false;
      }
    }
    // 複製不成功也要給出路：叫客人自己選取下面那格文字
    copyBtn.textContent = ok ? "✓ 已複製，接著開 LINE 貼上" : "請手動選取下方文字複製";
    copyBtn.classList.toggle("is-copied", ok);
    setTimeout(() => {
      copyBtn.textContent = "① 複製訂單內容";
      copyBtn.classList.remove("is-copied");
    }, 4000);
  }

  if (copyBtn) copyBtn.addEventListener("click", copyOrder);

  // 桌機把主按鈕換成明確的用途，免得客人以為按了就送出了
  if (!canDeepLink) {
    cartLineBtn.hidden = true;
  }

  document.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const select = btn.parentElement.querySelector(".item-variant");
      const [size, priceStr] = select.value.split("|");
      const price = Number(priceStr);

      // 選配的第二個下拉（目前只有泰式打拋豬肉的辣度）。
      // 有就併進規格名稱，沒有的商品完全照舊，不影響其他 34 項。
      const optionEl = btn.parentElement.querySelector(".item-option");
      const option = optionEl ? optionEl.value : "";
      const variant = option ? `${size}・${option}` : size;

      // key 含辣度：同一道菜點「大・不辣」和「大・小辣」要算兩筆，不能合併
      const key = `${name}|${variant}`;

      if (!cart[key]) {
        cart[key] = { key, name, variant, price, qty: 0 };
      }
      cart[key].qty += 1;
      renderCart();
    });
  });

  // 換配送方式要重算免運提示與訂單文字
  shippingRadios.forEach((radio) => {
    radio.addEventListener("change", renderCart);
  });

  cartListEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("cart-remove")) {
      delete cart[e.target.dataset.key];
      renderCart();
    }
  });

  renderCart();
})();
