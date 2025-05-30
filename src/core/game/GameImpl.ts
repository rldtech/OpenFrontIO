import { Config } from "../configuration/Config";
import { consolex } from "../Consolex";
import { AllPlayersStats, ClientID } from "../Schemas";
import { simpleHash } from "../Util";
import { AllianceImpl } from "./AllianceImpl";
import { AllianceRequestImpl } from "./AllianceRequestImpl";
import {
  Alliance,
  AllianceRequest,
  Cell,
  ColoredTeams,
  Duos,
  EmojiMessage,
  Execution,
  Game,
  GameMode,
  GameUpdates,
  MessageType,
  Nation,
  Player,
  PlayerID,
  PlayerInfo,
  PlayerType,
  Team,
  TerrainType,
  TerraNullius,
  Unit,
  UnitInfo,
  UnitType,
} from "./Game";
import { GameMap, TileRef, TileUpdate } from "./GameMap";
import { GameUpdate, GameUpdateType } from "./GameUpdates";
import { PlayerImpl } from "./PlayerImpl";
import { Stats } from "./Stats";
import { StatsImpl } from "./StatsImpl";
import { assignTeams } from "./TeamAssignment";
import { TerraNulliusImpl } from "./TerraNulliusImpl";
import { UnitGrid } from "./UnitGrid";

export function createGame(
  humans: PlayerInfo[],
  nations: Nation[],
  gameMap: GameMap,
  miniGameMap: GameMap,
  config: Config,
): Game {
  const stats = new StatsImpl();
  return new GameImpl(humans, nations, gameMap, miniGameMap, config, stats);
}

export type CellString = string;

export class GameImpl implements Game {
  private _ticks = 0;

  private unInitExecs: Execution[] = [];

  _players: Map<PlayerID, PlayerImpl> = new Map<PlayerID, PlayerImpl>();
  _playersBySmallID: Player[] = [];

  private execs: Execution[] = [];
  private _width: number;
  private _height: number;
  _terraNullius: TerraNulliusImpl;

  allianceRequests: AllianceRequestImpl[] = [];
  alliances_: AllianceImpl[] = [];

  private nextPlayerID = 1;
  private _nextUnitID = 1;

  private updates: GameUpdates = createGameUpdatesMap();
  private unitGrid: UnitGrid;

  private playerTeams: Team[] = [ColoredTeams.Red, ColoredTeams.Blue];
  private botTeam: Team = ColoredTeams.Bot;

  constructor(
    private _humans: PlayerInfo[],
    private _nations: Nation[],
    private _map: GameMap,
    private miniGameMap: GameMap,
    private _config: Config,
    private _stats: Stats,
  ) {
    this._terraNullius = new TerraNulliusImpl();
    this._width = _map.width();
    this._height = _map.height();
    this.unitGrid = new UnitGrid(this._map);

    if (_config.gameConfig().gameMode === GameMode.Team) {
      this.populateTeams();
    }
    this.addPlayers();
  }

  private populateTeams() {
    if (this._config.playerTeams() === Duos) {
      this.playerTeams = [];
      const numTeams = Math.ceil(
        (this._humans.length + this._nations.length) / 2,
      );
      for (let i = 0; i < numTeams; i++) {
        this.playerTeams.push("Team " + (i + 1));
      }
    } else {
      const numPlayerTeams = this._config.playerTeams() as number;
      if (numPlayerTeams < 2)
        throw new Error(`Too few teams: ${numPlayerTeams}`);
      if (numPlayerTeams >= 3) this.playerTeams.push(ColoredTeams.Yellow);
      if (numPlayerTeams >= 4) this.playerTeams.push(ColoredTeams.Green);
      if (numPlayerTeams >= 5) this.playerTeams.push(ColoredTeams.Purple);
      if (numPlayerTeams >= 6) this.playerTeams.push(ColoredTeams.Orange);
      if (numPlayerTeams >= 7) this.playerTeams.push(ColoredTeams.Teal);
      if (numPlayerTeams >= 8)
        throw new Error(`Too many teams: ${numPlayerTeams}`);
    }
  }

  private addPlayers() {
    if (this.config().gameConfig().gameMode !== GameMode.Team) {
      this._humans.forEach((p) => this.addPlayer(p));
      this._nations.forEach((n) => this.addPlayer(n.playerInfo));
      return;
    }
    const allPlayers = [
      ...this._humans,
      ...this._nations.map((n) => n.playerInfo),
    ];
    const playerToTeam = assignTeams(allPlayers, this.playerTeams);
    for (const [playerInfo, team] of playerToTeam.entries()) {
      if (team === "kicked") {
        console.warn(`Player ${playerInfo.name} was kicked from team`);
        continue;
      }
      this.addPlayer(playerInfo, team);
    }
  }

