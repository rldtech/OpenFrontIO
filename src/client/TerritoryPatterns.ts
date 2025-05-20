import { z } from "zod";
import rawTerritoryPatterns from "../../resources/territory_patterns.json";

const PatternSchema = z.object({
  tileWidth: z.number(),
  tileHeight: z.number(),
  scale: z.number(),
  pattern: z.array(z.array(z.number())),
});

const TerritoryPatternsSchema = z.object({
  patterns: z.record(PatternSchema),
});

export const territoryPatterns =
  TerritoryPatternsSchema.parse(rawTerritoryPatterns);
