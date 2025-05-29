import { z } from "zod";
import rawTerritoryPatterns from "../../resources/territory_patterns.json";

const PatternSchema = z.object({
  patternBase64: z.string().optional(),
});

const TerritoryPatternsSchema = z.object({
  patterns: z.record(PatternSchema),
});

export const territoryPatterns =
  TerritoryPatternsSchema.parse(rawTerritoryPatterns);

export class PatternDecoder {
  private bytes: Uint8Array;
  private tileWidth: number;
  private tileHeight: number;
  private scale: number;
  private dataStart: number;

  constructor(base64: string) {
    const byteString = atob(base64);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }

    const version = bytes[0];
    if (version !== 1) {
      throw new Error("The pattern versions are different.");
    }

    this.tileWidth = (bytes[1] << 8) | bytes[2];
    this.tileHeight = (bytes[3] << 8) | bytes[4];
    this.scale = (bytes[5] << 8) | bytes[6];
    this.dataStart = 7;
    this.bytes = bytes;
  }

  getTileWidth(): number {
    return this.tileWidth;
  }

  getTileHeight(): number {
    return this.tileHeight;
  }

  getScale(): number {
    return this.scale;
  }

  isSet(x: number, y: number): boolean {
    const px =
      ((Math.floor(x / this.scale) % this.tileWidth) + this.tileWidth) %
      this.tileWidth;
    const py =
      ((Math.floor(y / this.scale) % this.tileHeight) + this.tileHeight) %
      this.tileHeight;
    const idx = py * this.tileWidth + px;
    const byteIndex = Math.floor(idx / 8);
    const bitIndex = 7 - (idx % 8);
    const byte = this.bytes[this.dataStart + byteIndex] ?? 0;
    return (byte & (1 << bitIndex)) !== 0;
  }
}

export class TerritoryPatternStorage {
  private static readonly KEY = "territoryPattern";

  static getSelectedPattern(): string | undefined {
    return localStorage.getItem(TerritoryPatternStorage.KEY) ?? undefined;
  }

  static setSelectedPattern(patternKey: string): void {
    localStorage.setItem(TerritoryPatternStorage.KEY, patternKey);
  }
}
