import { EventBus } from "../../core/EventBus"
import { Cell, Game } from "../../core/game/Game";
import { ZoomEvent, DragEvent } from "../InputHandler";

export class TransformHandler {
    public scale: number = 1.8
    private offsetX: number = -350
    private offsetY: number = -200

    constructor(private game: Game, private eventBus: EventBus, private canvas: HTMLCanvasElement) {
        this.eventBus.on(ZoomEvent, (e) => this.onZoom(e))
        this.eventBus.on(DragEvent, (e) => this.onMove(e))
    }

    boundingRect(): DOMRect {
        return this.canvas.getBoundingClientRect()
    }

    width(): number {
        return this.boundingRect().width
    }

    handleTransform(context: CanvasRenderingContext2D) {
        // Disable image smoothing for pixelated effect
        context.imageSmoothingEnabled = false;


        // Apply zoom and pan
        context.setTransform(
            this.scale,
            0,
            0,
            this.scale,
            this.game.width() / 2 - this.offsetX * this.scale,
            this.game.height() / 2 - this.offsetY * this.scale
        );
    }

    screenToWorldCoordinates(screenX: number, screenY: number): Cell {
        const canvasRect = this.boundingRect();
        const canvasX = screenX - canvasRect.left;
        const canvasY = screenY - canvasRect.top;

        // Calculate the world point we want to zoom towards
        const centerX = (canvasX - this.game.width() / 2) / this.scale + this.offsetX;
        const centerY = (canvasY - this.game.height() / 2) / this.scale + this.offsetY;

        const gameX = centerX + this.game.width() / 2
        const gameY = centerY + this.game.height() / 2

        return new Cell(Math.floor(gameX), Math.floor(gameY));
    }

    worldToScreenCoordinates(cell: Cell): Cell {
        // Step 1: Convert from Cell coordinates to game coordinates
        // (reverse of Math.floor operation - we'll use the exact values)
        const gameX = cell.x;
        const gameY = cell.y;

        // Step 2: Reverse the game center offset calculation
        // Original: gameX = centerX + this.game.width() / 2
        // Therefore: centerX = gameX - this.game.width() / 2
        const centerX = gameX - this.game.width() / 2;
        const centerY = gameY - this.game.height() / 2;

        // Step 3: Reverse the world point calculation
        // Original: centerX = (canvasX - this.game.width() / 2) / this.scale + this.offsetX
        // Therefore: canvasX = (centerX - this.offsetX) * this.scale + this.game.width() / 2
        const canvasX = (centerX - this.offsetX) * this.scale + this.game.width() / 2;
        const canvasY = (centerY - this.offsetY) * this.scale + this.game.height() / 2;

        // Step 4: Convert canvas coordinates back to screen coordinates
        const canvasRect = this.boundingRect();
        const screenX = canvasX + canvasRect.left;
        const screenY = canvasY + canvasRect.top;
        return new Cell(screenX, screenY)
    }

    screenBoundingRect(): [Cell, Cell] {

        // Calculate the world point we want to zoom towards
        const LeftX = (- this.game.width() / 2) / this.scale + this.offsetX;
        const TopY = (- this.game.height() / 2) / this.scale + this.offsetY;

        const gameLeftX = LeftX + this.game.width() / 2
        const gameTopY = TopY + this.game.height() / 2


        // Calculate the world point we want to zoom towards
        const rightX = (screen.width - this.game.width() / 2) / this.scale + this.offsetX;
        const rightY = (screen.height - this.game.height() / 2) / this.scale + this.offsetY;

        const gameRightX = rightX + this.game.width() / 2
        const gameBottomY = rightY + this.game.height() / 2

        return [new Cell(Math.floor(gameLeftX), Math.floor(gameTopY)), new Cell(Math.floor(gameRightX), Math.floor(gameBottomY))]
    }

    onZoom(event: ZoomEvent) {
        const oldScale = this.scale;
        const zoomFactor = 1 + event.delta / 600;
        this.scale /= zoomFactor;

        // Clamp the scale to prevent extreme zooming
        this.scale = Math.max(0.5, Math.min(20, this.scale));

        const canvasRect = this.boundingRect()
        const canvasX = event.x - canvasRect.left;
        const canvasY = event.y - canvasRect.top;

        // Calculate the world point we want to zoom towards
        const zoomPointX = (canvasX - this.game.width() / 2) / oldScale + this.offsetX;
        const zoomPointY = (canvasY - this.game.height() / 2) / oldScale + this.offsetY;

        // Adjust the offset
        this.offsetX = zoomPointX - (canvasX - this.game.width() / 2) / this.scale;
        this.offsetY = zoomPointY - (canvasY - this.game.height() / 2) / this.scale;
    }

    onMove(event: DragEvent) {
        this.offsetX -= event.deltaX / this.scale;
        this.offsetY -= event.deltaY / this.scale;
    }
}