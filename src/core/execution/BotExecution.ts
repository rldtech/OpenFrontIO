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
  private mg: Game;
  private neighborsTerraNullius = true;

  private enemy: Player;
  private attackRate: number;
  private attackTick: number;
  private triggerRatio: number;
  private reserveRatio: number;

  constructor(private bot: Player) {
    this.random = new PseudoRandom(simpleHash(bot.id()));
    this.attackRate = this.random.nextInt(10, 50);
    this.attackTick = this.random.nextInt(0, this.attackRate);
    this.triggerRatio = this.random.nextInt(20, 30);
    this.reserveRatio = this.random.nextInt(10, 20);
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }

  init(mg: Game, ticks: number) {
    this.mg = mg;
    this.bot.setTargetTroopRatio(0.7);
  }

  tick(ticks: number) {
    if (ticks % this.attackRate != this.attackTick) return;

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

    if (this.enemy === null) {
      // Save up troops until we reach the trigger ratio
      const ratio =
        this.bot.population() / this.mg.config().maxPopulation(this.bot);
      if (ratio * 100 < this.triggerRatio) return;

      // Select a new enemy
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

      const border = Array.from(this.bot.borderTiles())
        .flatMap((t) => this.mg.neighbors(t))
        .filter((t) => this.mg.hasOwner(t) && this.mg.owner(t) != this.bot);

      if (border.length == 0) {
        return;
      }

      const toAttack = border[this.random.nextInt(0, border.length)];
      const owner = this.mg.owner(toAttack);
      if (!owner.isPlayer()) {
        this.neighborsTerraNullius = true;
        return;
      }
      this.enemy = owner;
    }

    if (this.enemy) {
      if (this.bot.isFriendly(this.enemy)) {
        this.enemy = null;
        return;
      }
      if (this.enemy.type() == PlayerType.FakeHuman) {
        if (!this.random.chance(2)) {
          return;
        }
      }
      this.sendAttack(this.enemy);
    }
  }

  sendAttack(toAttack: Player | TerraNullius) {
    if (toAttack.isPlayer() && this.bot.isOnSameTeam(toAttack)) return;
    const max = this.mg.config().maxPopulation(this.bot);
    const target = (max * this.reserveRatio) / 100;
    const troops = this.bot.population() - target;
    if (troops < 1) return;
    this.mg.addExecution(
      new AttackExecution(
        troops,
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
