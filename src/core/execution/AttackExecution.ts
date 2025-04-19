import { renderNumber, renderTroops } from "../../client/Utils";
import {
  Attack,
  Execution,
  Game,
  MessageType,
  Player,
  PlayerID,
  PlayerType,
  TerrainType,
  TerraNullius,
} from "../game/Game";
import { TileRef } from "../game/GameMap";
import { PseudoRandom } from "../PseudoRandom";

const malusForRetreat = 25;

export class AttackExecution implements Execution {
  private breakAlliance = false;
  private active: boolean = true;
  private toConquer: TileRef[] = [];

  private random = new PseudoRandom(123);

  private _owner: Player;
  private tileWeights: Map<TileRef, { weight: number; ownedCount: number }> =
    new Map();
  private target: Player | TerraNullius;

  private mg: Game;

  private border = new Set<TileRef>();

  private attack: Attack = null;

  constructor(
    private startTroops: number | null = null,
    private _ownerID: PlayerID,
    private _targetID: PlayerID | null,
    private sourceTile: TileRef | null = null,
    private removeTroops: boolean = true,
  ) {}

  public targetID(): PlayerID {
    return this._targetID;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }

  init(mg: Game, ticks: number) {
    if (!this.active) {
      return;
    }
    this.mg = mg;

    if (!mg.hasPlayer(this._ownerID)) {
      console.warn(`player ${this._ownerID} not found`);
      this.active = false;
      return;
    }
    if (this._targetID != null && !mg.hasPlayer(this._targetID)) {
      console.warn(`target ${this._targetID} not found`);
      this.active = false;
      return;
    }

    this._owner = mg.player(this._ownerID);
    this.target =
      this._targetID == this.mg.terraNullius().id()
        ? mg.terraNullius()
        : mg.player(this._targetID);

    if (this.target && this.target.isPlayer()) {
      const targetPlayer = this.target as Player;
      if (
        targetPlayer.type() != PlayerType.Bot &&
        this._owner.type() != PlayerType.Bot
      ) {
        // Don't let bots embargo since they can't trade anyways.
        targetPlayer.addEmbargo(this._owner.id());
      }
    }

    if (this._owner == this.target) {
      console.error(`Player ${this._owner} cannot attack itself`);
      this.active = false;
      return;
    }

    if (
      this.target.isPlayer() &&
      this.mg.config().numSpawnPhaseTurns() +
        this.mg.config().spawnImmunityDuration() >
        this.mg.ticks()
    ) {
      console.warn("cannot attack player during immunity phase");
      this.active = false;
      return;
    }

    if (this.startTroops == null) {
      this.startTroops = this.mg
        .config()
        .attackAmount(this._owner, this.target);
    }
    if (this.removeTroops) {
      this.startTroops = Math.min(this._owner.troops(), this.startTroops);
      this._owner.removeTroops(this.startTroops);
    }
    this.attack = this._owner.createAttack(
      this.target,
      this.startTroops,
      this.sourceTile,
    );

    for (const incoming of this._owner.incomingAttacks()) {
      if (incoming.attacker() == this.target) {
        // Target has opposing attack, cancel them out
        if (incoming.troops() > this.attack.troops()) {
          incoming.setTroops(incoming.troops() - this.attack.troops());
          this.attack.delete();
          this.active = false;
          return;
        } else {
          this.attack.setTroops(this.attack.troops() - incoming.troops());
          incoming.delete();
        }
      }
    }
    for (const outgoing of this._owner.outgoingAttacks()) {
      if (
        outgoing != this.attack &&
        outgoing.target() == this.attack.target() &&
        outgoing.sourceTile() == this.attack.sourceTile()
      ) {
        // Existing attack on same target, add troops
        outgoing.setTroops(outgoing.troops() + this.attack.troops());
        this.active = false;
        this.attack.delete();
        return;
      }
    }

    if (this.sourceTile != null) {
      this.addNeighbors(this.sourceTile);
    } else {
      this.refreshToConquer();
    }

    if (this.target.isPlayer()) {
      if (this._owner.isAlliedWith(this.target)) {
        // No updates should happen in init.
        this.breakAlliance = true;
      }
      this.target.updateRelation(this._owner, -80);
    }
  }

  private refreshToConquer() {
    this.toConquer = [];
    this.border.clear();
    for (const tile of this._owner.borderTiles()) {
      this.addNeighbors(tile);
    }
  }

  private retreat(malusPercent = 0) {
    const deaths = this.attack.troops() * (malusPercent / 100);
    if (deaths) {
      this.mg.displayMessage(
        `Attack cancelled, ${renderTroops(deaths)} soldiers killed during retreat.`,
        MessageType.SUCCESS,
        this._owner.id(),
      );
    }
    this._owner.addTroops(this.attack.troops() - deaths);
    this.attack.delete();
    this.active = false;
  }

