// Генератор строк для index.html (удаляется после сборки)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img"><defs><linearGradient id="favA-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b9bd5"/><stop offset="1" stop-color="#3f7bb0"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#favA-grad)"/><path d="M18 47 L32 16 L46 47" fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M24.5 37.5 H39.5" fill="none" stroke="#b9e4d0" stroke-width="5.5" stroke-linecap="round"/></svg>`;

const faviconDataUri = 'data:image/svg+xml,' + encodeURIComponent(faviconSvg);

const defaultMsg = 'Здравствуйте! Хочу записаться на пробное занятие английского.';
const defaultLink = 'https://wa.me/996220095297?text=' + encodeURIComponent(defaultMsg);

// Пример текста из формы (проверка пункта 6 брифа)
const sampleMsg = 'Здравствуйте! Хочу записаться на занятие. Имя: Айгерим. Цель: Подготовка к экзаменам (IELTS / TOEFL). Удобное время: Вечер. Комментарий: Удобно после 18:00, "срочно" & 100%.';
const sampleLink = 'https://wa.me/996220095297?text=' + encodeURIComponent(sampleMsg);

console.log('--- FAVICON URI ---');
console.log(faviconDataUri);
console.log('LEN', faviconDataUri.length);
console.log('--- DEFAULT WA LINK ---');
console.log(defaultLink);
console.log('--- SAMPLE WA LINK ---');
console.log(sampleLink);
console.log('--- ROUNDTRIP ---');
const decFav = decodeURIComponent(faviconDataUri.slice('data:image/svg+xml,'.length));
console.log('favicon roundtrip ok:', decFav === faviconSvg, '| has xmlns:', /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(decFav));
const decMsg = decodeURIComponent(sampleLink.slice('https://wa.me/996220095297?text='.length));
console.log('msg roundtrip ok:', decMsg === sampleMsg);
console.log('decoded msg:', decMsg);
console.log('has raw space in link:', /\s/.test(sampleLink), '| has raw # :', sampleLink.includes('#'));
console.log('favicon contains literal http:// :', faviconDataUri.includes('http://') || faviconDataUri.includes('https://'));
