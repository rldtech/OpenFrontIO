import { Execution, Game, PlayerID } from "../game/Game";

export class SetDefensivePostureExecution implements Execution {
  constructor(
    private playerID: PlayerID,
    private posture: "retreat" | "balanced" | "hold",
  ) {}

  init(mg: Game, ticks: number): void {
    const player = mg.player(this.playerID);
    if (!player) {
      console.warn(
        `SetDefensivePostureExecution: player ${this.playerID} not found`,
      );
      return;
    }

    if (!player.setDefensivePosture) {
      console.warn(
        `SetDefensivePostureExecution: setDefensivePosture not defined on player`,
      );
      return;
    }

    player.setDefensivePosture(this.posture);
  }
  tick(_ticks: number): void {
    // No-op: nothing happens over time
  }
  activeDuringSpawnPhase(): boolean {
    return false;
  }

  isActive(): boolean {
    return false; // It's a one-time effect
  }

  owner(): null {
    return null;
  }
}
