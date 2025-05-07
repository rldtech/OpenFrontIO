import { Execution, Game, MessageType, Player } from "../game/Game";
import { TileRef } from "../game/GameMap";
import { AnyUnit, SAMLauncher, Unit, UnitType } from "../game/Unit";
import { AirPathFinder } from "../pathfinding/PathFinding";
import { PseudoRandom } from "../PseudoRandom";

export class SAMMissileExecution implements Execution {
  private active = true;
  private pathFinder: AirPathFinder;
  private SAMMissile: Unit<UnitType.SAMMissile>;
  private mg: Game;

  constructor(
    private spawn: TileRef,
    private _owner: Player,
    private ownerUnit: SAMLauncher,
    private target: AnyUnit,
    private speed: number = 12,
  ) {}

  init(mg: Game, ticks: number): void {
    this.pathFinder = new AirPathFinder(mg, new PseudoRandom(mg.ticks()));
    this.mg = mg;
  }

  tick(ticks: number): void {
    if (this.SAMMissile == null) {
      this.SAMMissile = this._owner.buildUnit(this.spawn, {
        type: UnitType.SAMMissile,
      });
    }
    if (!this.SAMMissile.isActive()) {
      this.active = false;
      return;
    }
    // Mirv warheads are too fast, and mirv shouldn't be stopped ever
    const nukesWhitelist = [UnitType.AtomBomb, UnitType.HydrogenBomb];
    if (
      !this.target.isActive() ||
      !this.ownerUnit.isActive() ||
      this.target.owner() == this.SAMMissile.owner() ||
      !nukesWhitelist.includes(this.target.type)
    ) {
      this.SAMMissile.delete(false);
      this.active = false;
      return;
    }
    for (let i = 0; i < this.speed; i++) {
      const result = this.pathFinder.nextTile(
        this.SAMMissile.tile(),
        this.target.tile(),
      );
      if (result === true) {
        this.mg.displayMessage(
          `Missile intercepted ${this.target.type}`,
          MessageType.SUCCESS,
          this._owner.id(),
        );
        this.active = false;
        this.target.delete();
        this.SAMMissile.delete(false);
        return;
      } else {
        this.SAMMissile.move(result);
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
