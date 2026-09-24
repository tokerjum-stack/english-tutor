/* Проверка index.html по 7 пунктам брифа. Запуск: node _check.js */
const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'C:\\Users\\toker\\Сайт для подруге\\english-tutor\\index.html';
const raw = fs.readFileSync(FILE);
const html = raw.toString('utf8');
const fail = [];
const ok = [];
function check(name, cond, extra) {
  (cond ? ok : fail).push(name + (extra ? ' :: ' + extra : ''));
}

/* ---------- 7. UTF-8 без BOM ---------- */
check('7. UTF-8 без BOM', !(raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF), 'первые байты: ' + [...raw.slice(0, 3)].join(','));
check('7. Корректно декодируется как UTF-8', Buffer.from(html, 'utf8').equals(raw));
check('7. Нет U+FFFD (битых символов)', !html.includes('\uFFFD'));

/* ---------- 1. Теги сбалансированы ---------- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
let scan = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script></script>')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '<style></style>');
const stack = [];
const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
let m, mismatches = [];
while ((m = tagRe.exec(scan))) {
  const closing = m[1] === '/';
  const name = m[2].toLowerCase();
  const selfClosed = m[4] === '/';
  if (VOID.has(name) || selfClosed) continue;
  if (!closing) stack.push(name);
  else {
    const top = stack.pop();
    if (top !== name) mismatches.push('</' + name + '> закрывает <' + top + '>');
  }
}
check('1. Теги сбалансированы', mismatches.length === 0 && stack.length === 0,
  mismatches.length ? mismatches.slice(0, 5).join('; ') : 'незакрытых: [' + stack.join(',') + ']');
check('1. Есть doctype/html/head/body', /^<!DOCTYPE html>/i.test(html) && /<\/html>\s*$/.test(html) && html.includes('<head>') && html.includes('</body>'));
check('1. style и script закрыты', (html.match(/<style>/g) || []).length === 1 && (html.match(/<\/style>/g) || []).length === 1 && (html.match(/<script type="application\/ld\+json">/g) || []).length === 1 && (html.match(/<script>/g) || []).length === 1);
const opens = (html.match(/<svg\b/g) || []).length, closes = (html.match(/<\/svg>/g) || []).length;
check('1. SVG открыт/закрыт парно', opens === closes, opens + ' / ' + closes);
check('1. Нет оборванных мест (нет «...»/TODO)', !/TODO|FIXME|\.\.\.\s*<\/|undefined<\/|\bNaN\b/.test(html));

/* ---------- 2. Телефон кликабелен ---------- */
const telLinks = html.match(/href="tel:\+996220095297"/g) || [];
check('2. tel: ссылок найдено', telLinks.length >= 4, telLinks.length + ' шт.');
check('2. Номер читаемым текстом есть', html.includes('+996 220 095 297'));
check('2. Номер в формате E.164 для JSON-LD есть', html.includes('"+996220095297"'));

