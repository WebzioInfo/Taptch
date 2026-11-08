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

describe('Architecture Rule: Brand Literal Protection', () => {
  it('should not contain literal brand strings in UI components, routes, or pages outside config/seed', () => {
    const scanDirs = [
      path.resolve('src/components'),
      path.resolve('src/app/(marketing)'),
      path.resolve('src/app/(profile)'),
      path.resolve('src/app/(app)'),
    ];

    const violations: { file: string; line: number; content: string }[] = [];

    for (const dir of scanDirs) {
      const files = getFilesRecursively(dir);
      for (const file of files) {
        const lines = fs.readFileSync(file, 'utf-8').split('\n');
        lines.forEach((line, index) => {
          // Ignore comments or imports of brand config
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
          if (trimmed.includes('from') && trimmed.includes('config')) return;

          // Check if literal 'Taptch' appears hardcoded in JSX or strings (should use brandConfig)
          if (/(['"`])(TAPTCH|Taptch)\1/i.test(line) || />\s*(Taptch)\s*</i.test(line)) {
            violations.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              content: trimmed,
            });
          }
        });
      }
    }

    if (violations.length > 0) {
      console.error('Brand Literal Violations Found:', violations);
    }

    expect(
      violations,
      'Hardcoded brand literal found in UI! Use brandConfig.name from "@/config" instead.'
    ).toHaveLength(0);
  });
});

