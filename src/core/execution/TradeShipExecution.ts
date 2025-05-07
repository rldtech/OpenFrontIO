import { renderNumber } from "../../client/Utils";
import { consolex } from "../Consolex";
import { Execution, Game, MessageType, Player, PlayerID } from "../game/Game";
import { TileRef } from "../game/GameMap";
import { Port, Unit, UnitType } from "../game/Unit";
import { PathFindResultType } from "../pathfinding/AStar";
import { PathFinder } from "../pathfinding/PathFinding";
import { distSortUnit } from "../Util";

export class TradeShipExecution implements Execution {
  private active = true;
  private mg: Game;
  private origOwner: Player;
  private tradeShip: Unit<UnitType.TradeShip>;
  private index = 0;
  private wasCaptured = false;

  constructor(
    private _owner: PlayerID,
    private srcPort: Port,
    private _dstPort: Port,
    private pathFinder: PathFinder,
  ) {}

  init(mg: Game, ticks: number): void {
    this.mg = mg;
    this.origOwner = mg.player(this._owner);
  }

  tick(ticks: number): void {
    if (this.tradeShip == null) {
      const spawn = this.origOwner.canBuild(
        UnitType.TradeShip,
        this.srcPort.tile(),
      );
      if (spawn == false) {
        consolex.warn(`cannot build trade ship`);
        this.active = false;
        return;
      }
      this.tradeShip = this.origOwner.buildUnit(spawn, {
        type: UnitType.TradeShip,
        srcPort: this.srcPort,
        dstPort: this._dstPort,
        lastSetSafeFromPirates: ticks,
      });
    }

    if (!this.tradeShip.isActive()) {
      this.active = false;
      return;
    }

    if (this.origOwner != this.tradeShip.owner()) {
      // Store as variable in case ship is recaptured by previous owner
      this.wasCaptured = true;
    }

    // If a player captures another player's port while trading we should delete
    // the ship.
    if (this._dstPort.owner().id() == this.srcPort.owner().id()) {
      this.tradeShip.delete(false);
      this.active = false;
      return;
    }

    if (
      !this.wasCaptured &&
      (!this._dstPort.isActive() ||
        !this.tradeShip.owner().canTrade(this._dstPort.owner()))
    ) {
      this.tradeShip.delete(false);
      this.active = false;
      return;
    }

    if (this.wasCaptured) {
      const ports = this.tradeShip
        .owner()
        .units(UnitType.Port)
        .sort(distSortUnit(this.mg, this.tradeShip));
      if (ports.length == 0) {
        this.tradeShip.delete(false);
        this.active = false;
        return;
      } else {
        this._dstPort = ports[0];
        this.tradeShip.dstPort = this._dstPort;
      }
    }

    const result = this.pathFinder.nextTile(
      this.tradeShip.tile(),
      this._dstPort.tile(),
    );

    switch (result.type) {
      case PathFindResultType.Completed:
        this.complete();
        break;
      case PathFindResultType.Pending:
        // Fire unit event to rerender.
        this.tradeShip.move(this.tradeShip.tile());
        break;
      case PathFindResultType.NextTile:
        // Update safeFromPirates status
        if (this.mg.isWater(result.tile) && this.mg.isShoreline(result.tile)) {
          this.tradeShip.lastSetSafeFromPirates = ticks;
        }
        this.tradeShip.move(result.tile);
        break;
      case PathFindResultType.PathNotFound:
        consolex.warn("captured trade ship cannot find route");
        if (this.tradeShip.isActive()) {
          this.tradeShip.delete(false);
        }
        this.active = false;
        break;
    }
  }

  private complete() {
    this.active = false;
    this.tradeShip.delete(false);
    const gold = this.mg
      .config()
      .tradeShipGold(
        this.mg.manhattanDist(this.srcPort.tile(), this._dstPort.tile()),
      );

    if (this.wasCaptured) {
      this.tradeShip.owner().addGold(gold);
      this.mg.displayMessage(
        `Received ${renderNumber(gold)} gold from ship captured from ${this.origOwner.displayName()}`,
        MessageType.SUCCESS,
        this.tradeShip.owner().id(),
      );
    } else {
      this.srcPort.owner().addGold(gold);
      this._dstPort.owner().addGold(gold);
      this.mg.displayMessage(
        `Received ${renderNumber(gold)} gold from trade with ${this.srcPort.owner().displayName()}`,
        MessageType.SUCCESS,
        this._dstPort.owner().id(),
      );
      this.mg.displayMessage(
        `Received ${renderNumber(gold)} gold from trade with ${this._dstPort.owner().displayName()}`,
        MessageType.SUCCESS,
        this.srcPort.owner().id(),
      );
    }
    return;
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }

  dstPort(): TileRef {
    return this._dstPort.tile();
  }
}
