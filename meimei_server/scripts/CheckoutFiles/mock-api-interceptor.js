/**
 * Mock API Interceptor for F1 Experiences Checkout
 * 强制拦截所有 API 请求，禁止任何请求穿透到真实后端
 */
(function() {
  'use strict';

  // ========== Mock 数据 ==========
  const US_STATES = [
    {code:'AL',name:'Alabama',english_translation:'Alabama'},
    {code:'AK',name:'Alaska',english_translation:'Alaska'},
    {code:'AZ',name:'Arizona',english_translation:'Arizona'},
    {code:'AR',name:'Arkansas',english_translation:'Arkansas'},
    {code:'CA',name:'California',english_translation:'California'},
    {code:'CO',name:'Colorado',english_translation:'Colorado'},
    {code:'CT',name:'Connecticut',english_translation:'Connecticut'},
    {code:'DC',name:'Washington DC',english_translation:'Washington DC'},
    {code:'DE',name:'Delaware',english_translation:'Delaware'},
    {code:'FL',name:'Florida',english_translation:'Florida'},
    {code:'GA',name:'Georgia',english_translation:'Georgia'},
    {code:'GU',name:'Guam',english_translation:'Guam'},
    {code:'HI',name:'Hawaii',english_translation:'Hawaii'},
    {code:'IA',name:'Iowa',english_translation:'Iowa'},
    {code:'ID',name:'Idaho',english_translation:'Idaho'},
    {code:'IL',name:'Illinois',english_translation:'Illinois'},
    {code:'IN',name:'Indiana',english_translation:'Indiana'},
    {code:'KS',name:'Kansas',english_translation:'Kansas'},
    {code:'KY',name:'Kentucky',english_translation:'Kentucky'},
    {code:'LA',name:'Louisiana',english_translation:'Louisiana'},
    {code:'MA',name:'Massachusetts',english_translation:'Massachusetts'},
    {code:'MD',name:'Maryland',english_translation:'Maryland'},
    {code:'ME',name:'Maine',english_translation:'Maine'},
    {code:'MI',name:'Michigan',english_translation:'Michigan'},
    {code:'MN',name:'Minnesota',english_translation:'Minnesota'},
    {code:'MO',name:'Missouri',english_translation:'Missouri'},
    {code:'MP',name:'Northern Mariana Islands',english_translation:'Northern Mariana Islands'},
    {code:'MS',name:'Mississippi',english_translation:'Mississippi'},
    {code:'MT',name:'Montana',english_translation:'Montana'},
    {code:'NC',name:'North Carolina',english_translation:'North Carolina'},
    {code:'ND',name:'North Dakota',english_translation:'North Dakota'},
    {code:'NE',name:'Nebraska',english_translation:'Nebraska'},
    {code:'NH',name:'New Hampshire',english_translation:'New Hampshire'},
    {code:'NJ',name:'New Jersey',english_translation:'New Jersey'},
    {code:'NM',name:'New Mexico',english_translation:'New Mexico'},
    {code:'NV',name:'Nevada',english_translation:'Nevada'},
    {code:'NY',name:'New York',english_translation:'New York'},
    {code:'OH',name:'Ohio',english_translation:'Ohio'},
    {code:'OK',name:'Oklahoma',english_translation:'Oklahoma'},
    {code:'OR',name:'Oregon',english_translation:'Oregon'},
    {code:'PA',name:'Pennsylvania',english_translation:'Pennsylvania'},
    {code:'PR',name:'Puerto Rico',english_translation:'Puerto Rico'},
    {code:'RI',name:'Rhode Island',english_translation:'Rhode Island'},
    {code:'SC',name:'South Carolina',english_translation:'South Carolina'},
    {code:'SD',name:'South Dakota',english_translation:'South Dakota'},
    {code:'TN',name:'Tennessee',english_translation:'Tennessee'},
    {code:'TX',name:'Texas',english_translation:'Texas'},
    {code:'UM',name:'U.S. Outlying Islands',english_translation:'U.S. Outlying Islands'},
    {code:'UT',name:'Utah',english_translation:'Utah'},
    {code:'VA',name:'Virginia',english_translation:'Virginia'},
    {code:'VI',name:'U.S. Virgin Islands',english_translation:'U.S. Virgin Islands'},
    {code:'VT',name:'Vermont',english_translation:'Vermont'},
    {code:'WA',name:'Washington',english_translation:'Washington'},
    {code:'WI',name:'Wisconsin',english_translation:'Wisconsin'},
    {code:'WV',name:'West Virginia',english_translation:'West Virginia'},
    {code:'WY',name:'Wyoming',english_translation:'Wyoming'}
  ];

  const mockRoutes = {
    '/api/currencies.json': {
      rate: '6.7743',
      currencies: ['CNY', 'USD'],
      current_currency: 'CNY'
    },
    '/en/cart/hotel_price_change.json': {
      hotel_rate_change: false
    },
    '/en/cart/protect_group_info.json': {
      event_pg_enabled: null,
      event_pg_premium: 0,
      event_pg_premium_charge_currency: 0,
      event_pg_premium_decorated: '$0.00',
      package_pg_enabled: true,
      order_protected: false,
      quote_order: false,
      quote_order_hide_protect_group: false,
      zero_dollar_change_order: false,
      zero_dollar_quote_order: false,
      dynamic_enabled: true,
      dynamic_premium: 0,
      dynamic_premium_decorated: '$0.00',
      deposit_items_present: false
    },
    '/en/cart.json': {
      charge_currency: 'USD',
      currency: 'CNY',
      exchange_rate: '6.7893',
      id: null,
      item_count: 1,
      event_payment_terms: [],
      payment_count: 1,
      payment_terms: [
        { due_date: '1920-12-25', payment_type: '1/1', amount: 0, charge_date: '1920-12-25', source_id: null, status: 'passed', payment_method: 'credit_card' },
        { due_date: '2026-05-26', amount: 0, charge_date: '2026-05-26', payment_method: 'internal_credit', status: 'passed', source_id: null }
      ],
      discount_code: null,
      chargeable_currencies: ['USD', 'CNY'],
      amount_due_today: 4826,
      amount_due_today_decorated: '$4,826.00',
      discount_decorated: '\u00a50.00',
      discount: 0,
      event_venue: 'Shanghai International Circuit',
      event_address: null,
      event_h4h_address: null,
      date_translate: null,
      event_name: '2026 Chinese Grand Prix',
      event_latitude: null,
      event_longitude: null,
      event_h4h_latitude: null,
      event_h4h_longitude: null,
      event_hotel_behavior: 'default',
      event_hotel_search_locked_location: false,
      event_h4h_post_purchase_enabled: false,
      event_arn_site_id: null,
      event_start_date: '2026-03-20',
      event_end_date: '2026-03-22',
      hotel_start_date: null,
      hotel_end_date: null,
      event_location: 'Shanghai, China',
      fee_and_tax_decorated: '\u00a50.00',
      cc_fee_decorated: '\u00a50.00',
      cc_fee: 0,
      messages: null,
      processing_fee_decorated: '\u00a50.00',
      processing_fee: 0,
      subtotal_decorated: '\u00a532,782.88',
      subtotal: 32782.88,
      tax_decorated: '\u00a50.00',
      tax: 0,
      total_decorated: '$4,826.00',
      total: 4826,
      total_exchange_in_charge_currency: '$4,826.00',
      total_exchange_decorated: '\u00a532,782.88',
      total_exchange: '32782.88',
      vat_tax_decorated: '\u00a50.00',
      vat_tax: 0,
      first_name: null,
      last_name: null,
      corporate_group: false,
      phone: null,
      email: null,
      street_1: null,
      street_2: null,
      city: null,
      state: null,
      country: null,
      zip_code: null,
      items: [
        {
          id: 1,
          name: 'Rising Stars | Principal Main',
          decorated_price: '$4,826.00',
          price: 4826,
          quantity: 1,
          type: 'package',
          event_id: 101,
          hotel_id: null,
          hotel_reservations: {},
          h4h_hotel_add_on: false,
          h4h_hotel_for_ticket: false,
          package_price: 4826,
          package_display_name: 'Rising Stars | Principal Main',
          package_hotel_required: false,
          deposit: false,
          sf_type: 'Package',
          travel_hotels: false,
          product: { id: 1, name: 'Rising Stars | Principal Main', type: 'Package' },
          add_ons: [],
          options: []
        }
      ],
      credit_amount: 0,
      credit_amount_decorated: '\u00a50.00',
      amount_after_credit: '$4,826.00',
      customer_total_credit: 0,
      customer_total_credit_decorated: '$0.00',
      protect_group_amount: '$0.00',
      protect_group_amount_raw: 0,
      protect_group_cost: 0,
      protect_group_cost_decorated: '$0.00',
      event_terms_and_conditions: null,
      payment_term_options: [[
        { due_date: '1920-12-25', payment_type: '1/1', amount: 0, charge_date: '1920-12-25', source_id: null, status: 'passed', payment_method: 'credit_card' }
      ]],
      event_payment_term_options: [1],
      credit_applicable: false,
      disabled_cart: false,
      quote_order: false,
      disabled_cart_guest_email: null,
      change_order: false,
      change_order_already_paid: '$0.00',
      change_order_subtotal: '$0.00',
      hotel_needed: false,
      h4h_add_on: false,
      h4h_event_id: null,
      zero_dollar_change_order: false,
      order_type: 'WebOrder',
      currencies: ['CNY', 'USD'],
      blank_h4h_form: false,
      event_id: 101,
      price_change_item: null,
      minimum_hotels_required: 0,
      ticket_and_hotel: false,
      deposit_item: null,
      total_roomcash: 0,
      total_roomcash_decorated: '(\u00a50.00)',
      in_eu: false,
      default_package_currency: 'USD',
      customer: [],
      subtotal_before_discounts: '\u00a532,782.88',
      card_only_checkout: true,
      in_canada: false,
      in_us: false,
      amex_only: false,
      add_on_div: '<div class="first-three-add-ons"></div><div class="additional-add-ons"></div>',
      add_ons_length: 0,
      refundable_purchased_on_deposit: null,
      fifty_k_payment_term: false,
      starts_soon: null,
      is_snh: false,
      active_discounts: true,
      cart_version: 'version_1',
      h4h_program: 'F1 Experiences Rewards'
    },
    '/customers/customer_email_validations': {
      valid: true,
      message: 'Email is valid'
    },
    '/checkout/addresses.json': {
      success: true,
      address_errors: false,
      message: 'Address saved successfully'
    },
    '/checkout/payment_intents.json': {
      id: 'pi_mock_123',
      client_secret: 'pi_mock_123_secret_456',
      status: 'requires_payment_method',
      amount: 482600,
      currency: 'usd'
    },
    '/checkout/charges.json': {
      success: true,
      order_number: 'MOCK-2026-CN001',
      confirmation_url: '/en/confirmation',
      message: 'Order placed successfully'
    },
    '/checkout/refundable_bookings.json': {
      success: true
    },
    '/checkout_hotel_reservations': [],
    '/customers/guests': {
      ok: true,
      guest: true
    }
  };

  // ========== 兜底安全响应 ==========
  // 任何未匹配到具体路由的请求，都返回这个安全响应，绝不让请求穿透到真实后端
  const FALLBACK_RESPONSE = { success: true, ok: true, status: 'ok', message: 'Mock fallback response' };

  // ========== 判断是否应该拦截 ==========
  // 静态资源（图片、字体、CSS等）不拦截，只拦截 API 请求
  function shouldIntercept(url) {
    if (!url) return false;
    // 静态资源扩展名 - 不拦截
    if (/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|css)(\?|$)/i.test(url)) return false;
    // HTML 文件 - 不拦截
    if (/\.html(\?|$)/i.test(url)) return false;
    // 外部 CDN/第三方域名 - 不拦截
    if (/^https?:\/\//i.test(url) && !url.includes(location.hostname)) return false;
    // 其余全部拦截
    return true;
  }

  // ========== 匹配 Mock 数据 ==========
  function findMockData(url) {
    if (!url) return null;

    // 匹配 /api/countries/XX.json
    const countryMatch = url.match(/\/api\/countries\/(\w+)\.json/);
    if (countryMatch) {
      return { states: US_STATES };
    }

    // 匹配其他静态路由
    for (const [path, data] of Object.entries(mockRoutes)) {
      if (url.includes(path)) {
        return data;
      }
    }

    // 兜底：返回安全响应，绝不穿透
    return FALLBACK_RESPONSE;
  }

  // ========== 拦截 fetch ==========
  const origFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    if (shouldIntercept(url)) {
      const mock = findMockData(url);
      console.log('[Mock] Intercepted fetch:', url);
      return Promise.resolve(new Response(JSON.stringify(mock), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    return origFetch.apply(this, arguments);
  };

  // ========== 拦截 XMLHttpRequest ==========
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._mockUrl = url;
    this._mockMethod = method;
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (shouldIntercept(this._mockUrl)) {
      const mock = findMockData(this._mockUrl);
      console.log('[Mock] Intercepted XHR:', this._mockMethod, this._mockUrl);
      const self = this;
      Object.defineProperty(this, 'readyState', { value: 4, writable: true });
      Object.defineProperty(this, 'status', { value: 200, writable: true });
      Object.defineProperty(this, 'responseText', { value: JSON.stringify(mock), writable: true });
      Object.defineProperty(this, 'response', { value: JSON.stringify(mock), writable: true });
      setTimeout(function() {
        if (self.onreadystatechange) self.onreadystatechange();
        if (self.onload) self.onload();
        self.dispatchEvent(new Event('load'));
        self.dispatchEvent(new Event('readystatechange'));
      }, 0);
      return;
    }
    return origSend.apply(this, arguments);
  };

  console.log('[Mock] API interceptor installed - ALL API requests will be intercepted');
  console.log('[Mock] Known routes:', Object.keys(mockRoutes).join(', '), '+ /api/countries/{code}.json + fallback');
})();