/* ---------- 3. Исходные тексты сохранены (сверка с git HEAD) ---------- */
let original = '';
try {
  original = execSync('git -C "C:\\Users\\toker\\Сайт для подруге\\english-tutor" show HEAD:index.html', { encoding: 'utf8' });
} catch (e) { original = ''; }
function textOf(s) {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
if (original) {
  const stripEmoji = s => s.replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, ' ');
  const newTextAll = stripEmoji(textOf(html));
  const origText = stripEmoji(textOf(original));

  // 3a. Побуквенная сверка всех слов исходника: каждое слово исходника должно найтись в новом файле
  const words = s => (s.match(/[A-Za-zА-Яа-яЁё0-9+%°№.,;:!?«»()\-]+/g) || []).map(w => w.replace(/^[.,;:!?«»()\-]+|[.,;:!?«»()\-]+$/g, '')).filter(w => w.length > 1);
  const count = arr => arr.reduce((m, w) => (m[w] = (m[w] || 0) + 1, m), {});
  const cOrig = count(words(origText)), cNew = count(words(newTextAll));
  const lostWords = Object.keys(cOrig).filter(w => (cNew[w] || 0) < cOrig[w]);
  check('3. Ни одно слово исходного текста не потеряно', lostWords.length === 0,
    lostWords.length ? 'ПОТЕРЯНО: ' + lostWords.map(w => w + '(' + cOrig[w] + '→' + (cNew[w] || 0) + ')').join(', ') : Object.keys(cOrig).length + ' уникальных слов сверено');

  // 3b. Поэлементная сверка: каждый текстовый узел исходника должен присутствовать в новом файле
  const origMarkup = original
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const nodes = (origMarkup.match(/>[^<>]+</g) || [])
    .map(s => s.slice(1, -1))
    .map(s => stripEmoji(s).replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 2);
  const lostNodes = [...new Set(nodes)].filter(n => !newTextAll.includes(n));
  check('3. Все текстовые блоки исходника сохранены', lostNodes.length === 0,
    lostNodes.length ? 'НЕ НАЙДЕНЫ: ' + lostNodes.slice(0, 5).join(' || ') : [...new Set(nodes)].length + ' текстовых блоков сверено');

  const critical = [
    'Токтогулова', 'Самара Ташбаевна', '+996 220 095 297', '1000', 'сом / час',
    'Айгерим', 'Нургуль', 'Бектур', 'IELTS 7.5', 'Мама ученицы 12 лет', 'Предприниматель',
    '10+', '300+', '100%', 'лет опыта', 'учеников', 'индивидуально',
    'Бесплатно', 'Договорная', '8 занятий в месяц со скидкой', '60 минут', 'Онлайн и офлайн',
    'Ежедневно с 9:00 до 20:00', 'CELTA/TEFL', 'более 10 лет',
    'Готовилась к IELTS три месяца', 'Дочь занимается уже год', 'Нужен был разговорный английский'
  ];
  const missingCritical = critical.filter(c => !html.includes(c));
  check('3. Ключевые факты (имя/телефон/цена/отзывы/цифры)', missingCritical.length === 0, missingCritical.join(', ') || 'все ' + critical.length + ' на месте');

  // 3c. Видимая цена в блоке «Цены» идентична исходной
  const origPriceCard = original.match(/<div class="price">[\s\S]*?<\/div>/g) || [];
  const newPriceCard = html.match(/<div class="price">[\s\S]*?<\/div>/g) || [];
  check('3. Блоки цен не изменены', JSON.stringify(origPriceCard) === JSON.stringify(newPriceCard) && origPriceCard.length === 3,
    'исходник: ' + origPriceCard.join(' | ') + ' → новый: ' + newPriceCard.join(' | '));

  // 3d. Тексты отзывов и цитаты побайтово совпадают
  const origQuotes = original.match(/<p class="quote">[\s\S]*?<\/p>/g) || [];
  const newQuotes = html.match(/<p class="quote">[\s\S]*?<\/p>/g) || [];
  check('3. Тексты отзывов не изменены', JSON.stringify(origQuotes) === JSON.stringify(newQuotes) && origQuotes.length === 3);
} else {
  check('3. Сверка с git HEAD', false, 'не удалось получить исходник из git');
}

/* ---------- 4. Внутренние якоря ---------- */
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]));
const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(x => x[1]);
const missingAnchors = [...new Set(anchors)].filter(a => !ids.has(a));
check('4. Все внутренние якоря ведут на существующие id', missingAnchors.length === 0, missingAnchors.join(', ') || [...new Set(anchors)].join(', '));
['about', 'services', 'prices', 'reviews', 'contact'].forEach(id => check('4. Якорь #' + id, ids.has(id)));
// уникальность id
const allIds = [...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]);
const dupIds = allIds.filter((v, i) => allIds.indexOf(v) !== i);
check('4. Нет дубликатов id', dupIds.length === 0, dupIds.join(', '));
// уникальность id градиентов
const gradIds = [...html.matchAll(/<(?:linear|radial)Gradient id="([^"]+)"/g)].map(x => x[1]);
check('4. id градиентов уникальны и с префиксом', new Set(gradIds).size === gradIds.length && gradIds.every(g => /^(favA|hero|aboutMono)/.test(g)), gradIds.join(', '));

