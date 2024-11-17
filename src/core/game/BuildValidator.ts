import { bfs, dist, manhattanDist } from "../Util";
import { Game, Player, Tile, UnitType, UnitTypes } from "./Game";

export class BuildValidator {
    constructor(private game: Game) { }

    canBuild(player: Player, tile: Tile, unitType: UnitType): boolean {
        if (!player.isAlive() || player.gold() < unitType.cost) {
            return false
        }
        switch (unitType) {
            case UnitTypes.Nuke:
                return player.units(UnitTypes.MissileSilo).length > 0
            case UnitTypes.Port:
                return this.canBuildPort(player, tile)
            case UnitTypes.Destroyer:
                return this.canBuildDestroyer(player, tile)
            case UnitTypes.MissileSilo:
                return tile.owner() == player
            default:
                throw Error(`item ${unitType.name} not supported`)
        }
    }

    canBuildPort(player: Player, tile: Tile): boolean {
        return Array.from(bfs(tile, dist(tile, 20)))
            .filter(t => t.owner() == player && t.isOceanShore()).length > 0

    }

    canBuildDestroyer(player: Player, tile: Tile): boolean {
        return player.units(UnitTypes.Port)
            .filter(u => manhattanDist(u.tile().cell(), tile.cell()) < this.game.config().boatMaxDistance()).length > 0
    }
}