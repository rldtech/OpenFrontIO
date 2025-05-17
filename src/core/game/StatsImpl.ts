import {
  AllPlayersStats,
  INTERCEPTED_INDEX,
  LANDED_INDEX,
  LAUNCHED_INDEX,
  PlayerStats,
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

  betray(betraor: PlayerID): void {
    this.getPlayerStats(betraor).betrayals++;
  }

  bombLaunch(sender: PlayerID, target: PlayerID, type: NukeType): void {
    const data = this.getPlayerStats(sender);
    const bomb = data.bombs[type];
    if (bomb === undefined) throw new Error();
    bomb[LAUNCHED_INDEX]++;
  }

  bombLand(sender: PlayerID, target: PlayerID | null, type: NukeType): void {
    const data = this.getPlayerStats(sender);
    const bomb = data.bombs[type];
    if (bomb === undefined) throw new Error();
    bomb[LANDED_INDEX]++;
  }

  bombIntercept(
    sender: PlayerID,
    interceptor: PlayerID | null,
    type: NukeType,
  ): void {
    const data = this.getPlayerStats(sender);
    const bomb = data.bombs[type];
    if (bomb === undefined) throw new Error();
    bomb[INTERCEPTED_INDEX]++;
  }
}
