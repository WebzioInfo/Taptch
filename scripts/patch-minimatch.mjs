// Postinstall patch for minimatch 11+ ESM export compatibility with @eslint/eslintrc
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const esmPath = path.resolve(__dirname, '../node_modules/minimatch/dist/esm/index.js');
if (fs.existsSync(esmPath)) {
  const content = fs.readFileSync(esmPath, 'utf8');
  if (!content.includes('export default minimatch')) {
    fs.appendFileSync(esmPath, '\nexport default minimatch;\n');
    console.log('[patch-minimatch] Added export default minimatch to dist/esm/index.js');
  }
}

