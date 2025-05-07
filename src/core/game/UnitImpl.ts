import { simpleHash, toInt, within } from "../Util";
import { MessageType, Player } from "./Game";
import { GameImpl } from "./GameImpl";
import { TileRef } from "./GameMap";
import { GameUpdateType, UnitUpdate } from "./GameUpdates";
import { PlayerImpl } from "./PlayerImpl";
import { AnyUnit, AnyUnitInfo, BaseUnit, UnitAttrs, UnitType } from "./Unit";

export class UnitImpl implements BaseUnit {
  private _active = true;
  private _lastTile: TileRef = null;

  constructor(
    private mg: GameImpl,
    private _info: AnyUnitInfo,
    private _tile: TileRef,
    private _id: number,
    public _owner: PlayerImpl,
  ) {
    this._lastTile = _tile;
  }

  attrs(): UnitAttrs {
    return this.mg.unitInfo(this._info.type);
  }

  id() {
    return this._id;
  }

  type(): UnitType {
    return this._info.type;
  }

  toUpdate(): UnitUpdate {
    return {
      type: GameUpdateType.Unit,
      unitType: this._info.type,
      unitInfo: this._info,
      id: this._id,
      ownerID: this._owner.smallID(),
      isActive: this._active,
      pos: this._tile,
      lastPos: this._lastTile,
    };
  }

  lastTile(): TileRef {
    return this._lastTile;
  }

  move(tile: TileRef): void {
    if (tile == null) {
      throw new Error("tile cannot be null");
    }
    this.mg.removeUnit(this as unknown as AnyUnit);
    this._lastTile = this._tile;
    this._tile = tile;
    this.mg.addUnit(this as unknown as AnyUnit);
    this.mg.addUpdate(this.toUpdate());
  }

  tile(): TileRef {
    return this._tile;
  }

  owner(): PlayerImpl {
    return this._owner;
  }

  setOwner(newOwner: Player): void {
    const oldOwner = this._owner;
    oldOwner._units = oldOwner._units.filter((u) => u.id() != this.id());
    this._owner = newOwner as PlayerImpl;
    this.mg.addUpdate(this.toUpdate());
    this.mg.displayMessage(
      `Your ${this._info.type} was captured by ${newOwner.displayName()}`,
      MessageType.ERROR,
      oldOwner.id(),
    );
  }

  delete(displayMessage: boolean = true): void {
    if (!this.isActive()) {
      throw new Error(`cannot delete ${this} not active`);
    }
    this._owner._units = this._owner._units.filter((b) => b.id() != this.id());
    this._active = false;
    this.mg.addUpdate(this.toUpdate());
    this.mg.removeUnit(this as unknown as AnyUnit);
    if (displayMessage && this._info.type != UnitType.MIRVWarhead) {
      this.mg.displayMessage(
        `Your ${this._info.type} was destroyed`,
        MessageType.ERROR,
        this.owner().id(),
      );
    }
  }

  isActive(): boolean {
    return this._active;
  }

  hash(): number {
    return this.tile() + simpleHash(this._info.type) * this._id;
  }

  toString(): string {
    return `Unit:${this._info.type},owner:${this.owner().name()}`;
  }

  isSafeFromPirates(): boolean {
    if (this._info.type == UnitType.TradeShip) {
      return (
        this._info.lastSetSafeFromPirates <
        this.mg.config().safeFromPiratesCooldownMax()
      );
    }
    throw Error(`isSafeFromPirates called on ${this}`);
  }

  modifyHealth(delta: number): void {
    if ("health" in this._info) {
      this._info.health = toInt(
        within(Number(this._info.health) + delta, 0, this.maxHealth()),
      );
    }
  }

  maxHealth(): number {
    return this.mg.config().unitInfo(this._info.type).maxHealth;
  }
}