  isOnEdgeOfMap(ref: TileRef): boolean {
    return this._map.isOnEdgeOfMap(ref);
  }

  owner(ref: TileRef): Player | TerraNullius {
    return this.playerBySmallID(this.ownerID(ref));
  }
  playerBySmallID(id: number): Player | TerraNullius {
    if (id === 0) {
      return this.terraNullius();
    }
    return this._playersBySmallID[id - 1];
  }
  map(): GameMap {
    return this._map;
  }
  miniMap(): GameMap {
    return this.miniGameMap;
  }

  addUpdate(update: GameUpdate) {
    (this.updates[update.type] as GameUpdate[]).push(update);
  }

  nextUnitID(): number {
    const old = this._nextUnitID;
    this._nextUnitID++;
    return old;
  }

  setFallout(tile: TileRef, value: boolean) {
    if (value && this.hasOwner(tile)) {
      throw Error(`cannot set fallout, tile ${tile} has owner`);
    }
    if (this._map.hasFallout(tile)) {
      return;
    }
    this._map.setFallout(tile, value);
    this.addUpdate({
      type: GameUpdateType.Tile,
      update: this.toTileUpdate(tile),
    });
  }

  units(...types: UnitType[]): Unit[] {
    return Array.from(this._players.values()).flatMap((p) => p.units(...types));
  }
  unitInfo(type: UnitType): UnitInfo {
    return this.config().unitInfo(type);
  }
  nations(): Nation[] {
    return this._nations;
  }

  createAllianceRequest(
    requestor: Player,
    recipient: Player,
  ): AllianceRequest | null {
    if (requestor.isAlliedWith(recipient)) {
      consolex.log("cannot request alliance, already allied");
      return null;
    }
    if (
      recipient
        .incomingAllianceRequests()
        .find((ar) => ar.requestor() === requestor) !== undefined
    ) {
      consolex.log(`duplicate alliance request from ${requestor.name()}`);
      return null;
    }
    const correspondingReq = requestor
      .incomingAllianceRequests()
      .find((ar) => ar.requestor() === recipient);
    if (correspondingReq !== undefined) {
      consolex.log(`got corresponding alliance requests, accepting`);
      correspondingReq.accept();
      return null;
    }
    const ar = new AllianceRequestImpl(requestor, recipient, this._ticks, this);
    this.allianceRequests.push(ar);
    this.addUpdate(ar.toUpdate());
    return ar;
  }

  acceptAllianceRequest(request: AllianceRequestImpl) {
    this.allianceRequests = this.allianceRequests.filter(
      (ar) => ar !== request,
    );

    const requestor = request.requestor();
    const recipient = request.recipient();

    const alliance = new AllianceImpl(
      this,
      requestor as PlayerImpl,
      recipient as PlayerImpl,
      this._ticks,
    );
    this.alliances_.push(alliance);
    (request.requestor() as PlayerImpl).pastOutgoingAllianceRequests.push(
      request,
    );

    // Automatically remove embargoes only if they were automatically created
    if (requestor.hasEmbargoAgainst(recipient))
      requestor.endTemporaryEmbargo(recipient.id());
    if (recipient.hasEmbargoAgainst(requestor))
      recipient.endTemporaryEmbargo(requestor.id());

    this.addUpdate({
      type: GameUpdateType.AllianceRequestReply,
      request: request.toUpdate(),
      accepted: true,
    });
  }

  rejectAllianceRequest(request: AllianceRequestImpl) {
    this.allianceRequests = this.allianceRequests.filter(
      (ar) => ar !== request,
    );
    (request.requestor() as PlayerImpl).pastOutgoingAllianceRequests.push(
      request,
    );
    this.addUpdate({
      type: GameUpdateType.AllianceRequestReply,
      request: request.toUpdate(),
      accepted: false,
    });
  }

  hasPlayer(id: PlayerID): boolean {
    return this._players.has(id);
  }
  config(): Config {
    return this._config;
  }

  inSpawnPhase(): boolean {
    return this._ticks <= this.config().numSpawnPhaseTurns();
  }

  ticks(): number {
    return this._ticks;
  }

