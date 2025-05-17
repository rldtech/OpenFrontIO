import {
  AllPlayersStats,
  ARRIVED_INDEX,
  BoatType,
  BUILT_INDEX,
  CANCELLED_INDEX,
  CAPTURED_INDEX,
  DESTROYED_INDEX,
  INCOMING_INDEX,
  INTERCEPTED_INDEX,
  LANDED_INDEX,
  LAUNCHED_INDEX,
  LOST_INDEX,
  OtherUnit,
  OUTGOING_INDEX,
  PlayerStats,
  SENT_INDEX,
  TRADE_INDEX,
  WAR_INDEX,
  WORK_INDEX,
} from "../Schemas";
import { NukeType, PlayerID, UnitType } from "./Game";
import { Stats } from "./Stats";

export class StatsImpl implements Stats {
  data: AllPlayersStats = {};

  getPlayerStats(sender: PlayerID): PlayerStats {
    if (sender in this.data) {
      return this.data[sender];
    }
    const data = {
      betrayals: 0,
      boats: {
        [UnitType.TransportShip]: [0, 0, 0],
        [UnitType.TradeShip]: [0, 0, 0],
      },
      bombs: {
        [UnitType.AtomBomb]: [0, 0, 0],
        [UnitType.HydrogenBomb]: [0, 0, 0],
        [UnitType.MIRVWarhead]: [0, 0, 0],
        [UnitType.MIRV]: [0, 0, 0],
      },
      units: {
        [UnitType.City]: [0, 0, 0, 0],
        [UnitType.DefensePost]: [0, 0, 0, 0],
        [UnitType.Port]: [0, 0, 0, 0],
        [UnitType.Warship]: [0, 0, 0, 0],
        [UnitType.MissileSilo]: [0, 0, 0, 0],
        [UnitType.SAMLauncher]: [0, 0, 0, 0],
      },
      attacks: [0, 0, 0],
      gold: [0, 0, 0],
    } satisfies PlayerStats;
    this.data[sender] = data;
    return data;
  }

  stats() {
    return this.data;
  }

  attack(outgoing: PlayerID, incoming: PlayerID, troops: number): void {
    const o = this.getPlayerStats(outgoing);
    const i = this.getPlayerStats(incoming);
    o.attacks[OUTGOING_INDEX] += troops;
    i.attacks[INCOMING_INDEX] += troops;
  }

  attackCancel(outgoing: PlayerID, incoming: PlayerID, troops: number): void {
    const o = this.getPlayerStats(outgoing);
    const i = this.getPlayerStats(incoming);
    o.attacks[CANCELLED_INDEX] += troops;
    o.attacks[OUTGOING_INDEX] -= troops;
    i.attacks[INCOMING_INDEX] -= troops;
  }

  betray(player: PlayerID): void {
    this.getPlayerStats(player).betrayals++;
  }

  boatSend(player: PlayerID, type: BoatType): void {
    const data = this.getPlayerStats(player);
    const boats = data.boats[type];
    if (boats === undefined) throw new Error();
    boats[SENT_INDEX]++;
  }

  boatArrive(player: PlayerID, type: BoatType): void {
    const data = this.getPlayerStats(player);
    const boats = data.boats[type];
    if (boats === undefined) throw new Error();
    boats[ARRIVED_INDEX]++;
  }

  boatDestroy(player: PlayerID, type: BoatType): void {
    const data = this.getPlayerStats(player);
    const boats = data.boats[type];
    if (boats === undefined) throw new Error();
    boats[DESTROYED_INDEX]++;
  }

  bombLaunch(player: PlayerID, type: NukeType): void {
    const data = this.getPlayerStats(player);
    const bomb = data.bombs[type];
    if (bomb === undefined) throw new Error();
    bomb[LAUNCHED_INDEX]++;
  }

  bombLand(player: PlayerID, type: NukeType): void {
    const data = this.getPlayerStats(player);
    const bomb = data.bombs[type];
    if (bomb === undefined) throw new Error();
    bomb[LANDED_INDEX]++;
  }

  bombIntercept(player: PlayerID, type: NukeType): void {
    const data = this.getPlayerStats(player);
    const bomb = data.bombs[type];
    if (bomb === undefined) throw new Error();
    bomb[INTERCEPTED_INDEX]++;
  }

  goldWork(player: PlayerID, gold: number): void {
    const data = this.getPlayerStats(player);
    data.gold[WORK_INDEX] += gold;
  }

  goldTrade(player: PlayerID, gold: number): void {
    const data = this.getPlayerStats(player);
    data.gold[TRADE_INDEX] += gold;
  }

  goldWar(player: PlayerID, gold: number): void {
    const data = this.getPlayerStats(player);
    data.gold[WAR_INDEX] += gold;
  }

  unitBuild(player: PlayerID, type: OtherUnit): void {
    const data = this.getPlayerStats(player);
    const unit = data.units[type];
    if (unit === undefined) throw new Error();
    unit[BUILT_INDEX]++;
  }

  unitLose(player: PlayerID, type: OtherUnit): void {
    const data = this.getPlayerStats(player);
    const unit = data.units[type];
    if (unit === undefined) throw new Error();
    unit[LOST_INDEX]++;
  }

  unitDestroy(player: PlayerID, type: OtherUnit): void {
    const data = this.getPlayerStats(player);
    const unit = data.units[type];
    if (unit === undefined) throw new Error();
    unit[DESTROYED_INDEX]++;
  }

  unitCapture(player: PlayerID, type: OtherUnit): void {
    const data = this.getPlayerStats(player);
    const unit = data.units[type];
    if (unit === undefined) throw new Error();
    unit[CAPTURED_INDEX]++;
  }
}
