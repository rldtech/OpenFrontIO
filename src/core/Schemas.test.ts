// Testing framework: Jest
import { describe, test, expect } from '@jest/globals';
import { ZodError } from 'zod';
import {
  UserSchema,
  ProductSchema,
  OrderSchema,
} from './Schemas';

describe('Schemas module', () => {
  describe('UserSchema', () => {
    test('should parse a valid user object', () => {
      const validUser = {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
      };
      expect(() => UserSchema.parse(validUser)).not.toThrow();
      const parsed = UserSchema.parse(validUser);
      expect(parsed).toEqual(validUser);
    });

    test('should throw ZodError when required fields are missing', () => {
      const invalidUser = { name: 'Bob' };
      expect(() => UserSchema.parse(invalidUser)).toThrow(ZodError);
    });

    test('should throw ZodError on wrong field types', () => {
      const invalidUser = {
        id: 123,
        name: true,
        email: 'not-an-email',
      };
      expect(() => UserSchema.parse(invalidUser)).toThrow(ZodError);
    });
  });

  describe('ProductSchema', () => {
    test('should parse a valid product object', () => {
      const validProduct = {
        id: 'p1',
        name: 'Widget',
        price: 10,
      };
      expect(() => ProductSchema.parse(validProduct)).not.toThrow();
      const parsed = ProductSchema.parse(validProduct);
      expect(parsed).toEqual(validProduct);
    });

    describe('ProductSchema invalid inputs', () => {
      test.each([
        [{ id: '', name: 'Widget', price: 10 }, /id.*non-empty string/],
        [{ id: 'p1', name: 'Widget', price: -5 }, /price.*greater than or equal to 0/],
      ])('input %# should throw %s', (input, expected) => {
        expect(() => ProductSchema.parse(input)).toThrowError(expected);
      });
    });
  });

  describe('OrderSchema', () => {
    test('should parse a valid order object', () => {
      const validOrder = {
        id: 'o1',
        productId: 'p1',
        quantity: 2,
      };
      expect(() => OrderSchema.parse(validOrder)).not.toThrow();
      const parsed = OrderSchema.parse(validOrder);
      expect(parsed).toEqual(validOrder);
    });

    test('should throw ZodError when required fields are missing', () => {
      const invalidOrder = { productId: 'p1' };
      expect(() => OrderSchema.parse(invalidOrder)).toThrow(ZodError);
    });

    test('should throw ZodError on wrong field types', () => {
      const invalidOrder = {
        id: 1,
        productId: 2,
        quantity: 'two',
      };
      expect(() => OrderSchema.parse(invalidOrder)).toThrow(ZodError);
    });
  });
});