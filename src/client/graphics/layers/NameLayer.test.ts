/*
 Unit tests for NameLayer.ts
 Testing framework: Jest
*/
import NameLayer from './NameLayer';

let mockCtx: Partial<CanvasRenderingContext2D>;

beforeEach(() => {
  mockCtx = {
    measureText: jest.fn().mockReturnValue({ width: 100 }),
    fillText: jest.fn(),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('NameLayer – Initialization and getters', () => {
  it('initializes with the provided name and font settings', () => {
    const layer = new NameLayer('Alice', { fontSize: 16, fontFamily: 'Arial' });
    expect(layer.getName()).toBe('Alice');
    expect(layer.getFont()).toEqual({ fontSize: 16, fontFamily: 'Arial' });
  });
});

describe('NameLayer – Bounds calculation', () => {
  it('calculates width and height based on measureText', () => {
    const layer = new NameLayer('Bob', { fontSize: 12, fontFamily: 'Times' });
    const bounds = layer.getBounds(mockCtx as CanvasRenderingContext2D);
    expect(mockCtx.measureText).toHaveBeenCalledWith('Bob');
    expect(bounds.width).toBe(100);
    expect(bounds.height).toBeGreaterThan(0);
  });
});

describe('NameLayer – Rendering', () => {
  it('renders text at the set position', () => {
    const layer = new NameLayer('Eve', { fontSize: 14, fontFamily: 'Verdana' });
    layer.setPosition(10, 20);
    layer.render(mockCtx as CanvasRenderingContext2D);
    expect(mockCtx.fillText).toHaveBeenCalledWith('Eve', 10, 20);
  });
});

describe('NameLayer – Name updates', () => {
  it('updates the name and recalculates bounds', () => {
    const layer = new NameLayer('Old', { fontSize: 10, fontFamily: 'Helvetica' });
    layer.updateName('NewName');
    expect(layer.getName()).toBe('NewName');
    expect(mockCtx.measureText).toHaveBeenCalledWith('NewName');
  });
});

describe('NameLayer – Edge cases', () => {
  it('handles empty name string gracefully', () => {
    const layer = new NameLayer('', { fontSize: 8, fontFamily: 'Courier' });
    expect(layer.getName()).toBe('');
    const bounds = layer.getBounds(mockCtx as CanvasRenderingContext2D);
    expect(bounds.width).toBe(0);
  });

  it('throws TypeError when name is not a string', () => {
    // @ts-ignore
    expect(() => new NameLayer(null, { fontSize: 8, fontFamily: 'Courier' }))
      .toThrow(TypeError);
  });
});

afterAll(() => {
  // Global cleanup (if needed)
});