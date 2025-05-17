import { SAMMissileExecution } from './SAMMissileExecution';
import { MissileLauncherService } from '../services/MissileLauncherService';
import { MathUtils } from '../utils/MathUtils';

jest.mock('../services/MissileLauncherService');
jest.mock('../utils/MathUtils');

describe('SAMMissileExecution', () => {
  let launcherMock: jest.Mocked<MissileLauncherService>;
  let mathUtilsMock: jest.Mocked<typeof MathUtils>;
  let executor: SAMMissileExecution;

  beforeEach(() => {
    // Obtain the mocked classes/objects
    launcherMock = new MissileLauncherService() as jest.Mocked<MissileLauncherService>;
    mathUtilsMock = MathUtils as jest.Mocked<typeof MathUtils>;

    // Reset all mock state
    jest.clearAllMocks();

    // Instantiate the class under test with mocks
    executor = new SAMMissileExecution(launcherMock, mathUtilsMock);
  });

  describe('execute()', () => {
    it('should compute trajectory and launch missile with correct parameters', async () => {
      // Arrange
      mathUtilsMock.calculateTrajectory.mockReturnValue([{ x: 0, y: 100 }]);
      launcherMock.launch.mockResolvedValue({ success: true, id: 'M-123' });

      // Act
      const result = await executor.execute({ speed: 500, angle: 45 });

      // Assert
      expect(mathUtilsMock.calculateTrajectory).toHaveBeenCalledWith(500, 45);
      expect(launcherMock.launch).toHaveBeenCalledWith([{ x: 0, y: 100 }]);
      expect(result).toEqual({ success: true, id: 'M-123' });
    });

    it('should throw an error if the launcher service fails', async () => {
      // Arrange
      mathUtilsMock.calculateTrajectory.mockReturnValue([{ x: 0, y: 100 }]);
      launcherMock.launch.mockRejectedValue(new Error('Launch failure'));

      // Act & Assert
      await expect(executor.execute({ speed: 300, angle: 30 })).rejects.toThrow('Launch failure');
    });

    it('should return a default response for zero speed', async () => {
      // Arrange
      mathUtilsMock.calculateTrajectory.mockReturnValue([]);

      // Act
      const result = await executor.execute({ speed: 0, angle: 90 });

      // Assert
      expect(result).toEqual({ success: false, reason: 'No trajectory computed' });
    });

    it('should return a default response for negative speed', async () => {
      // Arrange
      mathUtilsMock.calculateTrajectory.mockReturnValue([]);

      // Act
      const result = await executor.execute({ speed: -100, angle: 45 });

      // Assert
      expect(result).toEqual({ success: false, reason: 'No trajectory computed' });
    });
  });

  describe('computeTrajectory()', () => {
    it('should return an empty array for non-positive speed', () => {
      const path = executor.computeTrajectory(0, 60);
      expect(path).toEqual([]);
    });

    it('should throw an error for invalid angle values', () => {
      expect(() => executor.computeTrajectory(500, -5)).toThrow('Invalid angle');
      expect(() => executor.computeTrajectory(500, 190)).toThrow('Invalid angle');
    });
  });

  describe('scheduleLaunch()', () => {
    beforeAll(() => jest.useFakeTimers());
    afterAll(() => jest.useRealTimers());

    it('should schedule a delayed launch after the specified delay', () => {
      executor.scheduleLaunch({ delayMs: 5000, speed: 400, angle: 30 });
      jest.advanceTimersByTime(5000);
      expect(launcherMock.launch).toHaveBeenCalled();
    });
  });
});