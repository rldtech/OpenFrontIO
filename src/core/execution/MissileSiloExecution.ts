import { consolex } from "../Consolex";
import { Execution, Game, Player, PlayerID } from "../game/Game";
import { TileRef } from "../game/GameMap";
import { MissileSilo, UnitType } from "../game/Unit";

export class MissileSiloExecution implements Execution {
  private active = true;
  private player: Player;
  private silo: MissileSilo;

  constructor(
    private _owner: PlayerID,
    private tile: TileRef,
  ) {}

  init(mg: Game, ticks: number): void {
    if (!mg.hasPlayer(this._owner)) {
      console.warn(`MissileSiloExecution: owner ${this._owner} not found`);
      this.active = false;
      return;
    }

    this.player = mg.player(this._owner);
  }

  tick(ticks: number): void {
    if (this.silo == null) {
      const spawn = this.player.canBuild(UnitType.MissileSilo, this.tile);
      if (spawn === false) {
        consolex.warn(
          `player ${this.player} cannot build missile silo at ${this.tile}`,
        );
        this.active = false;
        return;
      }
      this.silo = this.player.buildUnit(spawn, {
        type: UnitType.MissileSilo,
      });

      if (this.player != this.silo.owner()) {
        this.player = this.silo.owner();
      }
    }
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }
}