/* ---------- 5. Нет внешних ресурсов ---------- */
const urlMatches = html.match(/(?:https?:\/\/[^\s"'<>)]+)/g) || [];
const allowed = url => url.startsWith('https://wa.me/996220095297') ||
  url.startsWith('https://tokerjum-stack.github.io/english-tutor/');
const badUrls = [...new Set(urlMatches)].filter(u => !allowed(u));
check('5. Только разрешённые http(s)-строки', badUrls.length === 0, badUrls.join(' | ') || 'найдено ' + new Set(urlMatches).size + ' шт., все разрешённые');
check('5. Нет протокол-относительных //внешних ссылок', !/(?:src|href)\s*=\s*"\/\//i.test(html));
check('5. Нет <img>, <iframe>, <link rel=stylesheet>, @import, fetch, localStorage',
  !/<img\b/i.test(html) && !/<iframe\b/i.test(html) && !/rel="stylesheet"/i.test(html) && !/@import/i.test(html) && !/fetch\s*\(/.test(html) && !/localStorage|sessionStorage/.test(html) && !/XMLHttpRequest/.test(html));
check('5. Нет ссылок на VK/social', !/vk\.com|instagram|facebook|t\.me/i.test(html));
check('5. Все SVG инлайн (нет data:image/png, base64 растров)', !/data:image\/(?!svg)/i.test(html));
check('5. У инлайновых SVG есть viewBox', (html.match(/<svg\b(?![^>]*viewBox)/g) || []).length === 0,
  (html.match(/<svg\b(?![^>]*viewBox)/g) || []).length + ' без viewBox');

/* ---------- 6. wa.me собирается корректно (реальный код из файла) ---------- */
const codeStart = html.indexOf('var comment = commentEl.value');
const codeEnd = html.indexOf('var url = WA_BASE + encodeURIComponent(text);');
check('6. Код сборки сообщения найден в файле', codeStart > -1 && codeEnd > codeStart);
if (codeStart > -1 && codeEnd > codeStart) {
  const snippet = html.slice(codeStart, codeEnd + 'var url = WA_BASE + encodeURIComponent(text);'.length);
  const sampleComment = 'Удобно после 18:00, "срочно" & 100% — да!';
  const fn = new Function('name', 'goalEl', 'timeEl', 'commentEl', 'WA_BASE', snippet + ' return url;');
  const url = fn('Айгерим', { value: 'Подготовка к экзаменам (IELTS / TOEFL)' }, { value: 'Вечер' }, { value: sampleComment }, 'https://wa.me/996220095297?text=');
  check('6. Ссылка начинается с wa.me', url.startsWith('https://wa.me/996220095297?text='), url.slice(0, 42) + '…');
  check('6. В ссылке нет сырых пробелов и «#»', !/\s/.test(url) && !url.includes('#'));
  const decoded = decodeURIComponent(url.split('?text=')[1]);
  check('6. Кириллица кодируется и декодируется верно',
    decoded === 'Здравствуйте! Хочу записаться на занятие. Имя: Айгерим. Цель: Подготовка к экзаменам (IELTS / TOEFL). Удобное время: Вечер. Комментарий: ' + sampleComment,
    decoded);
  check('6. Пробел именно %20', url.includes('%20'));
  // план ссылки без текста
  check('6. Кнопки WhatsApp ведут на wa.me/996220095297', (html.match(/https:\/\/wa\.me\/996220095297/g) || []).length >= 5,
    (html.match(/https:\/\/wa\.me\/996220095297/g) || []).length + ' вхождений');
}

/* ---------- SEO ---------- */
check('SEO. favicon data:image/svg+xml', /rel="icon"[^>]*data:image\/svg\+xml,/.test(html));
check('SEO. canonical', html.includes('<link rel="canonical" href="https://tokerjum-stack.github.io/english-tutor/">'));
['og:title', 'og:description', 'og:type', 'og:locale', 'og:url'].forEach(p => check('SEO. ' + p, html.includes('property="' + p + '"')));
check('SEO. og:locale = ru_RU', /og:locale" content="ru_RU"/.test(html));
['twitter:card', 'twitter:title', 'twitter:description'].forEach(p => check('SEO. ' + p, html.includes('name="' + p + '"')));
check('SEO. twitter:card=summary', /twitter:card" content="summary"/.test(html));
check('SEO. theme-color', /name="theme-color" content="#5b9bd5"/.test(html));
check('SEO. JSON-LD Person', /"@type": "Person"/.test(html) && html.includes('"jobTitle": "Репетитор английского языка"'));
check('SEO. JSON-LD knowsLanguage', /"knowsLanguage"/.test(html));
check('SEO. JSON-LD Offer 1000 KGS', /"price": "1000"/.test(html) && /"priceCurrency": "KGS"/.test(html));
const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
let ldOk = false, ldErr = '';
try { const o = JSON.parse(ldMatch[1]); ldOk = o['@context'] === 'https://schema.org' && o['@type'] === 'Person' && o.makesOffer.price === '1000'; }
catch (e) { ldErr = e.message; }
check('SEO. JSON-LD — валидный JSON и @context читается как schema.org', ldOk, ldErr);

/* ---------- Форма ---------- */
check('Форма. Есть поля имя/цель/время/комментарий', ['id="f-name"', 'id="f-goal"', 'id="f-time"', 'id="f-comment"'].every(s => html.includes(s)));
['Разговорный английский', 'Подготовка к экзаменам (IELTS / TOEFL)', 'Бизнес-английский', 'Английский для путешествий', 'Английский для ребёнка', 'Другое']
  .forEach(g => check('Форма. Цель: ' + g, html.includes('>' + g + '</option>')));
check('Форма. Выбор времени утро/день/вечер', ['value="Утро"', 'value="День"', 'value="Вечер"'].every(s => html.includes(s)));
check('Форма. Валидация имени (< 2 символов)', /name\.length < 2/.test(html) && html.includes('Введите имя — минимум 2 символа.'));
check('Форма. Валидация цели', /if \(!goalEl\.value\)/.test(html) && html.includes('Выберите цель занятий из списка.'));
check('Форма. Ошибки под полем, role=alert', (html.match(/class="err" id="err-/g) || []).length === 2 && /id="err-name" role="alert"/.test(html));
check('Форма. aria-invalid проставляется', /setAttribute\('aria-invalid'/.test(html));
check('Форма. novalidate + preventDefault (ничего не уходит на сервер)', /novalidate/.test(html) && /e\.preventDefault\(\)/.test(html));
check('Форма. Нет action/method на сервер', !/<form[^>]*(action|method)=/.test(html));

/* ---------- Мобильная панель / доступность ---------- */
check('Моб. Нижняя панель существует', /class="mobile-bar"/.test(html));
check('Моб. Панель только <=820px (display:none по умолчанию)', /\.mobile-bar\{display:none\}/.test(html) && /@media \(max-width:820px\)[\s\S]*?\.mobile-bar\{/.test(html));
check('Моб. В панели tel: и wa.me', /class="mobile-bar"[\s\S]*?href="tel:\+996220095297"[\s\S]*?https:\/\/wa\.me\/996220095297/.test(html));
check('Моб. Отступ у подвала под панель', /footer\{padding-bottom:104px\}/.test(html));
check('Моб. Меню-бургер не тронуто', /\.nav-links\.open\{transform:translateX\(0\)\}/.test(html) && /id="burger"/.test(html));
check('Дост. burger: aria-expanded/aria-label/aria-controls', /id="burger"[\s\S]{0,200}aria-label="Открыть меню"[\s\S]{0,200}aria-expanded="false"[\s\S]{0,200}aria-controls="navLinks"/.test(html));
check('Дост. :focus-visible с обводкой', /:focus-visible\{outline:3px solid var\(--blue-dark\)/.test(html));
const h1s = (html.match(/<h1\b/g) || []).length;
check('Дост. Ровно один h1', h1s === 1, 'h1: ' + h1s);
const heads = [...html.matchAll(/<h([1-6])\b/g)].map(x => +x[1]);
let orderOk = true, prev = 1;
for (const h of heads) { if (h > prev + 1) { orderOk = false; break; } prev = h; }
check('Дост. Заголовки по порядку без пропусков', orderOk, 'последовательность: ' + heads.join(''));
check('Дост. prefers-reduced-motion', /@media \(prefers-reduced-motion:reduce\)/.test(html));
check('Мелочи. Год в подвале через JS', /id="year">2024<\/span>/.test(html) && /yearEl\.textContent = String\(new Date\(\)\.getFullYear\(\)\)/.test(html));
check('Мелочи. Палитра не изменена', ['--blue:#5b9bd5', '--blue-dark:#3f7bb0', '--mint:#b9e4d0', '--bg:#f6fbfc'].every(s => html.replace(/\s/g, '').includes(s.replace(/\s/g, ''))));
check('Мелочи. Нет внешних шрифтов', !/fonts\.googleapis|@font-face/i.test(html));
check('Мелочи. Все разделы на месте', ['id="top"', 'id="about"', 'id="services"', 'id="prices"', 'id="reviews"', 'id="contact"', '<footer>'].every(s => html.includes(s)));
check('Мелочи. Иконки услуг — SVG вместо эмодзи', !/📘|💬|🎓|✈️/.test(html) && (html.match(/class="icon c[1-4]" aria-hidden="true"/g) || []).length === 4);

console.log('\n=== OK (' + ok.length + ') ===');
ok.forEach(s => console.log('  ✓ ' + s));
if (fail.length) {
  console.log('\n=== ПРОБЛЕМЫ (' + fail.length + ') ===');
  fail.forEach(s => console.log('  ✗ ' + s));
}
console.log('\nИТОГ: ' + (fail.length ? 'ЕСТЬ ПРОБЛЕМЫ — ' + fail.length : 'все проверки пройдены'));
process.exit(fail.length ? 1 : 0);
