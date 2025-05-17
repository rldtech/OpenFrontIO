import { AllPlayersStats, PlayerStats } from "../Schemas";
import { NukeType, PlayerID } from "./Game";

export interface Stats {
  betray(betraor: PlayerID): void;

  bombLaunch(sender: PlayerID, target: PlayerID | null, type: NukeType): void;
  bombLand(sender: PlayerID, target: PlayerID | null, type: NukeType): void;
  bombIntercept(
    sender: PlayerID,
    interceptor: PlayerID | null,
    type: NukeType,
  ): void;

  // structureBuild();
  // structureLose();
  // structureDestroy();
  // structureCapture();

  // boatSend();
  // boatArrive();
  // boatDestroy();

  // attackSent();
  // attackCancelled();

  // goldEarned();

  getPlayerStats(player: PlayerID): PlayerStats;
  stats(): AllPlayersStats;
}
