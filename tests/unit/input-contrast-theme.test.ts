import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Global Input Contrast & Theme Architecture', () => {
  const globalsCssPath = path.resolve(process.cwd(), 'src/app/globals.css');
  const inputComponentPath = path.resolve(process.cwd(), 'src/components/ui/input.tsx');
  const textareaComponentPath = path.resolve(process.cwd(), 'src/components/ui/textarea.tsx');
  const selectComponentPath = path.resolve(process.cwd(), 'src/components/ui/select.tsx');

  it('defines universal input, textarea, and select theme variables and contrast in globals.css', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');

    // Base element styles
    expect(css).toContain('input,');
    expect(css).toContain('textarea,');
    expect(css).toContain('select {');
    expect(css).toContain('color: var(--foreground);');
    expect(css).toContain('background-color: var(--card);');
    expect(css).toContain('caret-color: var(--primary);');

    // Placeholder contrast
    expect(css).toContain('input::placeholder');
    expect(css).toContain('color: var(--muted-foreground)');

    // Focus state contrast
    expect(css).toContain('input:focus');
    expect(css).toContain('color: var(--foreground)');
    expect(css).toContain('border-color: var(--ring)');
  });

  it('enforces WebKit and Chromium autofill background and text-fill color protections', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');

    // Dark / default autofill
    expect(css).toContain('input:-webkit-autofill');
    expect(css).toContain('-webkit-box-shadow: 0 0 0 1000px #141418 inset');
    expect(css).toContain('-webkit-text-fill-color: #FAFAFA');

    // Ivory light theme autofill
    expect(css).toContain('[data-theme="ivory"] input:-webkit-autofill');
    expect(css).toContain('-webkit-box-shadow: 0 0 0 1000px #FFFFFF inset');
    expect(css).toContain('-webkit-text-fill-color: #18181B');
  });

  it('enforces native select option contrast across platforms', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');

    expect(css).toContain('select option {');
    expect(css).toContain('background-color: #141418');
    expect(css).toContain('color: #FAFAFA');

    expect(css).toContain('[data-theme="ivory"] select option');
    expect(css).toContain('background-color: #FFFFFF');
    expect(css).toContain('color: #18181B');
  });

  it('verifies standard Input component enforces text-foreground and caret-primary', () => {
    const inputSrc = fs.readFileSync(inputComponentPath, 'utf8');

    expect(inputSrc).toContain('text-foreground');
    expect(inputSrc).toContain('bg-card');
    expect(inputSrc).toContain('caret-primary');
    expect(inputSrc).toContain('placeholder:text-muted-foreground');
  });

  it('verifies Textarea and Select standard components exist with proper design tokens', () => {
    const textareaSrc = fs.readFileSync(textareaComponentPath, 'utf8');
    const selectSrc = fs.readFileSync(selectComponentPath, 'utf8');

    expect(textareaSrc).toContain('text-foreground');
    expect(textareaSrc).toContain('bg-card');
    expect(textareaSrc).toContain('caret-primary');

    expect(selectSrc).toContain('text-foreground');
    expect(selectSrc).toContain('bg-card');
  });
});
