import { Execution, Game } from "../game/Game";
import { UnitType, Warship } from "../game/Unit";

export class MoveWarshipExecution implements Execution {
  private active = true;
  private mg: Game;

  constructor(
    public readonly unitId: number,
    public readonly position: number,
  ) {}

  init(mg: Game, ticks: number): void {
    this.mg = mg;
  }

  tick(ticks: number): void {
    const warship: Warship = this.mg
      .units(UnitType.Warship)
      .find((u) => u.id() == this.unitId) as Warship;
    if (!warship) {
      console.log("MoveWarshipExecution: warship is already dead");
      return;
    }
    warship.moveTarget = this.position;
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }
}
