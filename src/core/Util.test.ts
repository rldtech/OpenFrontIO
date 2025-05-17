import { describe, test, expect } from '@jest/globals';
import { isEmpty, deepClone, merge, range } from './Util';

describe('Util module', () => {
  describe('isEmpty', () => {
    test('returns true for null and undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    test('returns true for empty strings and arrays', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
    });

    test('returns true for empty objects', () => {
      expect(isEmpty({})).toBe(true);
    });

    test('returns false for non-empty strings, arrays, and objects', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
    });

    test('returns false for numbers and booleans', () => {
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('deepClone', () => {
    test('deeply clones nested objects without referencing original', () => {
      const original = { nested: { count: 5 } };
      const copy = deepClone(original);
      copy.nested.count = 10;
      expect(original.nested.count).toBe(5);
      expect(copy).not.toBe(original);
    });

    test('correctly clones arrays', () => {
      const arr = [1, { x: 2 }];
      const arrCopy = deepClone(arr);
      expect(arrCopy).toEqual(arr);
      expect(arrCopy).not.toBe(arr);
      (arrCopy[1] as any).x = 3;
      expect((arr[1] as any).x).toBe(2);
    });

    test('returns primitives unchanged', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('text')).toBe('text');
    });
  });

  describe('merge', () => {
    test('shallowly merges two objects', () => {
      const target = { a: 1 };
      const result = merge({ ...target }, { b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    test('overwrites primitive properties', () => {
      expect(merge({ a: 1 }, { a: 3 })).toEqual({ a: 3 });
    });

    test('recursively merges nested objects', () => {
      const target = { nested: { x: 1 } };
      const source = { nested: { y: 2 } };
      const merged = merge({ ...target }, source);
      expect(merged.nested).toEqual({ x: 1, y: 2 });
    });

    test('returns target when source is undefined', () => {
      const target = { a: 1 };
      const result = merge({ ...target }, undefined as any);
      expect(result).toBe(target);
    });
  });

  describe('range', () => {
    test('generates inclusive range from start to end', () => {
      expect(range(1, 3)).toEqual([1, 2, 3]);
    });

    test('handles negative start', () => {
      expect(range(-2, 2)).toEqual([-2, -1, 0, 1, 2]);
    });

    test('returns single-element array when start equals end', () => {
      expect(range(5, 5)).toEqual([5]);
    });

    test('returns empty array when start is greater than end', () => {
      expect(range(10, 5)).toEqual([]);
    });
  });
});