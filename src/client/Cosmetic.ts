import { base64url } from "jose";
import { z } from "zod";
import rawTerritoryPatterns from "../../resources/cosmetic/cosmetic.json";

export const CosmeticsSchema = z.object({
  role_group: z.record(z.string(), z.array(z.string())).optional(),
  pattern: z.record(
    z.string(),
    z.object({
      pattern: z.string().base64(),
      role: z.array(z.string()).optional(),
      role_group: z.array(z.string()).optional(),
    }),
  ),
});

export const territoryPatterns = CosmeticsSchema.parse(rawTerritoryPatterns);

export class PatternDecoder {
  private bytes: Uint8Array;
  private tileWidth: number;
  private tileHeight: number;
  private scale: number;
  private dataStart: number;

  constructor(base64: string) {
    const bytes = base64url.decode(base64);

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
    const norm = (v: number, mod: number) => (v + mod) % mod;
    const shift = Math.log2(this.scale);
    const px = norm(x >> shift, this.tileWidth);
    const py = norm(y >> shift, this.tileHeight);
    const idx = py * this.tileWidth + px;
    const byteIndex = idx >> 3;
    const bitIndex = idx & 7;
    const byte = this.bytes[this.dataStart + byteIndex];
    if (byte === undefined) throw new Error("Invalid pattern");
    return (byte & (1 << bitIndex)) !== 0;
  }
}

export class TerritoryPatternStorage {
  private static readonly KEY = "territoryPattern";
  private static readonly BASE64_KEY = "territoryPatternBase64";

  static getSelectedPattern(): string | undefined {
    return localStorage.getItem(TerritoryPatternStorage.KEY) ?? undefined;
  }

  static setSelectedPattern(patternKey: string): void {
    localStorage.setItem(TerritoryPatternStorage.KEY, patternKey);
  }

  static getSelectedPatternBase64(): string | undefined {
    return (
      localStorage.getItem(TerritoryPatternStorage.BASE64_KEY) ?? undefined
    );
  }

  static setSelectedPatternBase64(base64: string): void {
    localStorage.setItem(TerritoryPatternStorage.BASE64_KEY, base64);
  }
}
