/* =========================================================
   СМОЛЬНЫЙ — логика сайта
   Править этот файл не нужно: товары и ник Telegram
   находятся в js/products.js
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var money = function (n) { return n.toLocaleString('ru-RU') + ' ' + SHOP.currency; };
  var find = function (id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var tgUrl = 'https://t.me/' + SHOP.telegram;

  /* ---------- изображение товара с запасным вариантом ---------- */
  function visual(p, idx) {
    idx = idx || 0;
    if (p.photos && p.photos[idx]) {
      return '<img src="' + esc(p.photos[idx]) + '" alt="' + esc(p.name) + '" loading="lazy" ' +
        'data-fb="' + esc(p.fabric[0]) + '|' + esc(p.fabric[1]) + '">';
    }
    return fabric(p, idx);
  }
  function fabric(p, idx) {
    var a = [155, 35, 105, 200][(idx || 0) % 4];
    return '<div class="fabric" style="background:linear-gradient(' + a + 'deg,' + p.fabric[0] + ',' + p.fabric[1] + ' 78%)"></div>' +
      '<div class="fabric__mark"><img src="assets/crest-gold.png" alt=""></div>';
  }
  /* если фото не загрузилось — подставляем фактуру */
  function hookImages(root) {
    $$('img[data-fb]', root).forEach(function (img) {
      img.onerror = function () {
        var c = img.getAttribute('data-fb').split('|');
        var wrap = img.parentNode;
        wrap.innerHTML = '<div class="fabric" style="background:linear-gradient(155deg,' + c[0] + ',' + c[1] + ' 78%)"></div>' +
          '<div class="fabric__mark"><img src="assets/crest-gold.png" alt=""></div>';
      };
    });
  }

  /* =======================================================
     КАТАЛОГ
     ======================================================= */
  var cats = ['Всё'];
  PRODUCTS.forEach(function (p) { if (cats.indexOf(p.cat) < 0) cats.push(p.cat); });
  var activeCat = 'Всё';

  function drawFilters() {
    $('#filters').innerHTML = cats.map(function (c) {
      return '<button class="chip' + (c === activeCat ? ' on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
  }

  function drawGrid() {
    var list = PRODUCTS.filter(function (p) { return activeCat === 'Всё' || p.cat === activeCat; });
    $('#empty').hidden = list.length > 0;
    $('#grid').innerHTML = list.map(function (p, i) {
      return '<a class="card" href="#/product/' + p.id + '" style="animation-delay:' + (i * 45) + 'ms">' +
        '<div class="card__frame">' + visual(p, 0) +
        '<span class="card__peek">Посмотреть вещь</span></div>' +
        '<div class="card__body"><div><div class="card__name">' + esc(p.name) + '</div>' +
        '<div class="card__cat">' + esc(p.cat) + '</div></div>' +
        '<div class="card__price">' + money(p.price) + '</div></div></a>';
    }).join('');
    hookImages($('#grid'));
  }

  $('#filters').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    activeCat = b.dataset.cat; drawFilters(); drawGrid();
  });

  /* переходы из подвала сразу в нужную категорию */
  $$('[data-jump]').forEach(function (a) {
    a.addEventListener('click', function () {
      activeCat = a.dataset.jump; drawFilters(); drawGrid();
    });
  });

  /* =======================================================
     КАРТОЧКА ТОВАРА
     ======================================================= */
  var current = null, size = null, qty = 1;

  function drawProduct(p) {
    current = p; size = null; qty = 1;
    var only = p.sizes.length === 1 && p.sizes[0].in;
    if (only) size = p.sizes[0].s;

    $('#productBody').innerHTML =
      '<div class="gallery">' +
        '<div class="gallery__main" id="shot">' + visual(p, 0) + '</div>' +
        '<div class="thumbs">' + [0, 1, 2].map(function (i) {
          return '<button class="thumb' + (i === 0 ? ' on' : '') + '" data-shot="' + i + '" aria-label="Вид ' + (i + 1) + '">' + visual(p, i) + '</button>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="pd">' +
        '<div class="pd__cat">' + esc(p.cat) + '</div>' +
        '<h1 class="pd__name">' + esc(p.name) + '</h1>' +
        '<div class="pd__price">' + money(p.price) + '</div>' +
        '<p class="pd__desc">' + esc(p.desc) + '</p>' +

        '<div class="label"><span>Размер</span><button id="sizeLink">Размерная сетка</button></div>' +
        '<div class="sizes" id="sizes">' + p.sizes.map(function (s) {
          return '<button class="size' + (size === s.s ? ' on' : '') + '" data-size="' + esc(s.s) + '"' +
            (s.in ? '' : ' disabled title="Нет в наличии"') + '>' + esc(s.s) + '</button>';
        }).join('') + '</div>' +

        '<div class="label"><span>Количество</span></div>' +
        '<div class="qty"><button id="minus" aria-label="Убавить">−</button>' +
        '<span id="qtyNum">1</span><button id="plus" aria-label="Прибавить">+</button></div>' +

        '<div class="buy">' +
          '<button class="btn btn--fill" id="add">Добавить в корзину</button>' +
          '<a class="btn btn--ghost" href="' + tgUrl + '" target="_blank" rel="noopener">Спросить о вещи</a>' +
        '</div>' +
        '<p class="hint" id="hint"></p>' +

        '<div class="acc">' +
          acc('Состав и ткань', '<p>' + esc(p.comp) + '</p>', true) +
          acc('Характеристики', '<dl>' + Object.keys(p.spec).map(function (k) {
            return '<dt>' + esc(k) + '</dt><dd>' + esc(p.spec[k]) + '</dd>';
          }).join('') + '</dl>') +
          acc('Уход', '<p>' + esc(p.care) + '</p>') +
          acc('Доставка и возврат', '<p>По России бесплатно, 2–5 дней. 30 дней на возврат, если вещь не носили. Подгонка по фигуре бесплатно.</p>') +
        '</div>' +
      '</div>';

    var also = PRODUCTS.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 3);
    if (!also.length) also = PRODUCTS.filter(function (x) { return x.id !== p.id; }).slice(0, 3);
    $('#also').innerHTML = '<hr class="rule"><h2 class="h2">К этой вещи</h2><div class="grid">' +
      also.map(function (x) {
        return '<a class="card" href="#/product/' + x.id + '">' +
          '<div class="card__frame">' + visual(x, 0) + '<span class="card__peek">Посмотреть вещь</span></div>' +
          '<div class="card__body"><div><div class="card__name">' + esc(x.name) + '</div>' +
          '<div class="card__cat">' + esc(x.cat) + '</div></div>' +
          '<div class="card__price">' + money(x.price) + '</div></div></a>';
      }).join('') + '</div>';

    hookImages($('#productBody'));
    hookImages($('#also'));

    $('#sbName').textContent = p.name;
    $('#sbPrice').textContent = money(p.price);
    $('#stickybuy').classList.add('show');

    bind(p);
    sync();
  }

  function acc(title, inner, open) {
    return '<div class="acc__item' + (open ? ' open' : '') + '">' +
      '<button class="acc__btn">' + title + '<i>+</i></button>' +
      '<div class="acc__panel"' + (open ? ' style="max-height:500px"' : '') + '>' + inner + '</div></div>';
  }

  function sync() {
    var ok = !!size;
    $('#add').disabled = !ok;
    $('#sbAdd').disabled = !ok;
    $('#hint').textContent = ok
      ? 'Размер ' + size + ' в наличии. Отправим в течение суток.'
      : 'Выберите размер.';
  }

  function bind(p) {
    $('#sizes').addEventListener('click', function (e) {
      var b = e.target.closest('.size'); if (!b || b.disabled) return;
      size = b.dataset.size;
      $$('.size').forEach(function (x) { x.classList.toggle('on', x === b); });
      sync();
    });
    $('#plus').onclick = function () { if (qty < 9) { qty++; $('#qtyNum').textContent = qty; } };
    $('#minus').onclick = function () { if (qty > 1) { qty--; $('#qtyNum').textContent = qty; } };
    $('#add').onclick = function () { add(p, size, qty); };
    $('#sizeLink').onclick = openSize;

    $$('.thumb').forEach(function (t) {
      t.onclick = function () {
        var i = +t.dataset.shot;
        $('#shot').innerHTML = visual(p, i);
        hookImages($('#shot'));
        $$('.thumb').forEach(function (x) { x.classList.toggle('on', x === t); });
      };
    });

    $$('.acc__btn').forEach(function (b) {
      b.onclick = function () {
        var item = b.parentNode, panel = item.lastElementChild, open = item.classList.contains('open');
        item.classList.toggle('open', !open);
        panel.style.maxHeight = open ? 0 : panel.scrollHeight + 'px';
      };
    });
  }

  $('#sbAdd').onclick = function () { if (current) add(current, size, qty); };

  /* ---------- адрес вида #/product/shinel ---------- */
  function route() {
    var m = location.hash.match(/#\/product\/([\w-]+)/);
    var p = m && find(m[1]);
    if (p) {
      drawProduct(p);
      $('#product').classList.add('open');
      document.body.classList.add('locked');
      $('#product').scrollTop = 0;
      document.title = p.name + ' — СМОЛЬНЫЙ';
    } else {
      $('#product').classList.remove('open');
      $('#stickybuy').classList.remove('show');
      if (!$('#drawer').classList.contains('open')) document.body.classList.remove('locked');
      current = null;
      document.title = 'СМОЛЬНЫЙ — Сделано в Великой России';
    }
  }
  window.addEventListener('hashchange', route);
  $('#back').onclick = function () {
    if (history.length > 1) history.back(); else location.hash = '#collection';
  };

  /* =======================================================
     КОРЗИНА
     ======================================================= */
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem('smolny_cart') || '[]'); } catch (e) { cart = []; }
  cart = cart.filter(function (l) { return find(l.id); });

  function save() {
    try { localStorage.setItem('smolny_cart', JSON.stringify(cart)); } catch (e) { }
  }

  function add(p, s, n) {
    if (!s) { toast('Выберите размер', 'Без размера не оформим'); return; }
    var key = p.id + '|' + s, line = null;
    cart.forEach(function (l) { if (l.key === key) line = l; });
    if (line) line.n = Math.min(9, line.n + n); else cart.push({ key: key, id: p.id, size: s, n: n });
    save(); drawCart(); bump();
    toast('В корзине', p.name + ' · ' + s);
  }

  function drawCart() {
    var count = cart.reduce(function (a, l) { return a + l.n; }, 0);
    [$('#badge'), $('#badge2')].forEach(function (b) {
      b.textContent = count; b.classList.toggle('on', count > 0);
    });

    if (!cart.length) {
      $('#lines').innerHTML =
        '<div class="blank">' +
        '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin:0 auto;opacity:.5"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>' +
        '<p>Пока пусто. Начните с коллекции сезона.</p>' +
        '<button class="btn btn--ghost" id="goShop">Открыть коллекцию</button></div>';
      $('#foot').hidden = true;
      $('#goShop').onclick = function () { closeCart(); location.hash = '#collection'; };
      return;
    }

    $('#lines').innerHTML = cart.map(function (l) {
      var p = find(l.id);
      return '<div class="line" data-key="' + esc(l.key) + '">' +
        '<div class="line__img">' + visual(p, 0) + '</div>' +
        '<div><div class="line__name">' + esc(p.name) + '</div>' +
        '<div class="line__meta">Размер ' + esc(l.size) + '</div>' +
        '<div class="line__ctrl">' +
        '<button data-act="minus" aria-label="Убавить">−</button>' +
        '<span>' + l.n + '</span>' +
        '<button data-act="plus" aria-label="Прибавить">+</button></div></div>' +
        '<div class="line__right"><div class="line__price">' + money(p.price * l.n) + '</div>' +
        '<button class="line__del" data-act="del">Убрать</button></div></div>';
    }).join('');
    hookImages($('#lines'));

    $('#total').textContent = money(cart.reduce(function (a, l) { return a + find(l.id).price * l.n; }, 0));
    $('#foot').hidden = false;
  }

  $('#lines').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var key = b.closest('.line').dataset.key, i = -1;
    cart.forEach(function (l, j) { if (l.key === key) i = j; });
    if (i < 0) return;
    var act = b.dataset.act;
    if (act === 'plus' && cart[i].n < 9) cart[i].n++;
    else if (act === 'minus') { cart[i].n--; if (cart[i].n < 1) cart.splice(i, 1); }
    else if (act === 'del') cart.splice(i, 1);
    save(); drawCart();
  });

  function bump() {
    [$('#badge'), $('#badge2')].forEach(function (b) {
      b.style.transform = 'scale(1.35)';
      setTimeout(function () { b.style.transform = ''; }, 200);
    });
  }

  function openCart() {
    $('#drawer').classList.add('open'); $('#scrim').classList.add('open');
    document.body.classList.add('locked'); $('#cartClose').focus();
  }
  function closeCart() {
    $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open');
    if (!$('#product').classList.contains('open')) document.body.classList.remove('locked');
  }
  $('#cartBtn').onclick = openCart;
  $('#cartBtn2').onclick = openCart;
  $('#cartClose').onclick = closeCart;
  $('#scrim').onclick = closeCart;

  /* =======================================================
     ЗАКАЗ В TELEGRAM
     ======================================================= */
  function orderText() {
    var lines = ['Здравствуйте! Хочу заказать:', ''];
    var total = 0;
    cart.forEach(function (l, i) {
      var p = find(l.id), sum = p.price * l.n;
      total += sum;
      lines.push((i + 1) + '. ' + p.name + ' — размер ' + l.size + ', ' + l.n + ' шт. — ' + money(sum));
    });
    lines.push('', 'Итого: ' + money(total), '', 'Имя:', 'Город и адрес доставки:', 'Телефон:');
    return lines.join('\n');
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(fallback);
    }
    return fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { }
      document.body.removeChild(ta);
    }
  }

  $('#checkout').onclick = function () {
    if (!cart.length) return;
    var text = orderText();
    $('#orderText').textContent = text;
    $('#orderTg').href = tgUrl;
    copy(text);
    closeCart();
    $('#orderModal').classList.add('open');
    document.body.classList.add('locked');
    $('#orderTg').focus();
  };
  $('#orderCopy').onclick = function () {
    copy($('#orderText').textContent);
    toast('Скопировано', 'Вставьте сообщение в чат');
  };
  function closeOrder() {
    $('#orderModal').classList.remove('open');
    if (!$('#product').classList.contains('open')) document.body.classList.remove('locked');
  }
  $('#orderClose').onclick = closeOrder;
  $('#orderModal').addEventListener('click', function (e) { if (e.target === this) closeOrder(); });

  /* ссылки «написать в Telegram» */
  $('#tgLink').href = tgUrl;
  $$('[data-tg]').forEach(function (a) { a.href = tgUrl; a.target = '_blank'; a.rel = 'noopener'; });

  /* =======================================================
     РАЗМЕРНАЯ СЕТКА
     ======================================================= */
  function openSize() { $('#sizeModal').classList.add('open'); document.body.classList.add('locked'); $('#sizeClose').focus(); }
  function closeSize() {
    $('#sizeModal').classList.remove('open');
    if (!$('#product').classList.contains('open') && !$('#drawer').classList.contains('open')) document.body.classList.remove('locked');
  }
  $('#sizeClose').onclick = closeSize;
  $('#sizeOpen').onclick = openSize;
  $('#sizeOpen2').onclick = openSize;
  $('#sizeModal').addEventListener('click', function (e) { if (e.target === this) closeSize(); });

  /* =======================================================
     ТЕМА
     ======================================================= */
  var dark = true;
  try { if (localStorage.getItem('smolny_theme') === 'light') dark = false; } catch (e) { }
  applyTheme();

  function applyTheme() {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', dark ? '#0A1330' : '#F3EDE2');
    var b = $('#themeBtn');
    b.setAttribute('aria-label', dark ? 'Светлая тема' : 'Тёмная тема');
    b.title = dark ? 'Светлая тема' : 'Тёмная тема';
    $('#themeIcon').innerHTML = dark
      ? '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'
      : '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M19.1 4.9l-1.9 1.9M6.8 17.2l-1.9 1.9"/>';
  }
  $('#themeBtn').onclick = function () {
    dark = !dark; applyTheme();
    try { localStorage.setItem('smolny_theme', dark ? 'dark' : 'light'); } catch (e) { }
  };

  /* =======================================================
     МЕНЮ, УВЕДОМЛЕНИЕ, КЛАВИАТУРА
     ======================================================= */
  $('#burger').onclick = function () {
    var open = $('#nav').classList.toggle('open');
    this.setAttribute('aria-expanded', open);
  };
  $$('#nav a').forEach(function (a) {
    a.onclick = function () { $('#nav').classList.remove('open'); $('#burger').setAttribute('aria-expanded', false); };
  });

  var timer;
  function toast(title, text) {
    var t = $('#toast');
    t.innerHTML = '<b>' + esc(title) + '</b><span>' + esc(text) + '</span>';
    t.classList.add('on');
    clearTimeout(timer);
    timer = setTimeout(function () { t.classList.remove('on'); }, 3000);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if ($('#orderModal').classList.contains('open')) return closeOrder();
    if ($('#sizeModal').classList.contains('open')) return closeSize();
    if ($('#drawer').classList.contains('open')) return closeCart();
    if ($('#product').classList.contains('open')) $('#back').click();
  });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- старт ---------- */
  drawFilters();
  drawGrid();
  drawCart();
  route();
})();
