import Ajv, { ValidateFunction } from 'ajv';
import { userEventSchema, pageViewSchema, purchaseSchema } from './AnalyticsSchemas';

let ajv: Ajv;
beforeAll(() => {
  ajv = new Ajv({ allErrors: true, strict: false });
});

/** Tests for userEventSchema validation */
describe('userEventSchema validation', () => {
  let validate: ValidateFunction;

  /** Compile the userEventSchema before running tests */
  beforeAll(() => {
    validate = ajv.compile(userEventSchema);
  });

  /** Should validate a minimal valid user event object */
  it('should validate minimal valid data', () => {
    const validData = { eventType: 'click', userId: 'abc123' };
    expect(validate(validData)).toBe(true);
    expect(validate.errors).toBeNull();
  });

  /** Should fail when a required property is missing */
  it('should fail when a required property is missing', () => {
    const missingField = { eventType: 'click' };
    expect(validate(missingField)).toBe(false);
    expect(validate.errors).not.toHaveLength(0);
  });

  /** Should fail for incorrect property types */
  it('should fail for incorrect property types', () => {
    const wrongType = { eventType: 123, userId: 'abc123' };
    expect(validate(wrongType)).toBe(false);
    expect(validate.errors).not.toHaveLength(0);
  });

  /** Should fail when extra properties are present */
  it('should fail when extra properties are present', () => {
    const extraProps = { eventType: 'click', userId: 'abc123', extra: 'unexpected' };
    expect(validate(extraProps)).toBe(false);
    expect(validate.errors).not.toHaveLength(0);
  });

  /** Should handle edge cases such as empty strings */
  it('should handle edge cases (empty strings)', () => {
    const edgeCase = { eventType: '', userId: '' };
    expect(validate(edgeCase)).toBe(true);
    expect(validate.errors).toBeNull();
  });
});

/** Tests for pageViewSchema validation */
describe('pageViewSchema validation', () => {
  let validate: ValidateFunction;

  /** Compile the pageViewSchema before running tests */
  beforeAll(() => {
    validate = ajv.compile(pageViewSchema);
  });

  /** Should validate a minimal valid page view object */
  it('should validate minimal valid data', () => {
    const validData = { page: '/home', timestamp: 1627849182736 };
    expect(validate(validData)).toBe(true);
    expect(validate.errors).toBeNull();
  });

  /** Should fail when a required property is missing */
  it('should fail when a required property is missing', () => {
    const missingField = { page: '/home' };
    expect(validate(missingField)).toBe(false);
    expect(validate.errors).not.toHaveLength(0);
  });

  /** Should fail for incorrect property types */
  it('should fail for incorrect property types', () => {
    const wrongType = { page: '/home', timestamp: 'not-a-number' };
    expect(validate(wrongType)).toBe(false);
    expect(validate.errors).not.toHaveLength(0);
  });

  /** Should fail when extra properties are present */
  it('should fail when extra properties are present', () => {
    const extraProps = { page: '/home', timestamp: 1627849182736, extra: 'unexpected' };
    expect(validate(extraProps)).toBe(false);
    expect(validate.errors).not.toHaveLength(0);
  });

  /** Should handle edge cases such as zero timestamp */
  it('should handle edge cases (zero timestamp)', () => {
    const edgeCase = { page: '/home', timestamp: 0 };
    expect(validate(edgeCase)).toBe(true);
    expect(validate.errors).toBeNull();
  });
});

/** Tests for purchaseSchema validation */
describe('purchaseSchema validation', () => {
  let validate: ValidateFunction;

  /** Compile the purchaseSchema before running tests */
  beforeAll(() => {
    validate = ajv.compile(purchaseSchema);
  });

  /** Should validate a minimal valid purchase object */
  it('should validate minimal valid data', () => {
    const validData = { productId: 'sku123', amount: 19.99, currency: 'USD' };
    expect(validate(validData)).toBe(true);
    expect(validate.errors).toBeNull();
  });

  /** Should fail when a required property is missing */
  it('should fail when a required property is missing', () => {
    const missingField = { productId: 'sku123', amount: 19.99 };
    expect(validate(missingField)).toBe(false);
    expect(validate.errors).not.toHaveLength(0);
  });

  /** Should fail for incorrect property types */
  it('should fail for incorrect property types', () => {
    const wrongType = { productId: 'sku123', amount: '19.99', currency: 'USD' };
    expect(validate(wrongType)).toBe(false);
    expect(validate.errors).not.toHaveLength(0);
  });

  /** Should fail when extra properties are present */
  it('should fail when extra properties are present', () => {
    const extraProps = { productId: 'sku123', amount: 19.99, currency: 'USD', extra: 'unexpected' };
    expect(validate(extraProps)).toBe(false);
    expect(validate.errors).not.toHaveLength(0);
  });

  /** Should handle edge cases such as zero amount */
  it('should handle edge cases (zero amount)', () => {
    const edgeCase = { productId: 'sku123', amount: 0, currency: 'USD' };
    expect(validate(edgeCase)).toBe(true);
    expect(validate.errors).toBeNull();
  });
});