  executeNextTick(): GameUpdates {
    this.updates = createGameUpdatesMap();
    this.execs.forEach((e) => {
      if (
        (!this.inSpawnPhase() || e.activeDuringSpawnPhase()) &&
        e.isActive()
      ) {
        e.tick(this._ticks);
      }
    });
    const inited: Execution[] = [];
    const unInited: Execution[] = [];
    this.unInitExecs.forEach((e) => {
      if (!this.inSpawnPhase() || e.activeDuringSpawnPhase()) {
        e.init(this, this._ticks);
        inited.push(e);
      } else {
        unInited.push(e);
      }
    });

    this.removeInactiveExecutions();

    this.execs.push(...inited);
    this.unInitExecs = unInited;
    for (const player of this._players.values()) {
      // Players change each to so always add them
      this.addUpdate(player.toUpdate());
    }
    if (this.ticks() % 10 === 0) {
      this.addUpdate({
        type: GameUpdateType.Hash,
        tick: this.ticks(),
        hash: this.hash(),
      });
    }
    this._ticks++;
    return this.updates;
  }

  private hash(): number {
    let hash = 1;
    this._players.forEach((p) => {
      hash += p.hash();
    });
    return hash;
  }

  terraNullius(): TerraNullius {
    return this._terraNullius;
  }

  removeInactiveExecutions(): void {
    const activeExecs: Execution[] = [];
    for (const exec of this.execs) {
      if (this.inSpawnPhase()) {
        if (exec.activeDuringSpawnPhase()) {
          if (exec.isActive()) {
            activeExecs.push(exec);
          }
        } else {
          activeExecs.push(exec);
        }
      } else {
        if (exec.isActive()) {
          activeExecs.push(exec);
        }
      }
    }
    this.execs = activeExecs;
  }

  players(): Player[] {
    return Array.from(this._players.values()).filter((p) => p.isAlive());
  }

  allPlayers(): Player[] {
    return Array.from(this._players.values());
  }

  executions(): Execution[] {
    return [...this.execs, ...this.unInitExecs];
  }

  addExecution(...exec: Execution[]) {
    this.unInitExecs.push(...exec);
  }

  removeExecution(exec: Execution) {
    this.execs = this.execs.filter((execution) => execution !== exec);
    this.unInitExecs = this.unInitExecs.filter(
      (execution) => execution !== exec,
    );
  }

  playerView(id: PlayerID): Player {
    return this.player(id);
  }

  addPlayer(playerInfo: PlayerInfo, team: Team | null = null): Player {
    const player = new PlayerImpl(
      this,
      this.nextPlayerID,
      playerInfo,
      this.config().startManpower(playerInfo),
      team ?? this.maybeAssignTeam(playerInfo),
    );
    this._playersBySmallID.push(player);
    this.nextPlayerID++;
    this._players.set(playerInfo.id, player);
    return player;
  }

  private maybeAssignTeam(player: PlayerInfo): Team | null {
    if (this._config.gameConfig().gameMode !== GameMode.Team) {
      return null;
    }
    if (player.playerType === PlayerType.Bot) {
      return this.botTeam;
    }
    const rand = simpleHash(player.id);
    return this.playerTeams[rand % this.playerTeams.length];
  }

  player(id: PlayerID): Player {
    const player = this._players.get(id);
    if (player === undefined) {
      throw new Error(`Player with id ${id} not found`);
    }
    return player;
  }

  playerByClientID(id: ClientID): Player | null {
    for (const [, player] of this._players) {
      if (player.clientID() === id) {
        return player;
      }
    }
    return null;
  }

  isOnMap(cell: Cell): boolean {
    return (
      cell.x >= 0 &&
      cell.x < this._width &&
      cell.y >= 0 &&
      cell.y < this._height
    );
  }

