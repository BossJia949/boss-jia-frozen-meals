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

  /** 目前選的配送方式。超商 門檻$1300/運費$129、黑貓 門檻$3300/運費$250，兩者都不同 */
  function selectedShipping() {
    const picked = document.querySelector('input[name="shipping"]:checked');
    return {
      label: picked.value,
      threshold: Number(picked.dataset.threshold),
      fee: Number(picked.dataset.fee),
    };
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

  function updateLineLink(items, total) {
    if (items.length === 0) {
      cartLineBtn.href = LINE_ADD_URL;
      return;
    }
    const lines = items.map(
      (i) => `${i.name}（${i.variant}）x${i.qty}　NT$${i.price * i.qty}`
    );
    const ship = selectedShipping();
    // 未達免運就把運費寫進訂單，老闆家不用自己記哪一種要收多少
    const shipNote =
      total >= ship.threshold ? "（已達免運）" : `（未達免運，運費 NT$${ship.fee}）`;
    const message =
      "您好，我想訂購：\n" +
      lines.join("\n") +
      `\n合計：NT$${total}` +
      `\n配送方式：${ship.label}${shipNote}`;
    cartLineBtn.href = `https://line.me/R/oaMessage/${LINE_ID}/?${encodeURIComponent(message)}`;
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
