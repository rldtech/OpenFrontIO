import { consolex } from "../Consolex";
import {
  Execution,
  Game,
  MessageType,
  Player,
  TerraNullius,
  Unit,
  UnitType,
} from "../game/Game";
import { TileRef } from "../game/GameMap";
import { PathFindResultType } from "../pathfinding/AStar";
import { PathFinder } from "../pathfinding/PathFinding";
import { AttackExecution } from "./AttackExecution";

export class TransportShipExecution implements Execution {
  private lastMove: number;

  // TODO: make this configurable
  private ticksPerMove = 1;

  private mg: Game;
  private target: Player | TerraNullius;

  // TODO make private
  public path: TileRef[];
  private dst: TileRef | null;

  private pathFinder: PathFinder;

  constructor(private ship: Unit) {}

  activeDuringSpawnPhase(): boolean {
    return false;
  }

  init(mg: Game, ticks: number) {
    this.lastMove = ticks;
    this.mg = mg;
    this.pathFinder = PathFinder.Mini(mg, 10_000, 10);

    this.target = this.mg.owner(this.ship.moveTarget());

    // Notify the target player about the incoming naval invasion
    if (this.ship.moveTarget()) {
      mg.displayMessage(
        `Naval invasion incoming from ${this.ship.owner().displayName()}`,
        MessageType.WARN,
        this.target.id(),
      );
    }

    if (
      this.ship.owner().units(UnitType.TransportShip).length >=
      mg.config().boatMaxNumber()
    ) {
      mg.displayMessage(
        `No boats available, max ${mg.config().boatMaxNumber()}`,
        MessageType.WARN,
        this.ship.owner().id(),
      );
      return;
    }
  }

  tick(ticks: number) {
    if (ticks - this.lastMove < this.ticksPerMove) {
      return;
    }
    this.lastMove = ticks;

    const result = this.pathFinder.nextTile(this.ship.tile(), this.dst);
    switch (result.type) {
      case PathFindResultType.Completed:
        if (this.mg.owner(this.dst) == this.ship.owner()) {
          this.ship.owner().addTroops(this.ship.troops());
          this.ship.delete(false);
          return;
        }
        if (
          this.target.isPlayer() &&
          this.ship.owner().isFriendly(this.target)
        ) {
          this.target.addTroops(this.ship.troops());
        } else {
          this.ship.owner().conquer(this.dst);
          this.mg.addExecution(
            new AttackExecution(
              this.ship.troops(),
              this.ship.owner().id(),
              this.target.id(),
              this.dst,
              false,
            ),
          );
        }
        this.ship.delete(false);
        return;
      case PathFindResultType.NextTile:
        this.ship.move(result.tile);
        break;
      case PathFindResultType.Pending:
        break;
      case PathFindResultType.PathNotFound:
        // TODO: add to poisoned port list
        consolex.warn(`path not found tot dst`);
        this.ship.delete(false);
        return;
    }
  }

  owner(): Player {
    return null;
  }

  isActive(): boolean {
    return this.ship.isActive();
  }
}
