import { base64url } from "jose";
import { z } from "zod";
import rawTerritoryPatterns from "../../resources/cosmetic/cosmetic.json";

export const CosmeticsSchema = z.object({
  role_group: z.record(z.string(), z.array(z.string())).optional(),
  pattern: z.record(
    z.string(),
    z.object({
      pattern: z.string().base64(),
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

    if (bytes.length < 3) {
      throw new Error(
        "Pattern data is too short to contain required metadata.",
      );
    }

    const version = bytes[0];
    if (version !== 1) {
      throw new Error("The pattern versions are different.");
    }

    const byte1 = bytes[1];
    const byte2 = bytes[2];
    this.scale = byte1 & 0x07;
    const width = (((byte1 >> 3) & 0x1f) | ((byte2 & 0x03) << 5)) - 2;
    const height = ((byte2 >> 2) & 0x3f) - 2;

    if (height < 1) {
      throw new Error(
        `Invalid pattern metadata: scale=${this.scale}, width=${width}, height=${height}. Expected: scale 0–7, width 1–127, height 1–63.`,
      );
    }

    this.tileWidth = width;
    this.tileHeight = height;
    this.dataStart = 3;
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
    const px = norm(x >> this.scale, this.tileWidth);
    const py = norm(y >> this.scale, this.tileHeight);
    const idx = py * this.tileWidth + px;
    const byteIndex = idx >> 3;
    const bitIndex = idx & 7;
    const byte = this.bytes[this.dataStart + byteIndex];
    if (byte === undefined) throw new Error("Invalid pattern");
    return (byte & (1 << bitIndex)) !== 0;
  }
}

const TERRITORY_PATTERN_KEY = "territoryPattern";
const TERRITORY_PATTERN_BASE64_KEY = "territoryPatternBase64";

export function getSelectedPattern(): string | undefined {
  return localStorage.getItem(TERRITORY_PATTERN_KEY) ?? undefined;
}

export function setSelectedPattern(patternKey: string): void {
  localStorage.setItem(TERRITORY_PATTERN_KEY, patternKey);
}

export function getSelectedPatternBase64(): string | undefined {
  return localStorage.getItem(TERRITORY_PATTERN_BASE64_KEY) ?? undefined;
}

export function setSelectedPatternBase64(base64: string): void {
  localStorage.setItem(TERRITORY_PATTERN_BASE64_KEY, base64);
}
