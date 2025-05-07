import { Execution, Game, Player } from "../game/Game";
import { TileRef } from "../game/GameMap";
import { AnyUnit, Shell, UnitType } from "../game/Unit";
import { AirPathFinder } from "../pathfinding/PathFinding";
import { PseudoRandom } from "../PseudoRandom";

export class ShellExecution implements Execution {
  private active = true;
  private pathFinder: AirPathFinder;
  private shell: Shell;
  private mg: Game;
  private destroyAtTick: number = -1;

  constructor(
    private spawn: TileRef,
    private _owner: Player,
    private ownerUnit: AnyUnit,
    private target: AnyUnit,
  ) {}

  init(mg: Game, ticks: number): void {
    this.pathFinder = new AirPathFinder(mg, new PseudoRandom(mg.ticks()));
    this.mg = mg;
  }

  tick(ticks: number): void {
    if (this.shell == null) {
      this.shell = this._owner.buildUnit(this.spawn, {
        type: UnitType.Shell,
      });
    }
    if (!this.shell.isActive()) {
      this.active = false;
      return;
    }
    if (
      !this.target.isActive() ||
      this.target.owner() == this.shell.owner() ||
      (this.destroyAtTick != -1 && this.mg.ticks() >= this.destroyAtTick)
    ) {
      this.shell.delete(false);
      this.active = false;
      return;
    }

    if (this.destroyAtTick == -1 && !this.ownerUnit.isActive()) {
      this.destroyAtTick = this.mg.ticks() + this.mg.config().shellLifetime();
    }

    for (let i = 0; i < 3; i++) {
      const result = this.pathFinder.nextTile(
        this.shell.tile(),
        this.target.tile(),
      );
      if (result === true) {
        this.active = false;
        if ("health" in this.target) {
          this.target.modifyHealth(-this.effectOnTarget());
        } else {
          this.target.delete();
        }
        this.shell.delete(false);
        return;
      } else {
        this.shell.move(result);
      }
    }
  }

  private effectOnTarget(): number {
    const baseDamage: number = this.mg.config().unitInfo(UnitType.Shell).damage;
    return baseDamage;
  }

  isActive(): boolean {
    return this.active;
  }
  activeDuringSpawnPhase(): boolean {
    return false;
  }
}
