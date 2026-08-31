import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "config", "features.json");

export interface FeatureFlags {
  allowRetakeClockInPhoto: boolean;
}

const defaultFlags: FeatureFlags = {
  allowRetakeClockInPhoto: true,
};

export function getFeatureFlags(): FeatureFlags {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      return { ...defaultFlags, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Failed to read feature flags:", err);
  }
  return defaultFlags;
}

export function setFeatureFlags(flags: Partial<FeatureFlags>): FeatureFlags {
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const current = getFeatureFlags();
    const updated = { ...current, ...flags };
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.error("Failed to write feature flags:", err);
    return defaultFlags;
  }
}
