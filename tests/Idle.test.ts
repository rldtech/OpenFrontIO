import { MarkIdleExecution } from "../src/core/execution/MarkIdleExecution";
import { SpawnExecution } from "../src/core/execution/SpawnExecution";
import { Game, Player, PlayerInfo, PlayerType } from "../src/core/game/Game";
import { setup } from "./util/Setup";
import { executeTicks } from "./util/utils";

let game: Game;
let player1: Player;
let player2: Player;

describe("Idle", () => {
  beforeEach(async () => {
    game = await setup("Plains", {
      infiniteGold: true,
      instantBuild: true,
    });

    const player1Info = new PlayerInfo(
      "us",
      "Active Player",
      PlayerType.Human,
      null,
      "player1_id",
    );

    const player2Info = new PlayerInfo(
      "fr",
      "Idle Player",
      PlayerType.Human,
      null,
      "player2_id",
    );

    player1 = game.addPlayer(player1Info);
    player2 = game.addPlayer(player2Info);

    game.addExecution(
      new SpawnExecution(player1Info, game.ref(1, 1)),
      new SpawnExecution(player2Info, game.ref(7, 7)),
    );

    while (game.inSpawnPhase()) {
      game.executeNextTick();
    }
  });

  describe("Player idle state", () => {
    test("should initialize players as not idle", () => {
      expect(player1.isIdle()).toBe(false);
      expect(player2.isIdle()).toBe(false);
    });

    test("should mark player as idle", () => {
      player1.markIdle(true);
      expect(player1.isIdle()).toBe(true);
    });

    test("should mark player as not idle", () => {
      player1.markIdle(true);
      expect(player1.isIdle()).toBe(true);

      player1.markIdle(false);
      expect(player1.isIdle()).toBe(false);
    });

    test("should include idle state in player update", () => {
      player1.markIdle(true);
      const update = player1.toUpdate();
      expect(update.isIdle).toBe(true);

      player1.markIdle(false);
      const update2 = player1.toUpdate();
      expect(update2.isIdle).toBe(false);
    });

    test("should maintain idle state independently for different players", () => {
      player1.markIdle(true);
      player2.markIdle(false);

      expect(player1.isIdle()).toBe(true);
      expect(player2.isIdle()).toBe(false);
    });
  });

  describe("MarkIdleExecution", () => {
    test("should mark player as idle when executed", () => {
      const execution = new MarkIdleExecution(player1.id(), true);
      game.addExecution(execution);

      executeTicks(game, 2);

      expect(player1.isIdle()).toBe(true);
      expect(execution.isActive()).toBe(false);
    });

    test("should mark player as not idle when executed", () => {
      // First mark as idle directly
      player1.markIdle(true);
      expect(player1.isIdle()).toBe(true);

      // Then mark as not idle via execution
      const execution = new MarkIdleExecution(player1.id(), false);
      game.addExecution(execution);

      executeTicks(game, 2);

      expect(player1.isIdle()).toBe(false);
      expect(execution.isActive()).toBe(false);
    });

    test("should handle multiple players with different idle states", () => {
      const execution1 = new MarkIdleExecution(player1.id(), true);
      const execution2 = new MarkIdleExecution(player2.id(), false);

      game.addExecution(execution1, execution2);
      executeTicks(game, 2);

      expect(player1.isIdle()).toBe(true);
      expect(player2.isIdle()).toBe(false);
      expect(execution1.isActive()).toBe(false);
      expect(execution2.isActive()).toBe(false);
    });

    test("should handle invalid player ID gracefully", () => {
      const execution = new MarkIdleExecution("invalid_player_id", true);
      game.addExecution(execution);

      // Should not throw and should deactivate
      expect(() => game.executeNextTick()).not.toThrow();
      expect(execution.isActive()).toBe(false);
    });

    test("should not be active during spawn phase", () => {
      const execution = new MarkIdleExecution(player1.id(), true);
      expect(execution.activeDuringSpawnPhase()).toBe(false);
    });

    test("should handle rapid idle state changes", () => {
      // Mark idle
      const execution1 = new MarkIdleExecution(player1.id(), true);
      game.addExecution(execution1);
      executeTicks(game, 2);
      expect(player1.isIdle()).toBe(true);

      // Mark not idle
      const execution2 = new MarkIdleExecution(player1.id(), false);
      game.addExecution(execution2);
      executeTicks(game, 2);
      expect(player1.isIdle()).toBe(false);

      // Mark idle again
      const execution3 = new MarkIdleExecution(player1.id(), true);
      game.addExecution(execution3);
      executeTicks(game, 2);
      expect(player1.isIdle()).toBe(true);
    });

    test("should execute properly with other executions in same tick", () => {
      const markIdleExecution = new MarkIdleExecution(player1.id(), true);
      const markIdleExecution2 = new MarkIdleExecution(player2.id(), false);

      game.addExecution(markIdleExecution, markIdleExecution2);

      // Execute multiple ticks to ensure all executions complete
      executeTicks(game, 2);

      expect(player1.isIdle()).toBe(true);
      expect(player2.isIdle()).toBe(false);
      expect(markIdleExecution.isActive()).toBe(false);
      expect(markIdleExecution2.isActive()).toBe(false);
    });
  });

  describe("Idle state persistence", () => {
    test("should maintain idle state across game ticks", () => {
      player1.markIdle(true);

      // Execute several ticks
      executeTicks(game, 5);

      // Idle state should persist
      expect(player1.isIdle()).toBe(true);
    });

    test("should maintain idle state in player updates", () => {
      player1.markIdle(true);

      // Execute some ticks and check update still shows idle
      executeTicks(game, 3);

      const update = player1.toUpdate();
      expect(update.isIdle).toBe(true);
    });

    test("should handle execution during different game phases", () => {
      // Test that idle execution works outside spawn phase
      expect(game.inSpawnPhase()).toBe(false);

      const execution = new MarkIdleExecution(player1.id(), true);
      game.addExecution(execution);
      executeTicks(game, 2);

      expect(player1.isIdle()).toBe(true);
      expect(execution.isActive()).toBe(false);
    });
  });

  describe("Edge cases", () => {
    test("should handle marking same idle state multiple times", () => {
      // Mark idle multiple times
      player1.markIdle(true);
      player1.markIdle(true);
      player1.markIdle(true);

      expect(player1.isIdle()).toBe(true);

      // Mark not idle multiple times
      player1.markIdle(false);
      player1.markIdle(false);
      player1.markIdle(false);

      expect(player1.isIdle()).toBe(false);
    });

    test("should handle execution with same idle state", () => {
      // Start with player idle
      player1.markIdle(true);
      expect(player1.isIdle()).toBe(true);

      // Execute with same idle state
      const execution = new MarkIdleExecution(player1.id(), true);
      game.addExecution(execution);
      executeTicks(game, 2);

      expect(player1.isIdle()).toBe(true);
      expect(execution.isActive()).toBe(false);
    });

    test("should handle missing player during execution init", () => {
      const execution = new MarkIdleExecution("nonexistent_player", true);

      // Mock console.warn to verify it's called
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      game.addExecution(execution);
      executeTicks(game, 2);

      expect(execution.isActive()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "MarkIdleExecution: player nonexistent_player not found",
        ),
      );

      consoleSpy.mockRestore();
    });

    test("should handle multiple executions for same player", () => {
      const execution1 = new MarkIdleExecution(player1.id(), true);
      const execution2 = new MarkIdleExecution(player1.id(), false);

      game.addExecution(execution1, execution2);
      executeTicks(game, 2);

      // Last execution should win
      expect(player1.isIdle()).toBe(false);
      expect(execution1.isActive()).toBe(false);
      expect(execution2.isActive()).toBe(false);
    });
  });
});
