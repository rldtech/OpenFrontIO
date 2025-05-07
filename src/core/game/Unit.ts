import { Gold, Player, Tick } from "./Game";
import { TileRef } from "./GameMap";
import { UnitUpdate } from "./GameUpdates";
import { PlayerView } from "./GameView";

export enum UnitType {
  TransportShip = "Transport",
  Warship = "Warship",
  Shell = "Shell",
  SAMMissile = "SAMMissile",
  Port = "Port",
  AtomBomb = "Atom Bomb",
  HydrogenBomb = "Hydrogen Bomb",
  TradeShip = "Trade Ship",
  MissileSilo = "Missile Silo",
  DefensePost = "Defense Post",
  SAMLauncher = "SAM Launcher",
  City = "City",
  MIRV = "MIRV",
  MIRVWarhead = "MIRV Warhead",
  Construction = "Construction",
}

export interface UnitAttrs {
  cost: (player: Player | PlayerView) => Gold;
  // Determines if its owner changes when its tile is conquered.
  territoryBound: boolean;
  maxHealth?: number;
  damage?: number;
  constructionDuration?: number;
}

export const nukeTypes = [
  UnitType.AtomBomb,
  UnitType.HydrogenBomb,
  UnitType.MIRVWarhead,
  UnitType.MIRV,
] as UnitType[];

export type NukeType = (typeof nukeTypes)[number];

export interface HealthComponent {
  health: bigint;
}

export interface HealthBehavior extends HealthComponent, BaseUnit {
  modifyHealth(delta: number): void;
  maxHealth(): number;
}

export interface BombComponent {
  detonationDst: TileRef;
}

export interface CooldownComponent {
  lastFired?: Tick;
}

export interface BaseUnit {
  id(): number;
  owner(): Player;
  attrs(): UnitAttrs;
  tile(): TileRef;
  lastTile(): TileRef;
  move(tile: TileRef): void;
  isActive(): boolean;
  delete(displayerMessage?: boolean): void;
  toUpdate(): UnitUpdate;
}

export interface BaseUnitInfo {
  targetedBySAM?: boolean;
}

export interface WarshipInfo extends HealthComponent, BaseUnitInfo {
  type: UnitType.Warship;
  moveTarget?: TileRef | null;
  attackTarget?: BaseUnit | null;
}

export interface TransportShipInfo extends BaseUnitInfo {
  type: UnitType.TransportShip;
  dst: TileRef;
  troops: number;
}

export interface ShellInfo extends BaseUnitInfo {
  type: UnitType.Shell;
}

export interface SAMMissileInfo extends BaseUnitInfo {
  type: UnitType.SAMMissile;
}

export interface PortInfo extends BaseUnitInfo {
  type: UnitType.Port;
}

export interface AtomBombInfo extends BaseUnitInfo, BombComponent {
  type: UnitType.AtomBomb;
}

export interface HydrogenBombInfo extends BaseUnitInfo, BombComponent {
  type: UnitType.HydrogenBomb;
}

export interface TradeShipInfo extends BaseUnitInfo {
  type: UnitType.TradeShip;
  srcPort: BaseUnit;
  dstPort: BaseUnit;
  lastSetSafeFromPirates?: Tick;
}

export interface MissileSiloInfo extends BaseUnitInfo {
  type: UnitType.MissileSilo;
  lastFired?: Tick;
}

export interface DefensePostInfo extends BaseUnitInfo {
  type: UnitType.DefensePost;
}

export interface SAMLauncherInfo extends BaseUnitInfo, CooldownComponent {
  type: UnitType.SAMLauncher;
  lastFired?: Tick;
}

export interface CityInfo extends BaseUnitInfo {
  type: UnitType.City;
}

export interface MIRVInfo extends BombComponent, BaseUnitInfo {
  type: UnitType.MIRV;
}

export interface MIRVWarheadInfo extends BombComponent, BaseUnitInfo {
  type: UnitType.MIRVWarhead;
}

export interface ConstructionInfo extends BaseUnitInfo {
  type: UnitType.Construction;
  toBuild: UnitType;
}

export type AnyUnitInfo =
  | TransportShipInfo
  | WarshipInfo
  | ShellInfo
  | SAMMissileInfo
  | PortInfo
  | AtomBombInfo
  | HydrogenBombInfo
  | TradeShipInfo
  | MissileSiloInfo
  | DefensePostInfo
  | SAMLauncherInfo
  | CityInfo
  | MIRVInfo
  | MIRVWarheadInfo
  | ConstructionInfo;

// Add corresponding Unit interfaces
export interface Warship extends BaseUnit, WarshipInfo, HealthBehavior {}
export interface TransportShip extends BaseUnit, TransportShipInfo {}
export interface Shell extends BaseUnit, ShellInfo {}
export interface SAMMissile extends BaseUnit, SAMMissileInfo {}
export interface Port extends BaseUnit, PortInfo {}
export interface AtomBomb extends BaseUnit, AtomBombInfo {}
export interface HydrogenBomb extends BaseUnit, HydrogenBombInfo {}
export interface TradeShip extends BaseUnit, TradeShipInfo {
  isSafeFromPirates(): boolean;
}
export interface MissileSilo extends BaseUnit, MissileSiloInfo {}
export interface DefensePost extends BaseUnit, DefensePostInfo {}
export interface SAMLauncher extends BaseUnit, SAMLauncherInfo {}
export interface City extends BaseUnit, CityInfo {}
export interface MIRV extends BaseUnit, MIRVInfo {}
export interface MIRVWarhead extends BaseUnit, MIRVWarheadInfo {}
export interface Construction extends BaseUnit, ConstructionInfo {}

export type UnitInfo<T extends UnitType> = Extract<AnyUnitInfo, { type: T }>;

// Create a mapping interface for direct unit type lookup
export interface UnitMap {
  [UnitType.TransportShip]: TransportShip;
  [UnitType.Warship]: Warship;
  [UnitType.Shell]: Shell;
  [UnitType.SAMMissile]: SAMMissile;
  [UnitType.Port]: Port;
  [UnitType.AtomBomb]: AtomBomb;
  [UnitType.HydrogenBomb]: HydrogenBomb;
  [UnitType.TradeShip]: TradeShip;
  [UnitType.MissileSilo]: MissileSilo;
  [UnitType.DefensePost]: DefensePost;
  [UnitType.SAMLauncher]: SAMLauncher;
  [UnitType.City]: City;
  [UnitType.MIRV]: MIRV;
  [UnitType.MIRVWarhead]: MIRVWarhead;
  [UnitType.Construction]: Construction;
}

// Use the map for direct property access
export type Unit<T extends UnitType> = UnitMap[T];

export type AnyUnit = UnitMap[keyof UnitMap];
