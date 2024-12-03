import { Cell, Game, TerrainMap, TerrainTile, TerrainType } from "../game/Game";
import { AStar, PathFindResultType, SearchNode, upscalePath } from "./AStar";
import { SerialAStar } from "./SerialAStar";

// TODO: test this, get it work
export class MiniAStar implements AStar {

    private aStar: SerialAStar

    constructor(
        private terrainMap: TerrainMap,
        private miniMap: TerrainMap,
        private src: Cell,
        private dst: Cell,
        private canMove: (t: TerrainTile) => boolean,
        private iterations: number,
        private maxTries: number
    ) {
        const miniSrc = miniMap.terrain(new Cell(Math.floor(src.x / 2), Math.floor(src.y / 2)))
        const miniDst = miniMap.terrain(new Cell(Math.floor(dst.x / 2), Math.floor(dst.y / 2)))
        this.aStar = new SerialAStar(
            miniSrc,
            miniDst,
            (t => (t as TerrainTile).terrainType() == TerrainType.Ocean),
            iterations,
            maxTries
        )
    }

    compute(): PathFindResultType {
        return this.aStar.compute()
    }

    reconstructPath(): Cell[] {
        const upscaled = upscalePath(this.aStar.reconstructPath())
        upscaled.push(this.dst)
        return upscaled
    }

}