  neighborsWithDiag(tile: TileRef): TileRef[] {
    const x = this.x(tile);
    const y = this.y(tile);
    const ns: TileRef[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue; // Skip the center tile
        const newX = x + dx;
        const newY = y + dy;
        if (
          newX >= 0 &&
          newX < this._width &&
          newY >= 0 &&
          newY < this._height
        ) {
          ns.push(this._map.ref(newX, newY));
        }
      }
    }
    return ns;
  }

  conquer(owner: PlayerImpl, tile: TileRef): void {
    if (!this.isLand(tile)) {
      throw Error(`cannot conquer water`);
    }
    const previousOwner = this.owner(tile) as TerraNullius | PlayerImpl;
    if (previousOwner.isPlayer()) {
      previousOwner._lastTileChange = this._ticks;
      previousOwner._tiles.delete(tile);
      previousOwner._borderTiles.delete(tile);
    }
    this._map.setOwnerID(tile, owner.smallID());
    owner._tiles.add(tile);
    owner._lastTileChange = this._ticks;
    this.updateBorders(tile);
    this._map.setFallout(tile, false);
    this.addUpdate({
      type: GameUpdateType.Tile,
      update: this.toTileUpdate(tile),
    });
  }

  relinquish(tile: TileRef) {
    if (!this.hasOwner(tile)) {
      throw new Error(`Cannot relinquish tile because it is unowned`);
    }
    if (this.isWater(tile)) {
      throw new Error("Cannot relinquish water");
    }

    const previousOwner = this.owner(tile) as PlayerImpl;
    previousOwner._lastTileChange = this._ticks;
    previousOwner._tiles.delete(tile);
    previousOwner._borderTiles.delete(tile);

    this._map.setOwnerID(tile, 0);
    this.updateBorders(tile);
    this.addUpdate({
      type: GameUpdateType.Tile,
      update: this.toTileUpdate(tile),
    });
  }

  private updateBorders(tile: TileRef) {
    const tiles: TileRef[] = [];
    tiles.push(tile);
    this.neighbors(tile).forEach((t) => tiles.push(t));

    for (const t of tiles) {
      if (!this.hasOwner(t)) {
        continue;
      }
      if (this.calcIsBorder(t)) {
        (this.owner(t) as PlayerImpl)._borderTiles.add(t);
      } else {
        (this.owner(t) as PlayerImpl)._borderTiles.delete(t);
      }
    }
  }

  private calcIsBorder(tile: TileRef): boolean {
    if (!this.hasOwner(tile)) {
      return false;
    }
    for (const neighbor of this.neighbors(tile)) {
      const bordersEnemy = this.owner(tile) !== this.owner(neighbor);
      if (bordersEnemy) {
        return true;
      }
    }
    return false;
  }

  target(targeter: Player, target: Player) {
    this.addUpdate({
      type: GameUpdateType.TargetPlayer,
      playerID: targeter.smallID(),
      targetID: target.smallID(),
    });
  }

  public breakAlliance(breaker: Player, alliance: Alliance) {
    let other: Player;
    if (alliance.requestor() === breaker) {
      other = alliance.recipient();
    } else {
      other = alliance.requestor();
    }
    if (!breaker.isAlliedWith(other)) {
      throw new Error(
        `${breaker} not allied with ${other}, cannot break alliance`,
      );
    }
    if (!other.isTraitor() && !other.isDisconnected()) {
      breaker.markTraitor();
    }

    const breakerSet = new Set(breaker.alliances());
    const alliances = other.alliances().filter((a) => breakerSet.has(a));
    if (alliances.length !== 1) {
      throw new Error(
        `must have exactly one alliance, have ${alliances.length}`,
      );
    }
    this.alliances_ = this.alliances_.filter((a) => a !== alliances[0]);
    this.addUpdate({
      type: GameUpdateType.BrokeAlliance,
      traitorID: breaker.smallID(),
      betrayedID: other.smallID(),
    });
  }

  public expireAlliance(alliance: Alliance) {
    const p1Set = new Set(alliance.recipient().alliances());
    const alliances = alliance
      .requestor()
      .alliances()
      .filter((a) => p1Set.has(a));
    if (alliances.length !== 1) {
      throw new Error(
        `cannot expire alliance: must have exactly one alliance, have ${alliances.length}`,
      );
    }
    this.alliances_ = this.alliances_.filter((a) => a !== alliances[0]);
    this.addUpdate({
      type: GameUpdateType.AllianceExpired,
      player1ID: alliance.requestor().smallID(),
      player2ID: alliance.recipient().smallID(),
    });
  }

  sendEmojiUpdate(msg: EmojiMessage): void {
    this.addUpdate({
      type: GameUpdateType.Emoji,
      emoji: msg,
    });
  }

  setWinner(winner: Player | Team, allPlayersStats: AllPlayersStats): void {
    this.addUpdate({
      type: GameUpdateType.Win,
      winner:
        typeof winner === "string"
          ? ["team", winner]
          : ["player", winner.smallID()],
      allPlayersStats,
    });
  }

  teams(): Team[] {
    if (this._config.gameConfig().gameMode !== GameMode.Team) {
      return [];
    }
    return [this.botTeam, ...this.playerTeams];
  }

  displayMessage(
    message: string,
    type: MessageType,
    playerID: PlayerID | null,
  ): void {
    let id: number | null = null;
    if (playerID !== null) {
      id = this.player(playerID).smallID();
    }
    this.addUpdate({
      type: GameUpdateType.DisplayEvent,
      messageType: type,
      message: message,
      playerID: id,
    });
  }

  displayChat(
    message: string,
    category: string,
    variables: Record<string, string> = {},
    playerID: PlayerID | null,
    isFrom: boolean,
    recipient: string,
  ): void {
    let id: number | null = null;
    if (playerID !== null) {
      id = this.player(playerID).smallID();
    }
    this.addUpdate({
      type: GameUpdateType.DisplayChatEvent,
      key: message,
      category: category,
      variables: variables,
      playerID: id,
      isFrom,
      recipient: recipient,
    });
  }

  displayIncomingUnit(
    unitID: number,
    message: string,
    type: MessageType,
    playerID: PlayerID,
  ): void {
    const id = this.player(playerID).smallID();

    this.addUpdate({
      type: GameUpdateType.UnitIncoming,
      unitID: unitID,
      message: message,
      messageType: type,
      playerID: id,
    });
  }

  addUnit(u: Unit) {
    this.unitGrid.addUnit(u);
  }
  removeUnit(u: Unit) {
    this.unitGrid.removeUnit(u);
  }

  nearbyUnits(
    tile: TileRef,
    searchRange: number,
    types: UnitType | UnitType[],
  ): Array<{ unit: Unit; distSquared: number }> {
    return this.unitGrid.nearbyUnits(tile, searchRange, types) as Array<{
      unit: Unit;
      distSquared: number;
    }>;
  }

  ref(x: number, y: number): TileRef {
    return this._map.ref(x, y);
  }
  x(ref: TileRef): number {
    return this._map.x(ref);
  }
  y(ref: TileRef): number {
    return this._map.y(ref);
  }
  cell(ref: TileRef): Cell {
    return this._map.cell(ref);
  }
  width(): number {
    return this._map.width();
  }
  height(): number {
    return this._map.height();
  }
  numLandTiles(): number {
    return this._map.numLandTiles();
  }
  isValidCoord(x: number, y: number): boolean {
    return this._map.isValidCoord(x, y);
  }
  isLand(ref: TileRef): boolean {
    return this._map.isLand(ref);
  }
  isOceanShore(ref: TileRef): boolean {
    return this._map.isOceanShore(ref);
  }
  isOcean(ref: TileRef): boolean {
    return this._map.isOcean(ref);
  }
  isShoreline(ref: TileRef): boolean {
    return this._map.isShoreline(ref);
  }
  magnitude(ref: TileRef): number {
    return this._map.magnitude(ref);
  }
  ownerID(ref: TileRef): number {
    return this._map.ownerID(ref);
  }
  hasOwner(ref: TileRef): boolean {
    return this._map.hasOwner(ref);
  }
  setOwnerID(ref: TileRef, playerId: number): void {
    return this._map.setOwnerID(ref, playerId);
  }
  hasFallout(ref: TileRef): boolean {
    return this._map.hasFallout(ref);
  }
  isBorder(ref: TileRef): boolean {
    return this._map.isBorder(ref);
  }
  neighbors(ref: TileRef): TileRef[] {
    return this._map.neighbors(ref);
  }
  isWater(ref: TileRef): boolean {
    return this._map.isWater(ref);
  }
  isLake(ref: TileRef): boolean {
    return this._map.isLake(ref);
  }
  isShore(ref: TileRef): boolean {
    return this._map.isShore(ref);
  }
  cost(ref: TileRef): number {
    return this._map.cost(ref);
  }
  terrainType(ref: TileRef): TerrainType {
    return this._map.terrainType(ref);
  }
  forEachTile(fn: (tile: TileRef) => void): void {
    return this._map.forEachTile(fn);
  }
  manhattanDist(c1: TileRef, c2: TileRef): number {
    return this._map.manhattanDist(c1, c2);
  }
  euclideanDistSquared(c1: TileRef, c2: TileRef): number {
    return this._map.euclideanDistSquared(c1, c2);
  }
  bfs(
    tile: TileRef,
    filter: (gm: GameMap, tile: TileRef) => boolean,
  ): Set<TileRef> {
    return this._map.bfs(tile, filter);
  }
  toTileUpdate(tile: TileRef): bigint {
    return this._map.toTileUpdate(tile);
  }
  updateTile(tu: TileUpdate): TileRef {
    return this._map.updateTile(tu);
  }
  numTilesWithFallout(): number {
    return this._map.numTilesWithFallout();
  }
  stats(): Stats {
    return this._stats;
  }
}

// Or a more dynamic approach that will catch new enum values:
const createGameUpdatesMap = (): GameUpdates => {
  const map = {} as GameUpdates;
  Object.values(GameUpdateType)
    .filter((key) => !isNaN(Number(key))) // Filter out reverse mappings
    .forEach((key) => {
      map[key as GameUpdateType] = [];
    });
  return map;
};
