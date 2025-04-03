import {
  Execution,
  Game,
  Player,
  PlayerType,
  Relation,
  TerraNullius,
} from "../game/Game";
import { PseudoRandom } from "../PseudoRandom";
import { simpleHash } from "../Util";
import { AttackExecution } from "./AttackExecution";

export class BotExecution implements Execution {
  private active = true;
  private random: PseudoRandom;
  private updateRate: number;
  private updateTick: number;
  private mg: Game;
  private neighborsTerraNullius = true;

  constructor(private bot: Player) {
    this.random = new PseudoRandom(simpleHash(bot.id()));
    this.updateRate = this.random.nextInt(10, 50);
    this.updateTick = this.random.nextInt(0, this.updateRate);
  }
  activeDuringSpawnPhase(): boolean {
    return false;
  }

  init(mg: Game, ticks: number) {
    this.mg = mg;
    this.bot.setTargetTroopRatio(0.7);
    // this.neighborsTerra = this.bot.neighbors().filter(n => n == this.gs.terraNullius()).length > 0
  }

  tick(ticks: number) {
    if (ticks % this.updateRate != this.updateTick) return;

    if (!this.bot.isAlive()) {
      this.active = false;
      return;
    }

    this.handleAllianceRequests();
    this.maybeAttack();
  }

  private handleAllianceRequests() {
    this.bot.incomingAllianceRequests().forEach((ar) => {
      if (
        ar.requestor().isTraitor() ||
        this.bot.relation(ar.requestor()) <= Relation.Distrustful
      ) {
        ar.reject();
      } else {
        ar.accept();
      }
    });
  }

  private maybeAttack() {
    const traitors = this.bot
      .neighbors()
      .filter((n) => n.isPlayer() && n.isTraitor()) as Player[];
    if (traitors.length > 0) {
      const toAttack = this.random.randElement(traitors);
      const odds = this.bot.isFriendly(toAttack) ? 6 : 3;
      if (this.random.chance(odds)) {
        this.sendAttack(toAttack);
        return;
      }
    }

    if (this.neighborsTerraNullius) {
      for (const b of this.bot.borderTiles()) {
        for (const n of this.mg.neighbors(b)) {
          if (!this.mg.hasOwner(n) && this.mg.isLand(n)) {
            this.sendAttack(this.mg.terraNullius());
            return;
          }
        }
      }
      this.neighborsTerraNullius = false;
    }

    const border = Array.from(this.bot.borderTiles())
      .flatMap((t) => this.mg.neighbors(t))
      .filter((t) => this.mg.hasOwner(t) && this.mg.owner(t) != this.bot);

    if (border.length == 0) {
      return;
    }

    const toAttack = border[this.random.nextInt(0, border.length)];
    const owner = this.mg.owner(toAttack);

    if (owner.isPlayer()) {
      if (this.bot.isFriendly(owner)) {
        return;
      }
      if (owner.type() == PlayerType.FakeHuman) {
        if (!this.random.chance(2)) {
          return;
        }
      }
    }
    this.sendAttack(owner);
  }

  sendAttack(toAttack: Player | TerraNullius) {
    if (toAttack.isPlayer() && this.bot.isOnSameTeam(toAttack)) return;
    this.mg.addExecution(
      new AttackExecution(
        this.bot.troops() / 20,
        this.bot.id(),
        toAttack.isPlayer() ? toAttack.id() : null,
      ),
    );
  }

  owner(): Player {
    return this.bot;
  }

  isActive(): boolean {
    return this.active;
  }
}
