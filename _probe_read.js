/* Извлекает блок маркеров из дампа DOM (берёт последнее вхождение — реальный вывод пробы) */
const fs = require('fs');
const M = '@@' + 'PROBE' + '@@';
for (const f of process.argv.slice(2)) {
  const s = fs.readFileSync(f, 'utf8');
  const parts = s.split(M);
  console.log('\n########## ' + f.split('\\').pop() + ' ##########');
  if (parts.length < 3) { console.log('БЛОК ПРОБЫ НЕ НАЙДЕН (страница не выполнила скрипт?)'); continue; }
  console.log(parts[parts.length - 2].trim());
}
