import { AllPlayers, Cell, Game, Player, PlayerType } from "../../../core/game/Game"
import { PseudoRandom } from "../../../core/PseudoRandom"
import { calculateBoundingBox } from "../../../core/Util"
import { Theme } from "../../../core/configuration/Config"
import { Layer } from "./Layer"
import { nameLocation } from "../NameBoxCalculator"
import { TransformHandler } from "../TransformHandler"
import { createCanvas, renderTroops } from "../Utils"
import traitorIcon from '../../../../resources/images/TraitorIcon.png';
import allianceIcon from '../../../../resources/images/AllianceIcon.png';
import crownIcon from '../../../../resources/images/CrownIcon.png';
import targetIcon from '../../../../resources/images/TargetIcon.png';
import { ClientID } from "../../../core/Schemas"


class RenderInfo {
    public isVisible = true
    constructor(
        public player: Player,
        public lastRenderCalc: number,
        public lastBoundingCalculated: number,
        public boundingBox: { min: Cell, max: Cell },
        public location: Cell,
        public fontSize: number,
        public element: HTMLElement
    ) { }
}

export class NameLayer implements Layer {

    private canvas: HTMLCanvasElement
    private context: CanvasRenderingContext2D

    private lastChecked = 0
    private refreshRate = 1000

    private rand = new PseudoRandom(10)
    private renders: RenderInfo[] = []
    private seenPlayers: Set<Player> = new Set()
    private traitorIconImage: HTMLImageElement;
    private allianceIconImage: HTMLImageElement;
    private targetIconImage: HTMLImageElement;
    private crownIconImage: HTMLImageElement;

    private container: HTMLDivElement


    private myPlayer: Player | null = null

    private firstPlace: Player | null = null

    private lastUpdate = 0
    private updateFrequency = 500 // 100 ms

    constructor(private game: Game, private theme: Theme, private transformHandler: TransformHandler, private clientID: ClientID) {
        this.traitorIconImage = new Image();
        this.traitorIconImage.src = traitorIcon;

        this.allianceIconImage = new Image()
        this.allianceIconImage.src = allianceIcon

        this.crownIconImage = new Image()
        this.crownIconImage.src = crownIcon

        this.targetIconImage = new Image()
        this.targetIconImage.src = targetIcon
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        //this.redraw()
    }


    shouldTransform(): boolean {
        return false
    }

    public init(game: Game) {
        // this.canvas = document.createElement('canvas');
        this.canvas = createCanvas()
        this.context = this.canvas.getContext("2d")

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();

        this.container = document.createElement('div')
        this.container.style.position = 'fixed'
        this.container.style.left = '50%'
        this.container.style.top = '50%'
        this.container.style.pointerEvents = 'none' // Don't interfere with game interaction
        this.container.style.zIndex = '1000' // Add this line
        document.body.appendChild(this.container)

    }

    // TODO: remove tick, move this to render
    public tick() {
        const now = Date.now()
        if (now - this.lastChecked > this.refreshRate) {
            this.lastChecked = now

            const sorted = this.game.players().sort((a, b) => b.numTilesOwned() - a.numTilesOwned())
            if (sorted.length > 0) {
                this.firstPlace = sorted[0]
            }

            this.renders = this.renders.filter(r => r.player.isAlive())
            for (const player of this.game.players()) {
                if (player.isAlive()) {
                    if (!this.seenPlayers.has(player)) {
                        this.seenPlayers.add(player)
                        this.renders.push(new RenderInfo(player, 0, 0, null, null, 0, this.createPlayerElement(player)))
                    }
                } else {
                    this.seenPlayers.delete(player)
                }
            }
        }
        for (const render of this.renders) {
            const now = Date.now()
            if (now - render.lastBoundingCalculated > this.refreshRate) {
                // calculate bounding box so we now if it's visible or not
                // we check if visible in the render function
                render.boundingBox = calculateBoundingBox(render.player.borderTiles());
                render.lastBoundingCalculated = now
            }
            if (render.isVisible && now - render.lastRenderCalc > this.refreshRate) {
                // if visible, now calculate full render info
                this.calculateRenderInfo(render)
                render.lastRenderCalc = now + this.rand.nextInt(-50, 50)
            }
        }
    }

    public renderLayer(mainContex: CanvasRenderingContext2D) {
        const [upperLeft, bottomRight] = this.transformHandler.screenBoundingRect()
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const now = Date.now()
        if (now - this.lastUpdate > this.updateFrequency) {
            this.lastUpdate = now
            for (const render of this.renders) {
                render.isVisible = this.isVisible(render, upperLeft, bottomRight)
                if (render.player.isAlive() && render.isVisible && render.fontSize * this.transformHandler.scale > 10) {
                    this.renderPlayerInfo(render, this.transformHandler.scale, upperLeft, bottomRight)
                } else {
                    render.element.style.display = 'none'
                }
            }
        }

        mainContex.drawImage(
            this.canvas,
            0,
            0,
            mainContex.canvas.width,
            mainContex.canvas.height
        )

    }

    isVisible(render: RenderInfo, min: Cell, max: Cell): boolean {
        const ratio = (max.x - min.x) / Math.max(20, (render.boundingBox.max.x - render.boundingBox.min.x))
        if (render.player.type() == PlayerType.Bot) {
            if (ratio > 35) {
                return false
            }
        } else {
            if (ratio > 35) {
                return false
            }
        }
        if (render.boundingBox.max.x < min.x || render.boundingBox.max.y < min.y || render.boundingBox.min.x > max.x || render.boundingBox.min.y > max.y) {
            return false
        }
        return true
    }

