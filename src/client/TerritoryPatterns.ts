import { z } from "zod";
import rawTerritoryPatterns from "../../resources/territory_patterns.json";

const PatternSchema = z.object({
  tileWidth: z.number().optional(),
  tileHeight: z.number().optional(),
  scale: z.number().optional(),
  patternBase64: z.string().optional(),
  patternData: z
    .custom<Uint8Array>((val) => val instanceof Uint8Array)
    .optional(),
});

const TerritoryPatternsSchema = z.object({
  patterns: z.record(PatternSchema),
});

export const territoryPatterns =
  TerritoryPatternsSchema.parse(rawTerritoryPatterns);

class PatternDecoder {
  static decodeBase64Pattern(base64: string): {
    data: Uint8Array;
    tileWidth: number;
    tileHeight: number;
    scale: number;
  } {
    const byteString = atob(base64);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }

    const version = bytes[0];
    if (version !== 1) {
      throw new Error("The pattern versions are different.");
    }
    const tileWidth = (bytes[1] << 8) | bytes[2];
    const tileHeight = (bytes[3] << 8) | bytes[4];
    const scale = (bytes[5] << 8) | bytes[6];

    const totalBits = tileWidth * tileHeight;
    const totalBytes = Math.ceil(totalBits / 8);
    const data = bytes.slice(7, 7 + totalBytes);
    console.log("data", data);

    return { data, tileWidth, tileHeight, scale };
  }
}

export function initTerritoryPatterns(): void {
  for (const [key, value] of Object.entries(territoryPatterns.patterns)) {
    if (value.patternBase64) {
      const decoded = PatternDecoder.decodeBase64Pattern(value.patternBase64);
      value.patternData = decoded.data;
      value.tileWidth = decoded.tileWidth;
      value.tileHeight = decoded.tileHeight;
      value.scale = decoded.scale;
    }
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
