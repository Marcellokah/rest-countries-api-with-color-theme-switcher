const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'index.html',
  'country.html',
  'data.json',
  'css/styles.css',
  'js/script.js'
];

let ok = true;
files.forEach(f => {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) {
    console.error('MISSING:', f);
    ok = false;
  } else {
    console.log('FOUND:', f);
  }
});

if (ok) {
  const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const checks = ['id="search"', 'id="region-filter"', 'id="countries"'];
  checks.forEach(c => {
    if (!idx.includes(c)) {
      console.error('INDEX MISSING CHECK:', c);
      ok = false;
    } else console.log('INDEX OK:', c);
  });
}

process.exit(ok ? 0 : 2);
