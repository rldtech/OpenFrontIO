import { GameEvent } from "../EventBus";
import {
  ColoredTeams,
  Execution,
  Game,
  GameMode,
  Player,
  Team,
} from "../game/Game";

export class WinEvent implements GameEvent {
  constructor(public readonly winner: Player) {}
}

export class WinCheckExecution implements Execution {
  private active = true;

  private mg: Game;

  constructor() {}

  init(mg: Game, ticks: number) {
    this.mg = mg;
  }

  tick(ticks: number) {
    if (ticks % 10 != 0) {
      return;
    }
    if (this.mg.config().gameConfig().gameMode == GameMode.FFA) {
      this.checkWinnerFFA();
    } else {
      this.checkWinnerTeam();
    }
  }

  checkWinnerFFA(): void {
    const sorted = this.mg
      .players()
      .sort((a, b) => b.numTilesOwned() - a.numTilesOwned());
    if (sorted.length == 0) {
      return;
    }
    const max = sorted[0];
    const numTilesWithoutFallout =
      this.mg.numLandTiles() - this.mg.numTilesWithFallout();
    if (
      (max.numTilesOwned() / numTilesWithoutFallout) * 100 >
      this.mg.config().percentageTilesOwnedToWin()
    ) {
      this.mg.setWinner(max, this.mg.stats().stats());
      console.log(`${max.name()} has won the game`);
      this.active = false;
    }
  }

  checkWinnerTeam(): void {
    const teamToTiles = new Map<Team, number>();
    const teamToMembers = new Map<Team, Set<Player>>();
    for (const player of this.mg.players()) {
      teamToTiles.set(
        player.team(),
        (teamToTiles.get(player.team()) ?? 0) + player.numTilesOwned(),
      );
      teamToMembers.set(
        player.team(),
        teamToMembers.get(player.team()) ?? new Set(),
      );
      teamToMembers.get(player.team()).add(player);
    }
    teamToTiles.delete(ColoredTeams.Bot);
    const sorted = Array.from(teamToTiles.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    if (sorted.length == 0) {
      return;
    }
    console.log(
      `TEAM LEADERBOARD:\n${sorted
        .map(
          (t) =>
            `${t[0]}: ${t[1]}, players: ${Array.from(
              teamToMembers.get(t[0]) ?? [],
            )
              .map((p) => p.name())
              .join(", ")}`,
        )
        .join("\n")}`,
    );
    const max = sorted[0];
    const numTilesWithoutFallout =
      this.mg.numLandTiles() - this.mg.numTilesWithFallout();
    const percentage = (max[1] / numTilesWithoutFallout) * 100;
    if (percentage > this.mg.config().percentageTilesOwnedToWin()) {
      if (max[0] == ColoredTeams.Bot) return;
      this.mg.setWinner(max[0], this.mg.stats().stats());
      console.log(`${max[0]} has won the game`);
      this.active = false;
    }
  }
  owner(): Player {
    return null;
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }
}
