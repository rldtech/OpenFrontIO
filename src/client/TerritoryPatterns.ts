import { z } from "zod";
import rawTerritoryPatterns from "../../resources/territory_patterns.json";

const PatternSchema = z.object({
  tileWidth: z.number(),
  tileHeight: z.number(),
  scale: z.number(),
  pattern: z.array(z.array(z.number())).optional(),
  patternBase64: z.string().optional(),
});

const TerritoryPatternsSchema = z.object({
  patterns: z.record(PatternSchema),
});

export const territoryPatterns =
  TerritoryPatternsSchema.parse(rawTerritoryPatterns);

for (const [key, value] of Object.entries(territoryPatterns.patterns)) {
  if (!value.pattern && value.patternBase64) {
    const byteString = atob(value.patternBase64);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }

    const bits: number[] = [];
    for (const byte of bytes) {
      for (let i = 7; i >= 0; i--) {
        bits.push((byte >> i) & 1);
      }
    }

    const pattern: number[][] = [];
    for (let y = 0; y < value.tileHeight; y++) {
      const row: number[] = [];
      for (let x = 0; x < value.tileWidth; x++) {
        const index = y * value.tileWidth + x;
        row.push(bits[index] ?? 0);
      }
      pattern.push(row);
    }

    value.pattern = pattern;
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
