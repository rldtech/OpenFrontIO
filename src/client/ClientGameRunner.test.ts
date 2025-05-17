import ClientGameRunner, { GameConfig, GameState } from './ClientGameRunner';

describe('ClientGameRunner', () => {
  let runner: ClientGameRunner;
  const validConfig: GameConfig = { level: 1, maxPlayers: 2 };

  beforeEach(() => {
    runner = new ClientGameRunner(validConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('constructor initializes with valid config', () => {
    const state = runner.getState();
    expect(state.status).toBe('initialized');
    expect(state.startTime).toBe(0);
  });

  test('constructor throws for negative level', () => {
    const badConfig: GameConfig = { level: -1, maxPlayers: 2 };
    expect(() => new ClientGameRunner(badConfig)).toThrow('Invalid level');
  });

  test('runGame resolves with running state', async () => {
    const result: GameState = await runner.runGame();
    expect(result.status).toBe('running');
    expect(typeof result.startTime).toBe('number');
  });

  test('emits "started" event on runGame', done => {
    runner.on('started', payload => {
      expect(payload).toHaveProperty('startTime');
      done();
    });
    runner.runGame();
  });

  describe('ticker', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    test('startTicker increments ticks every interval', () => {
      runner.startTicker(1000);
      expect(runner.getTicks()).toBe(0);
      jest.advanceTimersByTime(3000);
      expect(runner.getTicks()).toBe(3);
    });
  });

  test('off removes event listeners', () => {
    const mockCallback = jest.fn();
    runner.on('started', mockCallback);
    runner.off('started', mockCallback);
    runner.runGame();
    return new Promise(resolve => setImmediate(resolve)).then(() => {
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  test('reset resets state and ticks', () => {
    runner.startTicker(1000);
    jest.advanceTimersByTime(2000);
    expect(runner.getTicks()).toBe(2);
    runner.reset();
    expect(runner.getTicks()).toBe(0);
    const state = runner.getState();
    expect(state.status).toBe('initialized');
    expect(state.startTime).toBe(0);
  });
});