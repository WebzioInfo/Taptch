import { describe, it, expect } from 'vitest';
import { evaluatePasswordStrength } from '@/components/ui/confirm-password-input';

describe('Common Interactions & Product Experience Logic', () => {
  describe('Password Strength Calculator', () => {
    it('returns score 0 (Too weak) for empty or short password', () => {
      const res = evaluatePasswordStrength('');
      expect(res.score).toBe(0);
      expect(res.label).toBe('Too weak');

      const shortRes = evaluatePasswordStrength('abc');
      expect(shortRes.score).toBe(0);
      expect(shortRes.label).toBe('Too weak');
    });

    it('returns weak score for simple passwords under 8 characters', () => {
      const res = evaluatePasswordStrength('abcdef');
      expect(res.score).toBe(1);
      expect(res.label).toBe('Weak');
      expect(res.hasMinLength).toBe(false);
    });

    it('scores higher for 8+ chars with uppercase, numbers, and symbols', () => {
      const fair = evaluatePasswordStrength('abcdefgh1');
      expect(fair.score).toBeGreaterThanOrEqual(2);

      const strong = evaluatePasswordStrength('SuperSecure#2026!');
      expect(strong.score).toBe(4);
      expect(strong.label).toBe('Strong');
      expect(strong.hasMinLength).toBe(true);
      expect(strong.hasUppercase).toBe(true);
      expect(strong.hasNumberOrSymbol).toBe(true);
    });

    it('identifies missing criteria accurately', () => {
      const noUpper = evaluatePasswordStrength('lowercase123#');
      expect(noUpper.hasUppercase).toBe(false);
      expect(noUpper.hasNumberOrSymbol).toBe(true);
      expect(noUpper.hasMinLength).toBe(true);

      const noSymbolOrNumber = evaluatePasswordStrength('Uppercases');
      expect(noSymbolOrNumber.hasNumberOrSymbol).toBe(false);
      expect(noSymbolOrNumber.hasUppercase).toBe(true);
    });
  });

  describe('Pagination Logic', () => {
    function computePagination(totalItems: number, currentPage: number, pageSize: number) {
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const page = Math.max(1, Math.min(currentPage, totalPages));
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, totalItems);
      const startItem = totalItems === 0 ? 0 : startIndex + 1;
      const endItem = endIndex;
      return { totalPages, page, startItem, endItem, hasNext: page < totalPages, hasPrev: page > 1 };
    }

    it('calculates page 1 of multi-page list correctly', () => {
      const res = computePagination(25, 1, 10);
      expect(res.totalPages).toBe(3);
      expect(res.page).toBe(1);
      expect(res.startItem).toBe(1);
      expect(res.endItem).toBe(10);
      expect(res.hasNext).toBe(true);
      expect(res.hasPrev).toBe(false);
    });

    it('calculates last page slice correctly', () => {
      const res = computePagination(25, 3, 10);
      expect(res.page).toBe(3);
      expect(res.startItem).toBe(21);
      expect(res.endItem).toBe(25);
      expect(res.hasNext).toBe(false);
      expect(res.hasPrev).toBe(true);
    });

    it('handles empty items without negative indices', () => {
      const res = computePagination(0, 1, 10);
      expect(res.totalPages).toBe(1);
      expect(res.page).toBe(1);
      expect(res.startItem).toBe(0);
      expect(res.endItem).toBe(0);
      expect(res.hasNext).toBe(false);
      expect(res.hasPrev).toBe(false);
    });

    it('clamps out-of-range page requests', () => {
      const res = computePagination(10, 99, 10);
      expect(res.page).toBe(1);
    });
  });

  describe('Status Normalization Logic', () => {
    function getStatusCategory(status: string): 'positive' | 'warning' | 'destructive' | 'neutral' {
      const s = status.toLowerCase();
      if (['active', 'published', 'paid', 'paid_offline', 'approved', 'delivered', 'shipped'].includes(s)) {
        return 'positive';
      }
      if (['draft', 'pending', 'pending_publication', 'in_production', 'qc', 'requested'].includes(s)) {
        return 'warning';
      }
      if (['suspended', 'cancelled', 'rejected', 'unpaid', 'disabled', 'revoked'].includes(s)) {
        return 'destructive';
      }
      return 'neutral';
    }

    it('maps live and active states to positive', () => {
      expect(getStatusCategory('active')).toBe('positive');
      expect(getStatusCategory('published')).toBe('positive');
      expect(getStatusCategory('PAID')).toBe('positive');
      expect(getStatusCategory('shipped')).toBe('positive');
    });

    it('maps drafting and pending review states to warning', () => {
      expect(getStatusCategory('draft')).toBe('warning');
      expect(getStatusCategory('pending_publication')).toBe('warning');
      expect(getStatusCategory('in_production')).toBe('warning');
      expect(getStatusCategory('qc')).toBe('warning');
    });

    it('maps cancelled, suspended, and unpaid to destructive', () => {
      expect(getStatusCategory('suspended')).toBe('destructive');
      expect(getStatusCategory('cancelled')).toBe('destructive');
      expect(getStatusCategory('unpaid')).toBe('destructive');
      expect(getStatusCategory('rejected')).toBe('destructive');
    });
  });

  describe('Search Query Filtering', () => {
    const dataset = [
      { id: '1', name: 'Aditya Sharma', email: 'aditya@example.com', role: 'owner' },
      { id: '2', name: 'Priya Patel', email: 'priya@apex.in', role: 'manager' },
      { id: '3', name: 'Rohan Mehta', email: 'rohan@taptch.com', role: 'staff' },
    ];

    function filterRecords<T extends { name: string; email: string; role: string }>(items: T[], query: string) {
      if (!query.trim()) return items;
      const q = query.toLowerCase();
      return items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.role.toLowerCase().includes(q)
      );
    }

    it('returns full dataset on empty query', () => {
      expect(filterRecords(dataset, '')).toHaveLength(3);
      expect(filterRecords(dataset, '   ')).toHaveLength(3);
    });

    it('filters by case-insensitive name substring', () => {
      const results = filterRecords(dataset, 'aditya');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('filters by email domain', () => {
      const results = filterRecords(dataset, 'apex.in');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Priya Patel');
    });

    it('filters by role', () => {
      const staffResults = filterRecords(dataset, 'staff');
      expect(staffResults).toHaveLength(1);
      expect(staffResults[0].id).toBe('3');
    });

    it('returns empty array when no match found', () => {
      expect(filterRecords(dataset, 'nonexistent')).toHaveLength(0);
    });
  });
});