    calculateRenderInfo(render: RenderInfo) {
        if (render.player.numTilesOwned() == 0) {
            render.fontSize = 0
            return
        }
        render.lastRenderCalc = Date.now() + this.rand.nextInt(0, 100)
        const [cell, size] = nameLocation(this.game, render.player)
        render.location = cell
        render.fontSize = Math.max(1, Math.floor(size))
    }

    renderPlayerInfo(render: RenderInfo, scale: number, uppperLeft: Cell, bottomRight: Cell) {
        const screenPosOld = this.transformHandler.worldToScreenCoordinates(render.location)
        const screenPos = new Cell(screenPosOld.x - window.innerWidth / 2, screenPosOld.y - window.innerHeight / 2)

        render.element.style.display = 'flex'

        render.element.style.transform = `translate(${screenPos.x}px, ${screenPos.y}px) scale(${this.transformHandler.scale})`
        render.element.style.fontSize = `${render.fontSize}px`

        // Update troops count
        const troopsDiv = render.element.children[1] as HTMLDivElement
        troopsDiv.textContent = renderTroops(render.player.troops())
    }
    renderPlayerInfoOld(render: RenderInfo, scale: number, uppperLeft: Cell, bottomRight: Cell) {
        const nameCenter = this.transformHandler.worldToScreenCoordinates(render.location)

        this.context.font = '24px Arial';
        this.context.fillStyle = 'white';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';

        const iconSize = render.fontSize * 2; // Adjust size as needed
        // const iconX = nameCenterX + render.fontSize * 2; // Position to the right of the name
        // const iconY = nameCenterY - render.fontSize / 2;

        if (render.player == this.firstPlace) {
            this.context.drawImage(
                this.crownIconImage,
                nameCenter.x - iconSize / 2,
                nameCenter.y - iconSize / 2,
                iconSize,
                iconSize
            );
        }

        if (render.player.isTraitor() && this.traitorIconImage.complete) {
            this.context.drawImage(
                this.traitorIconImage,
                nameCenter.x - iconSize / 2,
                nameCenter.y - iconSize / 2,
                iconSize,
                iconSize
            );
        }

        const myPlayer = this.getPlayer()
        if (myPlayer != null && myPlayer.isAlliedWith(render.player)) {
            this.context.drawImage(
                this.allianceIconImage,
                nameCenter.x - iconSize / 2,
                nameCenter.y - iconSize / 2,
                iconSize,
                iconSize
            );
        }

        if (myPlayer != null && new Set(myPlayer.transitiveTargets()).has(render.player)) {
            this.context.drawImage(
                this.targetIconImage,
                nameCenter.x - iconSize / 2,
                nameCenter.y - iconSize / 2,
                iconSize,
                iconSize
            );
        }

        if (myPlayer != null) {
            const emojis = render.player.outgoingEmojis().filter(e => e.recipient == AllPlayers || e.recipient == myPlayer)
            if (emojis.length > 0) {
                this.context.font = `${render.fontSize * 4}px ${this.theme.font()}`;
                this.context.fillStyle = this.theme.playerInfoColor(render.player.id()).toHex();
                this.context.textAlign = 'center';
                this.context.textBaseline = 'middle';

                this.context.fillText(emojis[0].emoji, nameCenter.x, nameCenter.y + render.fontSize / 2);
            }
        }

        this.context.textRendering = "optimizeSpeed";

        this.context.font = `${render.fontSize}px ${this.theme.font()}`;
        this.context.fillStyle = this.theme.playerInfoColor(render.player.id()).toHex();
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';

        this.context.fillText(render.player.name(), nameCenter.x, nameCenter.y - render.fontSize / 2);
        this.context.font = `bold ${render.fontSize}px ${this.theme.font()}`;

        this.context.fillText(renderTroops(render.player.troops()), nameCenter.x, nameCenter.y + render.fontSize);
    }




    private createPlayerElement(player: Player): HTMLDivElement {
        const element = document.createElement('div')
        element.style.position = 'absolute'
        element.style.left = '50%'
        element.style.top = '50%'
        element.style.display = 'flex'
        element.style.flexDirection = 'column'
        element.style.alignItems = 'center'
        element.style.transform = 'translate(-50%, -50%)'

        // Name text
        const nameDiv = document.createElement('div')
        nameDiv.textContent = player.name()
        nameDiv.style.color = this.theme.playerInfoColor(player.id()).toHex()
        nameDiv.style.fontFamily = this.theme.font()
        element.appendChild(nameDiv)

        // Troops text
        const troopsDiv = document.createElement('div')
        troopsDiv.textContent = renderTroops(player.troops())
        troopsDiv.style.color = this.theme.playerInfoColor(player.id()).toHex()
        troopsDiv.style.fontFamily = this.theme.font()
        troopsDiv.style.fontWeight = 'bold'
        element.appendChild(troopsDiv)

        // Icons container
        const iconsDiv = document.createElement('div')
        iconsDiv.style.position = 'absolute'
        iconsDiv.style.display = 'flex'
        element.appendChild(iconsDiv)

        this.container.appendChild(element)
        return element
    }

    private getPlayer(): Player | null {
        if (this.myPlayer != null) {
            return this.myPlayer
        }
        this.myPlayer = this.game.players().find(p => p.clientID() == this.clientID)
        return this.myPlayer
    }
}