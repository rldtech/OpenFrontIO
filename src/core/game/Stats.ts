import { AllPlayersStats, PlayerStats } from "../Schemas";
import { PlayerID } from "./Game";
import { NukeType } from "./Unit";

export interface Stats {
  increaseNukeCount(sender: PlayerID, target: PlayerID, type: NukeType): void;
  getPlayerStats(player: PlayerID): PlayerStats;
  stats(): AllPlayersStats;
}
