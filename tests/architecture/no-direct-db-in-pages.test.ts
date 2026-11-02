import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFilesRecursively(fullPath, fileList);
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('Architecture Rule: No Direct DB Import in UI Pages/Routes', () => {
  it('should not import raw "db" client directly in src/app page or layout files', () => {
    const appDir = path.resolve('src/app');
    const files = getFilesRecursively(appDir);
    const violations: { file: string; line: number; content: string }[] = [];

    for (const file of files) {
      // Exclude API route handlers or dev gallery
      if (file.includes('api') || file.includes('dev')) continue;

      const lines = fs.readFileSync(file, 'utf-8').split('\n');
      lines.forEach((line, index) => {
        if (/import\s*\{[^}]*\bdb\b[^}]*\}\s*from\s*['"]@\/db['"]/.test(line)) {
          violations.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      'Direct import of raw "db" client found in UI pages/layouts! Use domain service modules or withActor() instead.'
    ).toHaveLength(0);
  });
});

