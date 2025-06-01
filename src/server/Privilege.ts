import { createRequire } from "module";
const require = createRequire(import.meta.url);
const territory_patterns = require("../../resources/cosmetic/territory_patterns.json");

type RoleGroups = Record<string, string[]>;
type PatternEntry = {
  pattern: string;
  role_group: string[];
};
type TerritoryPatterns = {
  role_groups: RoleGroups;
  pattern: Record<string, PatternEntry>;
};

const patternData = territory_patterns as TerritoryPatterns;

export class PrivilegeChecker {
  private patternData: TerritoryPatterns;

  constructor(patternData: TerritoryPatterns) {
    this.patternData = patternData;
  }

  isPatternAllowed(base64: string, roleIDs: string[]): boolean {
    const found = Object.entries(this.patternData.pattern).find(
      ([, entry]) => entry.pattern === base64,
    );

    if (!found) {
      // fallback to staff privilege check
      const staffRoles = this.patternData.role_groups["staff"] || [];
      return roleIDs.some((role) => staffRoles.includes(role));
    }

    const [, entry] = found;
    const allowedGroups = entry.role_group;

    if (allowedGroups.includes("all")) {
      return true;
    }

    for (const groupName of allowedGroups) {
      const groupRoles = this.patternData.role_groups[groupName] || [];
      if (roleIDs.some((role) => groupRoles.includes(role))) {
        return true;
      }
    }

    return false;
  }
}

let cachedChecker: PrivilegeChecker | null = null;

export function getPrivilegeChecker(): PrivilegeChecker {
  if (!cachedChecker) {
    cachedChecker = new PrivilegeChecker(patternData);
  }
  return cachedChecker;
}
