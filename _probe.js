/* Строит _probe.html — копию страницы с измерительным скриптом (реальный файл не меняется) */
const fs = require('fs');
const dir = 'C:\\Users\\toker\\Сайт для подруге\\english-tutor\\';
let html = fs.readFileSync(dir + 'index.html', 'utf8');

const collector = `<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message))});window.addEventListener('unhandledrejection',function(e){window.__errs.push('rejection:'+e.reason)});</script>`;

const probe = `<script>
window.addEventListener('load', function () {
  var out = [];
  var de = document.documentElement;
  out.push('viewport=' + window.innerWidth + 'x' + window.innerHeight);
  out.push('overflowX=' + (de.scrollWidth > de.clientWidth) + ' (scrollW=' + de.scrollWidth + ' clientW=' + de.clientWidth + ')');
  out.push('year=' + document.getElementById('year').textContent);
  out.push('jsErrors=' + (window.__errs.length ? window.__errs.join(' ~ ') : 'none'));

  var art = document.querySelector('.hero-art');
  if (art) { var r = art.getBoundingClientRect(); out.push('heroArt=' + Math.round(r.width) + 'x' + Math.round(r.height) + ' top=' + Math.round(r.top)); }

  var bar = document.querySelector('.mobile-bar');
  if (bar) { var cs = getComputedStyle(bar), rb = bar.getBoundingClientRect();
    out.push('mobileBar display=' + cs.display + ' h=' + Math.round(rb.height) + ' bottomGap=' + Math.round(window.innerHeight - rb.bottom)); }

  var ft = document.querySelector('footer');
  if (ft) { var rf = ft.getBoundingClientRect(); out.push('footerPaddingBottom=' + getComputedStyle(ft).paddingBottom); }

  var bad = [];
  document.querySelectorAll('*').forEach(function (el) {
    if (el.clientWidth > 0 && el.scrollWidth - el.clientWidth > 2 && getComputedStyle(el).overflowX === 'visible') {
      bad.push((el.tagName + '.' + (el.className || '')).slice(0, 40) + ' ' + el.scrollWidth + '>' + el.clientWidth);
    }
  });
  out.push('horizontalOverflow=' + (bad.length ? bad.slice(0, 6).join(' | ') : 'none'));

  // Реальная проверка горизонтальной прокрутки и элементов, вылезающих за вьюпорт
  window.scrollTo(300, 0);
  var sx = window.scrollX || window.pageXOffset || 0;
  window.scrollTo(0, 0);
  out.push('realHorizontalScroll=' + sx + ' (0 = прокрутки нет)');
  out.push('htmlOverflowX=' + getComputedStyle(document.documentElement).overflowX + ' bodyOverflowX=' + getComputedStyle(document.body).overflowX);
  var stick = document.querySelector('.nav'), sr = stick.getBoundingClientRect();
  out.push('stickyNav top=' + Math.round(sr.top) + ' h=' + Math.round(sr.height) + ' w=' + Math.round(sr.width));
  window.scrollTo(0, 1400);
  var navTopAfter = Math.round(stick.getBoundingClientRect().top);
  out.push('после scrollY=1400: scrollY=' + Math.round(window.scrollY) + ' navTop=' + navTopAfter + (navTopAfter === 0 ? ' => STICKY РАБОТАЕТ' : ' => STICKY СЛОМАН'));
  window.scrollTo(0, 0);
  var spill = [];
  document.querySelectorAll('main *, footer *, .mobile-bar *').forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && (r.right > window.innerWidth + 1 || r.left < -1) && !el.closest('.nav')) {
      spill.push((el.tagName + '.' + (el.className || '')).slice(0, 34) + ' right=' + Math.round(r.right) + ' left=' + Math.round(r.left));
    }
  });
  out.push('elementsOutsideViewport=' + (spill.length ? spill.slice(0, 6).join(' | ') : 'none'));

  var n = 0, zero = [];
  document.querySelectorAll('svg').forEach(function (s) { n++; var r = s.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) zero.push((s.parentElement && s.parentElement.className) || s.tagName); });
  out.push('svgCount=' + n + ' zeroSized=[' + zero.join(',') + ']');

  // видимость ключевых кнопок
  ['tel:+996220095297'].forEach(function () {});
  var telBtns = document.querySelectorAll('a[href^="tel:"]');
  out.push('telButtons=' + telBtns.length + ' visibleOnPage=' + Array.prototype.filter.call(telBtns, function (a) { return a.getBoundingClientRect().height > 0; }).length);
  out.push('waLinks=' + document.querySelectorAll('a[href^="https://wa.me/"]').length);

  // ---- живой тест формы ----
  var form = document.getElementById('bookingForm');
  var captured = null;
  window.open = function (u) { captured = u; return { closed: false }; };
  out.push('--- форма: невалидный ввод ---');
  document.getElementById('f-name').value = 'A';
  document.getElementById('f-goal').value = '';
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  out.push('openedOnInvalid=' + (captured ? 'ДА(ОШИБКА)' : 'нет')
    + ' | errName="' + document.getElementById('err-name').textContent + '"'
    + ' | errGoal="' + document.getElementById('err-goal').textContent + '"'
    + ' | ariaInvalid=' + document.getElementById('f-name').getAttribute('aria-invalid'));
  out.push('--- форма: валидный ввод ---');
  document.getElementById('f-name').value = '  Айгерим   ';
  document.getElementById('f-goal').value = 'Подготовка к экзаменам (IELTS / TOEFL)';
  document.getElementById('f-time').value = 'Вечер';
  document.getElementById('f-comment').value = 'Удобно после 18:00, нужен IELTS 7.5';
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  out.push('url=' + (captured || 'НЕ ОТКРЫЛОСЬ'));
  out.push('decoded=' + (captured ? decodeURIComponent(captured.split('?text=')[1]) : '-'));
  out.push('rawSpaceOrHash=' + (captured ? (/\\s/.test(captured) || captured.indexOf('#') > -1) : 'n/a'));
  out.push('afterReset name="' + document.getElementById('f-name').value + '" goal="' + document.getElementById('f-goal').value + '"');
  out.push('status="' + document.getElementById('formStatus').textContent + '"');

  // ---- бургер ----
  var burger = document.getElementById('burger'), nav = document.getElementById('navLinks');
  burger.click();
  out.push('burger открыт: aria-expanded=' + burger.getAttribute('aria-expanded') + ' label="' + burger.getAttribute('aria-label') + '" menuOpen=' + nav.classList.contains('open') + ' overlay=' + document.getElementById('overlay').classList.contains('show'));
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  out.push('после Escape: aria-expanded=' + burger.getAttribute('aria-expanded') + ' menuOpen=' + nav.classList.contains('open'));

  var pre = document.createElement('pre');
  pre.id = 'PROBE_OUT';
  var M = '@@' + 'PROBE' + '@@';
  pre.textContent = '\\n' + M + '\\n' + out.join('\\n') + '\\n' + M + '\\n';
  document.body.appendChild(pre);
});
</script>`;

html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">' + collector);
html = html.replace('</body>', probe + '\n</body>');
fs.writeFileSync(dir + '_probe.html', html, 'utf8');
console.log('probe built:', (dir + '_probe.html'));
