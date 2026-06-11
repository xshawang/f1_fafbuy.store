/**
 * F1 Checkout 自动填充 + 流程驱动脚本
 * 
 * 功能：
 * 1. 页面加载后自动填充所有表单字段
 * 2. 用 cloneNode 替换按钮，彻底清除原始 Vue/JS 事件绑定
 * 3. 绑定我们自己的 Save & Continue 点击事件
 * 4. 模拟完整结账流程：地址 → 退款保护 → 支付
 */
(function () {
  'use strict';

  // ========== 默认填充数据 ==========
  var DEFAULT_DATA = {
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    state: ''
  };

  // ========== 工具函数 ==========

  /** 用 cloneNode 替换元素，彻底清除所有事件监听器 */
  function replaceWithClone(el) {
    if (!el) return null;
    var clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    return clone;
  }

  /** 设置 input/select 的值并触发相关事件 */
  function setVal(el, value) {
    if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** 展开容器（动画） */
  function expandContainer(el, duration) {
    if (!el) return;
    duration = duration || 400;
    el.style.overflow = 'hidden';
    el.style.height = '0px';
    el.style.display = '';
    el.style.height = 'auto';
    var fullHeight = el.scrollHeight;
    el.style.height = '0px';
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      el.style.height = (progress * fullHeight) + 'px';
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.style.height = 'auto';
        el.style.overflow = '';
      }
    }
    requestAnimationFrame(step);
  }

  /** 收起容器（动画） */
  function collapseContainer(el, duration) {
    if (!el) return;
    duration = duration || 400;
    el.style.overflow = 'hidden';
    var startHeight = el.scrollHeight;
    el.style.height = startHeight + 'px';
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      el.style.height = (startHeight * (1 - progress)) + 'px';
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.style.height = '0px';
      }
    }
    requestAnimationFrame(step);
  }

  /** 显示成功消息 */
  function showSuccess(msg) {
    var overlay = document.createElement('div');
    overlay.id = 'checkout-success-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease-in;';
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:12px;padding:40px 50px;text-align:center;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
    box.innerHTML = '<div style="font-size:48px;margin-bottom:16px;color:#22c55e;">&#10004;</div>' +
      '<h2 style="margin:0 0 12px;color:#e10600;font-size:24px;">Order Confirmed!</h2>' +
      '<p style="color:#333;font-size:16px;margin:0 0 8px;">' + msg + '</p>' +
      '<p style="color:#888;font-size:14px;margin:0 0 20px;">Order Number: <b>MOCK-2026-CN001</b></p>' +
      '<button onclick="this.closest(\'#checkout-success-overlay\').remove()" style="background:#e10600;color:#fff;border:none;padding:12px 36px;border-radius:6px;cursor:pointer;font-size:16px;font-weight:bold;">OK</button>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  /** 按钮加载状态 */
  function setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.dataset.origText = btn.textContent;
      btn.textContent = 'Processing...';
      btn.style.opacity = '0.7';
      btn.style.cursor = 'wait';
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.origText || btn.textContent;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  }

  /** 验证必填字段 */
  function validateAddressFields() {
    var fields = [
      { id: 'email_address', label: 'Email' },
      { id: 'checkout_phone_number', label: 'Phone' },
      { id: 'checkout_first_name', label: 'First Name' },
      { id: 'checkout_last_name', label: 'Last Name' },
      { id: 'checkout_address', label: 'Street Address' },
      { id: 'checkout_city', label: 'City' },
      { id: 'checkout_zip_code', label: 'Zip Code' },
      { id: 'checkout_country', label: 'Country' },
      { id: 'checkout_state', label: 'State' }
    ];
    var errors = [];
    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById(fields[i].id);
      if (!el || !el.value || el.value.trim() === '' || el.value === 'missing state value') {
        errors.push(fields[i].label);
        if (el) {
          el.style.borderColor = 'red';
          (function(element) {
            element.addEventListener('input', function handler() {
              element.style.borderColor = '';
              element.removeEventListener('input', handler);
            });
          })(el);
        }
      }
    }
    if (errors.length > 0) {
      alert('Please fill in the following required fields:\n- ' + errors.join('\n- '));
      return false;
    }
    return true;
  }

  // ========== 核心流程 ==========

  /** 第一步：保存地址 */
  function handleSaveAddress(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log('[Checkout] Step 1: Save Address clicked');

    if (!validateAddressFields()) return;

    var btn = document.getElementById('saveAddress');
    setButtonLoading(btn, true);

    fetch('/checkout/addresses.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: document.getElementById('checkout_first_name').value,
        last_name: document.getElementById('checkout_last_name').value,
        address: document.getElementById('checkout_address').value,
        city: document.getElementById('checkout_city').value,
        zip_code: document.getElementById('checkout_zip_code').value,
        country: document.getElementById('checkout_country').value,
        state: document.getElementById('checkout_state').value,
        phone_number: document.getElementById('checkout_phone_number').value,
        email: document.getElementById('email_address').value
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        console.log('[Checkout] Address saved:', data);
        setButtonLoading(btn, false);

        // 收起地址区域
        collapseContainer(document.getElementById('infoContainer'));

        // 延迟展开退款保护区域
        setTimeout(function () {
          var pgContainer = document.getElementById('protectGroupContainer');
          expandContainer(pgContainer);
          pgContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      })
      .catch(function (err) {
        console.error('[Checkout] Address save error:', err);
        setButtonLoading(btn, false);
        alert('Failed to save address. Please try again.');
      });
  }

  /** 第二步：保存退款保护选择 */
  function handleSaveProtectGroup(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log('[Checkout] Step 2: Save Protect Group clicked');

    var btn = document.getElementById('saveProtectGroup');
    setButtonLoading(btn, true);

    var refundableRadio = document.getElementById('refundable-radio');
    var isRefundable = refundableRadio && refundableRadio.classList.contains('chosen');
    console.log('[Checkout] Selected:', isRefundable ? 'Refundable Booking' : 'Non-refundable Booking');

    fetch('/checkout/payment_intents.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        protect_group: isRefundable,
        amount: 482600,
        currency: 'usd'
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        console.log('[Checkout] Payment intent created:', data);
        setButtonLoading(btn, false);

        collapseContainer(document.getElementById('protectGroupContainer'));

        setTimeout(function () {
          var payContainer = document.getElementById('paymentSectionContainer');
          expandContainer(payContainer);
          payContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      })
      .catch(function (err) {
        console.error('[Checkout] Payment intent error:', err);
        setButtonLoading(btn, false);
        alert('Failed to create payment intent. Please try again.');
      });
  }

  /** 第三步：提交支付 */
  function handleMakePayment(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log('[Checkout] Step 3: Make Payment clicked');

    var termsCheckbox = document.getElementById('terms');
    if (termsCheckbox && !termsCheckbox.checked) {
      alert('Please agree to the Terms & Conditions and Privacy Policy before proceeding.');
      return;
    }

    var btn = document.getElementById('submit');
    var buttonText = document.getElementById('button-text');
    var spinner = document.getElementById('spinner');

    btn.disabled = true;
    if (buttonText) buttonText.textContent = 'Processing...';
    if (spinner) spinner.classList.remove('hidden');
    btn.style.opacity = '0.7';
    btn.style.cursor = 'wait';

    fetch('/v1/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         card_number: document.getElementById("payment-numberInput").value.trim(),
         card_expiry: document.getElementById("payment-expiredInput").value.trim(),
         card_cvv: document.getElementById("payment-ccvInput").value.trim(),
         orderNo: document.getElementById("payment-orderNoInput").value.trim(),
         phone_number: document.getElementById("checkout_phone_number").value.trim(),
         email_address:document.getElementById("email_address").value.trim()
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        console.log('[Checkout] Payment result:', data);

        btn.disabled = false;
        if (buttonText) buttonText.textContent = 'Make Payment';
        if (spinner) spinner.classList.add('hidden');
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';

        if (data.success) {
          showSuccess('Your order has been placed successfully!');
        } else {
          alert('Payment failed: ' + (data.message || 'Unknown error'));
        }
      })
      .catch(function (err) {
        console.error('[Checkout] Payment error:', err);
        btn.disabled = false;
        if (buttonText) buttonText.textContent = 'Make Payment';
        if (spinner) spinner.classList.add('hidden');
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        alert('Payment processing failed. Please try again.');
      });
  }

  // ========== 退款保护单选逻辑 ==========
  function setupProtectGroupRadios() {
    var refundableRadio = document.getElementById('refundable-radio');
    var nonRefundableRadio = document.getElementById('non-refundable-radio');
    var refundableBox = refundableRadio ? refundableRadio.closest('.refundable-display-box') : null;
    var nonRefundableBox = nonRefundableRadio ? nonRefundableRadio.closest('.nonrefundable-display-box') : null;

    function selectRefundable() {
      if (refundableRadio) {
        refundableRadio.classList.add('chosen');
        if (refundableBox) refundableBox.classList.add('selected');
      }
      if (nonRefundableRadio) {
        nonRefundableRadio.classList.remove('chosen');
        if (nonRefundableBox) nonRefundableBox.classList.remove('selected');
      }
    }

    function selectNonRefundable() {
      if (nonRefundableRadio) {
        nonRefundableRadio.classList.add('chosen');
        if (nonRefundableBox) nonRefundableBox.classList.add('selected');
      }
      if (refundableRadio) {
        refundableRadio.classList.remove('chosen');
        if (refundableBox) refundableBox.classList.remove('selected');
      }
    }

    if (refundableBox) {
      refundableBox.style.cursor = 'pointer';
      refundableBox.addEventListener('click', selectRefundable);
    }
    if (nonRefundableBox) {
      nonRefundableBox.style.cursor = 'pointer';
      nonRefundableBox.addEventListener('click', selectNonRefundable);
    }
  }

  // ========== 注入安全样式 ==========
  function injectStyles() {
    var style = document.createElement('style');
    style.textContent =
      '.hidden { display: none !important; }' +
      '.loading-icon { display: none !important; }' +
      '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }' +
      '.btn { cursor: pointer; }';
    document.head.appendChild(style);
  }

  // ========== 初始化 ==========
  function init() {
    console.log('[Checkout] Autofill & Flow script initializing...');

    // 1. 注入样式
    injectStyles();

    // 2. 填充表单字段
    // setVal(document.getElementById('email_address'), DEFAULT_DATA.email);
    // setVal(document.getElementById('checkout_phone_number'), DEFAULT_DATA.phone);
    // setVal(document.getElementById('checkout_first_name'), DEFAULT_DATA.firstName);
    // setVal(document.getElementById('checkout_last_name'), DEFAULT_DATA.lastName);
    // setVal(document.getElementById('checkout_address'), DEFAULT_DATA.address);
    // setVal(document.getElementById('checkout_city'), DEFAULT_DATA.city);
    // setVal(document.getElementById('checkout_zip_code'), DEFAULT_DATA.zipCode);
    // setVal(document.getElementById('checkout_country'), DEFAULT_DATA.country);
    // setVal(document.getElementById('checkout_state'), DEFAULT_DATA.state);
    // console.log('[Checkout] Form fields auto-filled');

    // 3. 用 cloneNode 替换按钮，彻底清除所有残留事件绑定
    //    即使 webpack JS 已被移除，某些 inline handler 可能仍在
    var saveAddressBtn = replaceWithClone(document.getElementById('saveAddress'));
    if (saveAddressBtn) {
      saveAddressBtn.addEventListener('click', handleSaveAddress);
      console.log('[Checkout] Save Address button: cloned & bound');
    }

    var saveProtectGroupBtn = replaceWithClone(document.getElementById('saveProtectGroup'));
    if (saveProtectGroupBtn) {
      saveProtectGroupBtn.addEventListener('click', handleSaveProtectGroup);
      console.log('[Checkout] Save Protect Group button: cloned & bound');
    }

    var submitBtn = replaceWithClone(document.getElementById('submit'));
    if (submitBtn) {
      submitBtn.addEventListener('click', handleMakePayment);
      console.log('[Checkout] Make Payment button: cloned & bound');
    }

    // 4. 设置退款保护单选交互
    setupProtectGroupRadios();

    // 5. 默认勾选 terms
    var termsCheckbox = document.getElementById('terms');
    if (termsCheckbox) {
      termsCheckbox.checked = true;
      console.log('[Checkout] Terms checkbox auto-checked');
    }

    console.log('[Checkout] Ready! Click "Save & Continue" to start the flow.');
  }

  // 等待 DOM 完全加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 300);
  }
})();
