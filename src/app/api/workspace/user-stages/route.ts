export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

interface UserStageItem {
  key: string;
  label: string;
  step: number;
  color?: string; // slate, blue, emerald, amber, rose, purple, indigo, cyan, orange
  isDefault?: boolean;
}

const DEFAULT_USER_STAGES: UserStageItem[] = [
  { key: "NOT_STARTED", label: "Not Started", step: 1, color: "slate", isDefault: true },
  { key: "ON_PROGRESS", label: "On Progress", step: 2, color: "blue", isDefault: true },
  { key: "SUBMIT_TO_REVIEW", label: "Submit to Review", step: 3, color: "amber", isDefault: true },
  { key: "REVISION", label: "Revision", step: 4, color: "rose", isDefault: true },
  { key: "DONE", label: "Done", step: 5, color: "emerald", isDefault: true },
];

const CONFIG_FILE_PATH = path.join(process.cwd(), "config", "user_stages.json");

interface UserStagesStore {
  [userId: string]: {
    stages: UserStageItem[];
    visibleStageKeys?: string[];
    updatedAt?: string;
  };
}

async function readStore(): Promise<UserStagesStore> {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeStore(store: UserStagesStore): Promise<void> {
  const dir = path.dirname(CONFIG_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = await readStore();
    const userConfig = store[authUser.userId];

    if (userConfig && Array.isArray(userConfig.stages) && userConfig.stages.length > 0) {
      return NextResponse.json({
        stages: userConfig.stages,
        visibleStageKeys: userConfig.visibleStageKeys || userConfig.stages.map((s) => s.key),
      });
    }

    return NextResponse.json({
      stages: DEFAULT_USER_STAGES,
      visibleStageKeys: DEFAULT_USER_STAGES.map((s) => s.key),
    });
  } catch (error) {
    console.error("GET /api/workspace/user-stages error:", error);
    return NextResponse.json({ error: "Gagal memuat kustomisasi stage" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { stages, visibleStageKeys } = body;

    if (!Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json({ error: "Daftar stages tidak valid" }, { status: 400 });
    }

    // Ensure step numbers are properly ordered 1..N
    const cleanStages: UserStageItem[] = stages.map((s, idx) => ({
      key: (s.key || `STAGE_${Date.now()}_${idx}`).trim().toUpperCase(),
      label: (s.label || `Stage ${idx + 1}`).trim(),
      step: idx + 1,
      color: s.color || "blue",
      isDefault: Boolean(s.isDefault),
    }));

    const cleanVisibleKeys: string[] = Array.isArray(visibleStageKeys) && visibleStageKeys.length > 0
      ? visibleStageKeys
      : cleanStages.map((s) => s.key);

    const store = await readStore();
    store[authUser.userId] = {
      stages: cleanStages,
      visibleStageKeys: cleanVisibleKeys,
      updatedAt: new Date().toISOString(),
    };

    await writeStore(store);

    return NextResponse.json({
      success: true,
      stages: cleanStages,
      visibleStageKeys: cleanVisibleKeys,
    });
  } catch (error) {
    console.error("POST /api/workspace/user-stages error:", error);
    return NextResponse.json({ error: "Gagal menyimpan kustomisasi stage" }, { status: 500 });
  }
}
