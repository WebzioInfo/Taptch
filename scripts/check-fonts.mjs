import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../frontend/src/studio/fonts/fonts.json');
const fonts = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

function cssUrl(f) {
  if (f.source === 'fontshare' || f.url) return f.url;
  const fam = f.family.replace(/ /g, '+');
  const w = f.weights.length === 1 && f.weights[0] === 400 ? '' : ':wght@' + f.weights.join(';');
  return `https://fonts.googleapis.com/css2?family=${fam}${w}&display=swap`;
}

async function checkFont(f) {
  const url = cssUrl(f);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (res.ok) {
      console.log(`[OK]   ${f.family.padEnd(22)} (${f.source}) -> ${url}`);
      return true;
    } else {
      console.error(`[FAIL ${res.status}] ${f.family.padEnd(22)} (${f.source}) -> ${url}`);
      return false;
    }
  } catch (err) {
    console.error(`[ERROR] ${f.family.padEnd(22)} -> ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`Checking ${fonts.length} fonts from ${jsonPath}...\n`);
  let passed = 0;
  let failed = 0;

  for (const f of fonts) {
    const ok = await checkFont(f);
    if (ok) passed++;
    else failed++;
  }

  console.log(`\nResults: ${passed} OK, ${failed} FAIL out of ${fonts.length} fonts.`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