  tick(ticks: number) {
    if (this.attack.retreated()) {
      if (this.attack.target().isPlayer()) {
        this.retreat(malusForRetreat);
      } else {
        this.retreat();
      }
      this.active = false;
      return;
    }

    if (this.attack.retreating()) {
      return;
    }

    if (!this.attack.isActive()) {
      this.active = false;
      return;
    }

    const alliance = this._owner.allianceWith(this.target as Player);
    if (this.breakAlliance && alliance != null) {
      this.breakAlliance = false;
      this._owner.breakAlliance(alliance);
    }
    if (this.target.isPlayer() && this._owner.isAlliedWith(this.target)) {
      // In this case a new alliance was created AFTER the attack started.
      this.retreat();
      return;
    }

    let numTilesPerTick = this.mg
      .config()
      .attackTilesPerTick(
        this.attack.troops(),
        this._owner,
        this.target,
        this.border.size + this.random.nextInt(0, 5),
      );
    // consolex.log(`num tiles per tick: ${numTilesPerTick}`)
    // consolex.log(`num execs: ${this.mg.executions().length}`)

    while (numTilesPerTick > 0) {
      if (this.attack.troops() < 1) {
        this.attack.delete();
        this.active = false;
        return;
      }

      if (this.toConquer.length == 0) {
        this.refreshToConquer();
        this.retreat();
        return;
      }

      // Step 1: Separate tiles by number of adjacent owned tiles
      const priorityTiles: { tile: TileRef; weight: number }[] = [];
      const fallbackTiles: { tile: TileRef; weight: number }[] = [];

      const validTiles = this.toConquer.filter((tile) => {
        const neighbors = this.mg.neighbors(tile);
        const onBorder = neighbors.some(
          (t) => this.mg.owner(t) === this._owner,
        );
        return this.mg.owner(tile) === this.target && onBorder;
      });
      if (validTiles.length === 0) {
        this.retreat();
        return;
      }
      for (const tile of validTiles) {
        const cached = this.tileWeights.get(tile);
        if (!cached) continue;
        const { weight, ownedCount } = cached;
        if (ownedCount >= 3) {
          priorityTiles.push({ tile, weight });
        } else {
          fallbackTiles.push({ tile, weight });
        }
      }

      // Step 2: Pick from priority group if available, else fallback
      const candidates =
        priorityTiles.length > 0 ? priorityTiles : fallbackTiles;

      const totalWeight = candidates.reduce((sum, t) => sum + t.weight, 0);
      if (totalWeight === 0) {
        this.retreat();
        return;
      }

      let r = (this.random.nextInt(0, 10000) / 10000) * totalWeight;
      let tileToConquer = null;
      for (const { tile, weight } of candidates) {
        r -= weight;
        if (r <= 0) {
          tileToConquer = tile;
          break;
        }
      }

      if (!tileToConquer) {
        this.retreat();
        return;
      }

      // Remove selected tile from the conquer list
      this.toConquer = this.toConquer.filter((t) => t !== tileToConquer);

      this.border.delete(tileToConquer);

      const onBorder =
        this.mg
          .neighbors(tileToConquer)
          .filter((t) => this.mg.owner(t) == this._owner).length > 0;
      if (this.mg.owner(tileToConquer) != this.target || !onBorder) {
        continue;
      }
      this.addNeighbors(tileToConquer);
      const posture: "retreat" | "balanced" | "hold" = "balanced";
      // if (this.target.isPlayer()) {
      //   posture = (this.target as Player).defensivePosture?.() ?? "balanced";
      //   console.log("Defender posture:", posture);
      // }

      const { attackerTroopLoss, defenderTroopLoss, tilesPerTickUsed } = this.mg
        .config()
        .attackLogic(
          this.mg,
          this.attack.troops(),
          this._owner,
          this.target,
          tileToConquer,
        );
      numTilesPerTick -= tilesPerTickUsed;
      this.attack.setTroops(this.attack.troops() - attackerTroopLoss);
      if (this.target.isPlayer()) {
        this.target.removeTroops(defenderTroopLoss);
      }
      this._owner.conquer(tileToConquer);
      for (const neighbor of this.mg.neighbors(tileToConquer)) {
        if (this.toConquer.includes(neighbor)) {
          this.updateTileWeight(neighbor); // 👈 only those that could be affected
        }
      }

      this.handleDeadDefender();
    }
  }

  private addNeighbors(tile: TileRef) {
    for (const neighbor of this.mg.neighbors(tile)) {
      if (this.mg.isWater(neighbor) || this.mg.owner(neighbor) != this.target) {
        continue;
      }
      this.border.add(neighbor);
      if (!this.toConquer.includes(neighbor)) {
        this.toConquer.push(neighbor);
        this.updateTileWeight(neighbor); // 👈 only update for new
      }
    }
  }

  private handleDeadDefender() {
    if (!(this.target.isPlayer() && this.target.numTilesOwned() < 100)) return;

    const gold = this.target.gold();
    this.mg.displayMessage(
      `Conquered ${this.target.displayName()} received ${renderNumber(
        gold,
      )} gold`,
      MessageType.SUCCESS,
      this._owner.id(),
    );
    this.target.removeGold(gold);
    this._owner.addGold(gold);

    for (let i = 0; i < 10; i++) {
      for (const tile of this.target.tiles()) {
        const borders = this.mg
          .neighbors(tile)
          .some((t) => this.mg.owner(t) == this._owner);
        if (borders) {
          this._owner.conquer(tile);
        } else {
          for (const neighbor of this.mg.neighbors(tile)) {
            const no = this.mg.owner(neighbor);
            if (no.isPlayer() && no != this.target) {
              this.mg.player(no.id()).conquer(tile);
              break;
            }
          }
        }
      }
    }
  }

  private updateTileWeight(tile: TileRef) {
    const neighbors = this.mg.neighbors(tile);
    const ownedCount = neighbors.filter(
      (t) => this.mg.owner(t) === this._owner,
    ).length;

    let weight = 1.0;
    switch (this.mg.terrainType(tile)) {
      case TerrainType.Plains:
        weight = 3.0;
        break;
      case TerrainType.Highland:
        weight = 0.5;
        break;
      case TerrainType.Mountain:
        weight = 0.25;
        break;
    }

    if (ownedCount === 2) {
      weight *= 8;
    }

    this.tileWeights.set(tile, { weight, ownedCount });
  }

  owner(): Player {
    return this._owner;
  }

  isActive(): boolean {
    return this.active;
  }
}
