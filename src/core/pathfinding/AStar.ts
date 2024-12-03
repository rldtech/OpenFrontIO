import { Cell, Tile } from "../game/Game";

export interface AStar {
    compute(): PathFindResultType
    reconstructPath(): Cell[]
}

export enum PathFindResultType {
    NextTile,
    Pending,
    Completed,
    PathNotFound
}

export type TileResult = {
    type: PathFindResultType.NextTile;
    tile: Tile;
} | {
    type: PathFindResultType.Pending;
} | {
    type: PathFindResultType.Completed;
    tile: Tile;
} | {
    type: PathFindResultType.PathNotFound;
};

export interface SearchNode {
    cost(): number
    cell(): Cell
    neighbors(): SearchNode[]
}

export function upscalePath(path: Cell[], scaleFactor: number = 2): Cell[] {
    // Scale up each point
    const scaledPath = path.map(point => (new Cell(
        point.x * scaleFactor,
        point.y * scaleFactor
    )));

    const smoothPath: Cell[] = [];

    for (let i = 0; i < scaledPath.length - 1; i++) {
        const current = scaledPath[i];
        const next = scaledPath[i + 1];

        // Add the current point
        smoothPath.push(current);

        // Always interpolate between scaled points
        const dx = next.x - current.x;
        const dy = next.y - current.y;

        // Calculate number of steps needed
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        const steps = distance;

        // Add intermediate points
        for (let step = 1; step < steps; step++) {
            smoothPath.push(new Cell(
                Math.round(current.x + (dx * step) / steps),
                Math.round(current.y + (dy * step) / steps)
            ));
        }
    }

    // Add the last point
    if (scaledPath.length > 0) {
        smoothPath.push(scaledPath[scaledPath.length - 1]);
    }

    return smoothPath;
}

