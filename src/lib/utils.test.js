import { describe, it, expect } from 'vitest';
import { detectLang, toMinutes, fromMinutes, toWebP } from './utils';

// ─── detectLang ───────────────────────────────────────────────────────────────

describe('detectLang', () => {
  it('returns ar for Arabic text', () => {
    expect(detectLang('مرحبا')).toBe('ar');
  });

  it('returns en for English text', () => {
    expect(detectLang('Hello world')).toBe('en');
  });

  it('returns ar when Arabic is mixed with English', () => {
    expect(detectLang('Hello مرحبا')).toBe('ar');
  });

  it('returns en for empty string', () => {
    expect(detectLang('')).toBe('en');
  });

  it('returns en for null or undefined', () => {
    expect(detectLang(null)).toBe('en');
    expect(detectLang(undefined)).toBe('en');
  });

  it('returns en for numbers and symbols', () => {
    expect(detectLang('12345 !@#')).toBe('en');
  });
});

// ─── toMinutes ────────────────────────────────────────────────────────────────

describe('toMinutes', () => {
  it('returns value as-is for minutes unit', () => {
    expect(toMinutes(30, 'minutes')).toBe(30);
  });

  it('converts hours to minutes', () => {
    expect(toMinutes(2, 'hours')).toBe(120);
  });

  it('converts days to minutes', () => {
    expect(toMinutes(1, 'days')).toBe(1440);
  });

  it('handles string numbers', () => {
    expect(toMinutes('3', 'hours')).toBe(180);
  });

  it('returns 0 for empty/invalid value', () => {
    expect(toMinutes('', 'hours')).toBe(0);
    expect(toMinutes(null, 'days')).toBe(0);
  });
});

// ─── fromMinutes ──────────────────────────────────────────────────────────────

describe('fromMinutes', () => {
  it('returns empty for 0 or falsy', () => {
    expect(fromMinutes(0)).toEqual({ value: '', unit: 'minutes' });
    expect(fromMinutes(null)).toEqual({ value: '', unit: 'minutes' });
  });

  it('returns minutes for non-round values', () => {
    expect(fromMinutes(45)).toEqual({ value: '45', unit: 'minutes' });
  });

  it('returns hours for exact hour multiples', () => {
    expect(fromMinutes(120)).toEqual({ value: '2', unit: 'hours' });
  });

  it('returns days for exact day multiples', () => {
    expect(fromMinutes(2880)).toEqual({ value: '2', unit: 'days' });
  });

  it('prefers days over hours when both divide evenly', () => {
    expect(fromMinutes(1440)).toEqual({ value: '1', unit: 'days' });
  });

  it('round-trips with toMinutes', () => {
    const cases = [
      { value: '30', unit: 'minutes' },
      { value: '3',  unit: 'hours'   },
      { value: '2',  unit: 'days'    },
    ];
    for (const { value, unit } of cases) {
      const mins = toMinutes(value, unit);
      expect(fromMinutes(mins)).toEqual({ value, unit });
    }
  });
});

// ─── toWebP ───────────────────────────────────────────────────────────────────

describe('toWebP', () => {
  const STORAGE_URL = 'https://abc.supabase.co/storage/v1/object/public/product-images/photo.jpg';

  it('transforms a supabase storage URL to the render endpoint', () => {
    const result = toWebP(STORAGE_URL);
    expect(result).toContain('/storage/v1/render/image/public/');
    expect(result).toContain('format=webp');
    expect(result).toContain('width=600');
  });

  it('applies custom width', () => {
    const result = toWebP(STORAGE_URL, 300);
    expect(result).toContain('width=300');
  });

  it('returns non-storage URLs unchanged', () => {
    const url = 'https://example.com/image.jpg';
    expect(toWebP(url)).toBe(url);
  });

  it('returns null/undefined unchanged', () => {
    expect(toWebP(null)).toBe(null);
    expect(toWebP(undefined)).toBe(undefined);
  });

  it('returns non-string values unchanged', () => {
    expect(toWebP(123)).toBe(123);
  });
});
