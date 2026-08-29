"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Snapshot = {
  date: string;
  score: number;
};

type TaskOrigin = "agent" | "human";

type Task = {
  id: string;
  name: string;
  codename: string;
  description: string;
  origin: TaskOrigin;
  color: string;
  history: Snapshot[];
};

type SeedTask = Omit<Task, "history" | "codename" | "description" | "origin"> & {
  scores: number[];
  done?: boolean;
  initialElo?: number;
};

type TimeSnapshot = {
  snapshotId: number;
  minute: number;
  scores: Record<string, number>;
};

type LedgerEntry = {
  taskId: string;
  snapshotId: number;
  minute: number;
  elo: number;
};

type CategoryState = {
  top: string[];
  bottom: string[];
};

type PlannerSnapshot = {
  schemaVersion: 1;
  tasks: Task[];
  categories: CategoryState;
  ledger: LedgerEntry[];
  deletedTaskIds: string[];
};

type PlannerSyncStatus = "connecting" | "live" | "local";

const GIT_HISTORY_URL = "https://github.com/adomasgaudi26/norra-plan/commits/main";
const periods = ["BRIEF", "FOUNDATION", "BUILD", "POLISH", "QA", "SHIP"];

const seedData: SeedTask[] = [
  {
    id: "visual-language",
    name: "Inspect Norre visual language",
    done: false,
    color: "#000000",
    scores: [1440, 1466, 1495, 1510, 1524, 1540],
  },
  {
    id: "sections",
    name: "Map homepage sections and interactions",
    done: false,
    color: "#000000",
    scores: [1398, 1424, 1450, 1476, 1492, 1505],
  },
  {
    id: "catalog",
    name: "Define mock catalog data",
    done: false,
    color: "#000000",
    scores: [1360, 1385, 1416, 1442, 1460, 1480],
  },
  {
    id: "foundation",
    name: "Create Norra app foundation",
    done: false,
    color: "#000000",
    scores: [1322, 1354, 1382, 1414, 1430, 1452],
  },
  {
    id: "header",
    name: "Build responsive header navigation",
    done: false,
    color: "#000000",
    scores: [1290, 1320, 1350, 1380, 1402, 1424],
  },
  {
    id: "hero",
    name: "Recreate full-bleed hero composition",
    done: false,
    color: "#000000",
    scores: [1242, 1272, 1304, 1332, 1358, 1386],
  },
  {
    id: "sale-grid",
    name: "Implement sale product grid",
    done: false,
    color: "#000000",
    scores: [1218, 1245, 1270, 1298, 1322, 1350],
  },
  {
    id: "additions-grid",
    name: "Implement additions product grid",
    done: false,
    color: "#000000",
    scores: [1188, 1214, 1242, 1268, 1290, 1316],
  },
  {
    id: "loved-grid",
    name: "Implement loved product grid",
    done: false,
    color: "#000000",
    scores: [1158, 1180, 1208, 1236, 1260, 1286],
  },
  {
    id: "inspiration",
    name: "Build inspiration feature tiles",
    done: false,
    color: "#000000",
    scores: [1132, 1158, 1184, 1210, 1234, 1262],
  },
  {
    id: "footer",
    name: "Add footer navigation columns",
    done: false,
    color: "#000000",
    scores: [1108, 1134, 1162, 1188, 1212, 1238],
  },
  {
    id: "newsletter",
    name: "Add newsletter signup mock",
    done: false,
    color: "#000000",
    scores: [1086, 1112, 1138, 1162, 1186, 1210],
  },
  {
    id: "search",
    name: "Add search overlay interaction",
    done: false,
    color: "#000000",
    scores: [1064, 1092, 1118, 1142, 1168, 1194],
  },
  {
    id: "cart",
    name: "Add cart drawer mock",
    done: false,
    color: "#000000",
    scores: [1042, 1068, 1096, 1120, 1146, 1170],
  },
  {
    id: "quick-view",
    name: "Add product quick-view interaction",
    done: false,
    color: "#000000",
    scores: [1020, 1048, 1074, 1102, 1128, 1152],
  },
  {
    id: "mock-images",
    name: "Create mock image treatment",
    done: false,
    color: "#000000",
    scores: [998, 1024, 1052, 1078, 1104, 1128],
  },
  {
    id: "polish",
    name: "Polish typography spacing colors",
    done: false,
    color: "#000000",
    scores: [976, 1004, 1030, 1058, 1084, 1108],
  },
  {
    id: "responsive",
    name: "Validate mobile responsive behavior",
    done: false,
    color: "#000000",
    scores: [954, 980, 1008, 1036, 1062, 1088],
  },
  {
    id: "checks",
    name: "Run accessibility and build checks",
    done: false,
    color: "#000000",
    scores: [932, 958, 984, 1010, 1036, 1060],
  },
  {
    id: "screenshot",
    name: "Compare local screenshot visually",
    done: false,
    color: "#000000",
    scores: [910, 936, 962, 988, 1014, 1040],
  },
  {
    id: "task-layer",
    name: "the task should have a 2-3word shorter version codename in the bar and on hover show a 5-10w longer description small gray text",
    done: false,
    color: "#000000",
    scores: [918, 944, 970, 996, 1022, 1048],
  },
  {
    id: "brief-storefront",
    name: "ok use this stack to recreate the norra website as closely as possible https://norredesign.com/ . use mock data and mock images, but it should look as identical as possible.",
    done: false,
    color: "#000000",
    scores: [900, 918, 936, 954, 972, 990],
  },
  {
    id: "brief-plan-format",
    name: "first write a plan - and all plans should be a todo list with 20 items in there each 3-6words long and top 5 selected. at the top.",
    done: false,
    color: "#000000",
    scores: [900, 916, 932, 948, 964, 980],
  },
  {
    id: "brief-copy-elotask",
    name: "crate a copy of the elotask repo in meta apps in desktop coding and use it for this plan",
    done: false,
    color: "#000000",
    scores: [900, 914, 928, 942, 956, 970],
  },
  {
    id: "brief-separate-app",
    name: "create the copy in this folder as a separate app",
    done: false,
    color: "#000000",
    scores: [900, 912, 924, 936, 948, 962],
  },
  {
    id: "brief-create-plan",
    name: "first create the plan in elotask",
    done: false,
    color: "#000000",
    scores: [900, 910, 920, 930, 940, 952],
  },
  {
    id: "brief-remove-status",
    name: "rm this",
    done: false,
    color: "#000000",
    scores: [900, 908, 916, 924, 932, 944],
  },
  {
    id: "brief-time-graph",
    name: "rm these we have the x axis already indicated, also add a graph of time x elo for each task currectly 4:45pm and we'll update every 5 mins",
    done: false,
    color: "#000000",
    scores: [900, 906, 912, 918, 926, 938],
  },
  {
    id: "brief-remove-axis",
    name: "rm this",
    done: false,
    color: "#000000",
    scores: [900, 904, 908, 912, 920, 932],
  },
  {
    id: "brief-add-task",
    name: "add a new task to it of what we're doing right now as well (its part of the plan)",
    done: false,
    color: "#000000",
    scores: [900, 902, 906, 910, 916, 928],
  },
  {
    id: "brief-monochrome",
    name: "colors, just all white and black",
    done: false,
    color: "#000000",
    scores: [900, 900, 904, 908, 912, 924],
  },
  {
    id: "brief-ledger-rules",
    name: "all of the tasks that i gave you should be verbatim in the plan as well all tasks that do not fit in the 20 should also have an elo and be in the elotask ledger but hidden, collapsed below the bars and not in the diagram (or if they were in the top 20 then they appear in the diagram and idssapear",
    done: false,
    color: "#000000",
    scores: [900, 900, 902, 906, 910, 920],
  },
  {
    id: "brief-provenance",
    name: "create new agent - the tasks should have a star if its agent created and a human icon if its my verbatim task",
    done: false,
    color: "#000000",
    scores: [900, 900, 900, 902, 908, 922],
  },
  {
    id: "brief-version-mark",
    name: "add version mark as v15",
    done: false,
    color: "#000000",
    scores: [500, 500, 500, 500, 500, 500],
  },
  {
    id: "brief-human-top-five",
    name: "every task i give you should be in the top 5 with default 1000elo",
    done: false,
    color: "#000000",
    scores: [1000, 1000, 1000, 1000, 1000, 1000],
    initialElo: 1000,
  },
  {
    id: "brief-local-json-server",
    name: "store plan in pc json use laptop server",
    done: false,
    color: "#000000",
    scores: [1000, 1000, 1000, 1000, 1000, 1000],
    initialElo: 1000,
  },
  {
    id: "brief-version-badge-v16",
    name: "First update version badge to be a floating at the bottom press to open git history and now v16 (list task in norre-plan before you start)",
    done: false,
    color: "#000000",
    scores: [1000, 1000, 1000, 1000, 1000, 1000],
    initialElo: 1000,
  },
  {
    id: "brief-mobile-v17",
    name: "now delegate to forked agents from youself - task v17make the whole site more mobile friendly it feels like a desktop version site. We are using next.js right?",
    done: false,
    color: "#000000",
    scores: [1000, 1000, 1000, 1000, 1000, 1000],
    initialElo: 1000,
  },
  {
    id: "brief-live-planner-data",
    name: "the website should fetch data from database or local, so that i would see your update or my website edits instantly not like now where i wait for github push and pages deploy - elo 1100",
    done: false,
    color: "#000000",
    scores: [1100, 1100, 1100, 1100, 1100, 1100],
    initialElo: 1100,
  },
];

const taskDetails: Record<string, Pick<Task, "codename" | "description">> = {
  "visual-language": {
    codename: "Visual Language",
    description: "Translate Norre’s pale, editorial visual system into tokens.",
  },
  sections: {
    codename: "Section Map",
    description: "Document hero, grids, footer, overlays, and interactions.",
  },
  catalog: {
    codename: "Mock Catalog",
    description: "Seed furnishings, brands, prices, sale states, and metadata.",
  },
  foundation: {
    codename: "App Foundation",
    description: "Set up the copied planner storefront workspace for implementation.",
  },
  header: {
    codename: "Header System",
    description: "Match navigation labels, spacing, utility actions, and focus states.",
  },
  hero: {
    codename: "Hero Scene",
    description: "Rebuild oversized photography-led landing page opening moment.",
  },
  "sale-grid": {
    codename: "Sale Grid",
    description: "Add discounted furniture cards with sale tags and pricing.",
  },
  "additions-grid": {
    codename: "Latest Additions",
    description: "Create latest additions showcase with quiet product metadata.",
  },
  "loved-grid": {
    codename: "Most Loved",
    description: "Surface best-loved objects in a considered product row.",
  },
  inspiration: {
    codename: "Inspiration Tiles",
    description: "Build editorial inspiration tiles for design stories.",
  },
  footer: {
    codename: "Footer Links",
    description: "Organize brand, service, and company links densely.",
  },
  newsletter: {
    codename: "Welcome Offer",
    description: "Create restrained signup field with welcome offer messaging.",
  },
  search: {
    codename: "Search Surface",
    description: "Open a focused search surface without leaving page.",
  },
  cart: {
    codename: "Cart Drawer",
    description: "Prototype side cart with totals and checkout action.",
  },
  "quick-view": {
    codename: "Quick View",
    description: "Preview product details before committing to navigation.",
  },
  "mock-images": {
    codename: "Image Treatment",
    description: "Tune placeholder imagery toward warm architectural interiors.",
  },
  polish: {
    codename: "Type Polish",
    description: "Refine type scale, rhythm, contrast, and quiet color.",
  },
  responsive: {
    codename: "Mobile Pass",
    description: "Check stacked layouts, touch targets, and image crops.",
  },
  checks: {
    codename: "Quality Checks",
    description: "Run keyboard, contrast, type, and production build checks.",
  },
  screenshot: {
    codename: "Visual Compare",
    description: "Compare local capture against Norre reference at key breakpoints.",
  },
  "task-layer": {
    codename: "Task Layer",
    description: "Clarify short codenames and descriptions inside task bars.",
  },
  "brief-storefront": {
    codename: "Storefront Brief",
    description: "Recreate Norra’s storefront using mock commerce content and imagery.",
  },
  "brief-plan-format": {
    codename: "Plan Format",
    description: "Keep the roadmap as twenty concise prioritized tasks.",
  },
  "brief-copy-elotask": {
    codename: "Elo Copy",
    description: "Copy the planner repository into a separate Meta apps project.",
  },
  "brief-separate-app": {
    codename: "Separate App",
    description: "Keep the copied application isolated from its source project.",
  },
  "brief-create-plan": {
    codename: "Elo Ledger",
    description: "Record the recreation work inside the planner before coding.",
  },
  "brief-remove-status": {
    codename: "Remove Status",
    description: "Remove the selected status cluster from the planner header.",
  },
  "brief-time-graph": {
    codename: "Time Graph",
    description: "Track every task’s ELO progression when a snapshot is recorded.",
  },
  "brief-remove-axis": {
    codename: "Remove Axis",
    description: "Replace the old phase slider with the time graph.",
  },
  "brief-add-task": {
    codename: "Current Task",
    description: "Record the current interface refinement as part of roadmap.",
  },
  "brief-monochrome": {
    codename: "Monochrome",
    description: "Use black and white styling throughout the planning interface.",
  },
  "brief-ledger-rules": {
    codename: "Ledger Rules",
    description: "Keep overflow tasks scored, collapsed, and excluded from chart.",
  },
  "brief-provenance": {
    codename: "Provenance Icons",
    description: "Mark agent-created and verbatim human tasks in the planner.",
  },
  "brief-version-mark": {
    codename: "Version Mark",
    description: "Display the current planner release label as v15.",
  },
  "brief-human-top-five": {
    codename: "Human Top Five",
    description: "Place each user-provided task in Top 5 at default 1000 ELO.",
  },
  "brief-local-json-server": {
    codename: "Local JSON Server",
    description: "Persist planner state in a PC JSON file served by the laptop.",
  },
  "brief-version-badge-v16": {
    codename: "Version History",
    description: "Float the v16 badge and open this repository’s Git history on demand.",
  },
  "brief-mobile-v17": {
    codename: "Mobile v17",
    description: "Rework the planner layout and controls for comfortable small-screen use.",
  },
  "brief-live-planner-data": {
    codename: "Live Planner Data",
    description: "Fetch shared planner state locally so edits appear without a Pages deployment.",
  },
};

const DEFAULT_ELO = 500;
const HUMAN_DEFAULT_ELO = 1000;
const MAX_SELECTED = 5;

function getInitialElo(taskId: string, explicitElo?: number) {
  return explicitElo ?? (taskId.startsWith("brief-") ? HUMAN_DEFAULT_ELO : DEFAULT_ELO);
}

const initialTasks: Task[] = seedData.map(({ scores: _scores, done: _legacyDone, initialElo, ...task }) => ({
  ...task,
  ...taskDetails[task.id],
  origin: task.id.startsWith("brief-") ? "human" : "agent",
  history: periods.map((date) => ({ date, score: getInitialElo(task.id, initialElo) })),
}));

const INITIAL_TIME_MINUTES = 16 * 60 + 45;
const CURRENT_INITIAL_TIME_MINUTES = 17 * 60 + 40;
const initialLedger: LedgerEntry[] = initialTasks.flatMap((task) => [
  {
    taskId: task.id,
    snapshotId: 0,
    minute: INITIAL_TIME_MINUTES,
    elo: task.history[task.history.length - 1].score,
  },
  {
    taskId: task.id,
    snapshotId: 1,
    minute: CURRENT_INITIAL_TIME_MINUTES,
    elo: task.history[task.history.length - 1].score,
  },
]);

const MIN_SCORE = 0;
const K_FACTOR = 32;
const STORAGE_KEY = "elo-plan-state-v6";
const LEDGER_STORAGE_KEY = "norra-elo-ledger-v8";
const CATEGORY_STORAGE_KEY = "elo-plan-categories-v1";
const DELETED_TASK_IDS_KEY = "elo-plan-deleted-task-ids-v1";
const PLANNER_SCHEMA_VERSION = 1;
const PLANNER_POLL_INTERVAL_MS = 2000;
const PLANNER_REQUEST_TIMEOUT_MS = 1800;
const INITIAL_TOP_IDS = [
  ...initialTasks
    .filter((task) => task.origin === "human")
    .slice(-MAX_SELECTED)
    .reverse()
    .map((task) => task.id),
];
const INITIAL_BOTTOM_IDS = ["polish", "responsive", "checks", "task-layer", "screenshot"];

function getHumanTopIds(taskList: Task[]) {
  return taskList
    .filter((task) => task.origin === "human")
    .slice(-MAX_SELECTED)
    .reverse()
    .map((task) => task.id);
}

function getDeletedTaskIds() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DELETED_TASK_IDS_KEY) ?? "[]");
    return new Set<string>(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function promoteHumanTasks(categoryState: CategoryState, taskList: Task[]): CategoryState {
  const knownTaskIds = new Set(taskList.map((task) => task.id));
  const humanTopIds = getHumanTopIds(taskList);
  const top = [...humanTopIds, ...categoryState.top]
    .filter((id, index, ids) => ids.indexOf(id) === index)
    .filter((id) => knownTaskIds.has(id))
    .slice(0, MAX_SELECTED);
  const bottom = categoryState.bottom.filter(
    (id) => knownTaskIds.has(id) && !top.includes(id),
  );
  return { top, bottom };
}

function formatScore(score: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(score));
}

function formatTimelineTime(totalMinutes: number) {
  const minutesInDay = 24 * 60;
  const normalized = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function getTaskOrigin(id: string): TaskOrigin {
  return id.startsWith("brief-") ? "human" : "agent";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPlannerTask(value: unknown): value is Task {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.codename === "string" &&
    typeof value.description === "string" &&
    (value.origin === "agent" || value.origin === "human") &&
    value.color === "#000000" &&
    Array.isArray(value.history) &&
    value.history.length === periods.length &&
    value.history.every(
      (snapshot) =>
        isRecord(snapshot) &&
        typeof snapshot.date === "string" &&
        isFiniteNumber(snapshot.score),
    )
  );
}

function parsePlannerSnapshot(value: unknown): PlannerSnapshot | null {
  if (!isRecord(value) || value.schemaVersion !== PLANNER_SCHEMA_VERSION) return null;

  const tasks = value.tasks;
  const categories = value.categories;
  const ledger = value.ledger;
  const deletedTaskIds = value.deletedTaskIds;
  if (!Array.isArray(tasks) || !tasks.every(isPlannerTask)) return null;
  if (!isRecord(categories)) return null;
  if (!Array.isArray(categories.top) || !Array.isArray(categories.bottom)) return null;
  if (
    categories.top.length > MAX_SELECTED ||
    categories.bottom.length > MAX_SELECTED ||
    !categories.top.every((id) => typeof id === "string") ||
    !categories.bottom.every((id) => typeof id === "string") ||
    new Set([...categories.top, ...categories.bottom]).size !==
      categories.top.length + categories.bottom.length
  ) {
    return null;
  }
  if (
    !Array.isArray(ledger) ||
    !ledger.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.taskId === "string" &&
        isFiniteNumber(entry.snapshotId) &&
        isFiniteNumber(entry.minute) &&
        isFiniteNumber(entry.elo),
    )
  ) {
    return null;
  }
  if (!Array.isArray(deletedTaskIds) || !deletedTaskIds.every((id) => typeof id === "string")) {
    return null;
  }

  return {
    schemaVersion: PLANNER_SCHEMA_VERSION,
    tasks: tasks as Task[],
    categories: {
      top: categories.top as string[],
      bottom: categories.bottom as string[],
    },
    ledger: ledger as LedgerEntry[],
    deletedTaskIds: deletedTaskIds as string[],
  };
}

function mergeSeedTasks(taskList: Task[], deletedTaskIds: Set<string>) {
  const storedTaskIds = new Set(taskList.map((task) => task.id));
  return [
    ...taskList,
    ...initialTasks.filter(
      (task) => !storedTaskIds.has(task.id) && !deletedTaskIds.has(task.id),
    ),
  ];
}

function mergeSeedLedger(ledgerList: LedgerEntry[], deletedTaskIds: Set<string>) {
  const recordedTaskIds = new Set(ledgerList.map((entry) => entry.taskId));
  return [
    ...ledgerList,
    ...initialLedger.filter(
      (entry) => !recordedTaskIds.has(entry.taskId) && !deletedTaskIds.has(entry.taskId),
    ),
  ];
}

function getPlannerApiUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_PLANNER_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");
  if (typeof window === "undefined" || window.location.protocol !== "http:") return "";

  const host = window.location.hostname;
  const isPrivateNetworkHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (!isPrivateNetworkHost) return "";

  const formattedHost = host.includes(":") ? `[${host}]` : host;
  return `http://${formattedHost}:8787/api/planner`;
}

async function fetchPlannerEnvelope(url: string, init?: RequestInit): Promise<{
  snapshot: PlannerSnapshot;
  revision: number;
}> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), PLANNER_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`Planner server returned ${response.status}`);
    const raw: unknown = await response.json();
    const snapshot = parsePlannerSnapshot(raw);
    if (!snapshot) throw new Error("Planner server returned an invalid snapshot");
    const revision = isRecord(raw) && isFiniteNumber(raw.revision) ? raw.revision : Date.now();
    return { snapshot, revision };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getScoreScaleMax(taskList: Task[], ledgerEntries: LedgerEntry[]) {
  const highestScore = Math.max(
    DEFAULT_ELO,
    ...taskList.flatMap((task) => task.history.map((snapshot) => snapshot.score)),
    ...ledgerEntries.map((entry) => entry.elo),
  );
  if (highestScore <= 1000) return 1000;
  return Math.ceil((highestScore + 100) / 100) * 100;
}

function getScoreTicks(scaleMax: number) {
  const ticks = [0];
  for (let tick = 500; tick < scaleMax; tick += 500) ticks.push(tick);
  if (!ticks.includes(scaleMax)) ticks.push(scaleMax);
  return ticks;
}

function getWidth(score: number, scaleMax: number) {
  return `${Math.min(100, Math.max(2, ((score - MIN_SCORE) / (scaleMax - MIN_SCORE)) * 100))}%`;
}

function getRating(winnerScore: number, loserScore: number) {
  const expectedWinner = 1 / (1 + 10 ** ((loserScore - winnerScore) / 400));
  const change = Math.max(1, Math.round(K_FACTOR * (1 - expectedWinner)));
  return { winner: winnerScore + change, loser: loserScore - change };
}

function OriginMarker({ origin }: { origin: TaskOrigin }) {
  if (origin === "agent") {
    return (
      <span className="origin-marker origin-agent" role="img" aria-label="Agent-created task" title="Agent-created task">
        ★
      </span>
    );
  }

  return (
    <span className="origin-marker origin-human" role="img" aria-label="Verbatim human task" title="Verbatim human task">
      <svg viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="4" r="2.25" />
        <path d="M2.5 13.25c.4-2.65 2.1-4 4.5-4s4.1 1.35 4.5 4" />
      </svg>
    </span>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const periodIndex = periods.length - 1;
  const [categories, setCategories] = useState<CategoryState>({
    top: INITIAL_TOP_IDS,
    bottom: INITIAL_BOTTOM_IDS,
  });
  const [ledger, setLedger] = useState<LedgerEntry[]>(initialLedger);
  const [storageReady, setStorageReady] = useState(false);
  const [categoryStorageReady, setCategoryStorageReady] = useState(false);
  const [ledgerStorageReady, setLedgerStorageReady] = useState(false);
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);
  const [plannerApiUrl, setPlannerApiUrl] = useState("");
  const [remoteStorageReady, setRemoteStorageReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<PlannerSyncStatus>("connecting");
  const remoteRevisionRef = useRef(0);
  const remoteWriteTimerRef = useRef<number | null>(null);

  const selected = categories.top;

  useEffect(() => {
    const localDeletedTaskIds = getDeletedTaskIds();
    setDeletedTaskIds([...localDeletedTaskIds]);
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<Task & { origin?: TaskOrigin; done?: boolean }>;
        const normalized = parsed.map(({ done: _legacyDone, ...task }) => ({
          ...task,
          origin: task.origin ?? getTaskOrigin(task.id),
        }));
        const knownTaskIds = new Set(initialTasks.map((task) => task.id));
        const storedTaskIds = new Set(normalized.map((task) => task.id));
        const newlySeededTasks = initialTasks.filter(
          (task) => !storedTaskIds.has(task.id) && !localDeletedTaskIds.has(task.id),
        );
        const valid =
          Array.isArray(parsed) &&
          parsed.length <= initialTasks.length &&
          new Set(parsed.map((task) => task.id)).size === parsed.length &&
          normalized.every(
            (task) =>
              typeof task.id === "string" &&
              knownTaskIds.has(task.id) &&
              typeof task.name === "string" &&
              typeof task.codename === "string" &&
              typeof task.description === "string" &&
              (task.origin === "agent" || task.origin === "human") &&
              task.color === "#000000" &&
              Array.isArray(task.history) &&
              task.history.length === periods.length,
          );
        if (valid) setTasks([...normalized, ...newlySeededTasks]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (storageReady) {
      window.localStorage.setItem(DELETED_TASK_IDS_KEY, JSON.stringify(deletedTaskIds));
    }
  }, [deletedTaskIds, storageReady]);

  useEffect(() => {
    if (storageReady) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [storageReady, tasks]);

  useEffect(() => {
    if (!storageReady || categoryStorageReady) return;
    const saved = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    let savedCategories: CategoryState | null = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CategoryState;
        const knownTaskIds = new Set(tasks.map((task) => task.id));
        const validIds = (ids: unknown): ids is string[] =>
          Array.isArray(ids) &&
          ids.length <= MAX_SELECTED &&
          ids.every((id) => typeof id === "string" && knownTaskIds.has(id));
        const valid =
          parsed &&
          validIds(parsed.top) &&
          validIds(parsed.bottom) &&
          new Set([...parsed.top, ...parsed.bottom]).size === parsed.top.length + parsed.bottom.length;
        if (valid) savedCategories = parsed;
      } catch {
        window.localStorage.removeItem(CATEGORY_STORAGE_KEY);
      }
    }

    const fallbackCategories: CategoryState = {
      top: INITIAL_TOP_IDS.filter((id) => tasks.some((task) => task.id === id)),
      bottom: INITIAL_BOTTOM_IDS.filter((id) => tasks.some((task) => task.id === id)),
    };
    setCategories(promoteHumanTasks(savedCategories ?? fallbackCategories, tasks));
    setCategoryStorageReady(true);
  }, [categoryStorageReady, storageReady, tasks]);

  useEffect(() => {
    if (categoryStorageReady) {
      window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
    }
  }, [categories, categoryStorageReady]);

  useEffect(() => {
    const saved = window.localStorage.getItem(LEDGER_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LedgerEntry[];
        const knownTaskIds = new Set(initialTasks.map((task) => task.id));
        const deletedTaskIds = getDeletedTaskIds();
        const recordedTaskIds = new Set(parsed.map((entry) => entry.taskId));
        const newlySeededEntries = initialLedger.filter(
          (entry) => !recordedTaskIds.has(entry.taskId) && !deletedTaskIds.has(entry.taskId),
        );
        const valid =
          Array.isArray(parsed) &&
          parsed.every(
            (entry) =>
              entry &&
              typeof entry.taskId === "string" &&
              knownTaskIds.has(entry.taskId) &&
              typeof entry.snapshotId === "number" &&
              Number.isFinite(entry.snapshotId) &&
              typeof entry.minute === "number" &&
              Number.isFinite(entry.minute) &&
              typeof entry.elo === "number" &&
              Number.isFinite(entry.elo),
          );
        if (valid) setLedger([...parsed, ...newlySeededEntries]);
      } catch {
        window.localStorage.removeItem(LEDGER_STORAGE_KEY);
      }
    }
    setLedgerStorageReady(true);
  }, []);

  useEffect(() => {
    if (ledgerStorageReady) {
      window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(ledger));
    }
  }, [ledger, ledgerStorageReady]);

  useEffect(() => {
    const apiUrl = getPlannerApiUrl();
    setPlannerApiUrl(apiUrl);
    if (!apiUrl) {
      setSyncStatus("local");
      setRemoteStorageReady(true);
      return;
    }

    let cancelled = false;
    async function loadRemotePlanner() {
      try {
        const { snapshot, revision } = await fetchPlannerEnvelope(apiUrl);
        if (cancelled) return;
        remoteRevisionRef.current = revision;
        const localDeletedTaskIds = getDeletedTaskIds();
        const remoteDeletedTaskIds = new Set([
          ...localDeletedTaskIds,
          ...snapshot.deletedTaskIds,
        ]);
        const mergedTasks = mergeSeedTasks(snapshot.tasks, remoteDeletedTaskIds);
        const mergedLedger = mergeSeedLedger(snapshot.ledger, remoteDeletedTaskIds);
        const mergedCategories = promoteHumanTasks(snapshot.categories, mergedTasks);
        setDeletedTaskIds([...remoteDeletedTaskIds]);
        if (snapshot.tasks.length > 0) {
          setTasks(mergedTasks);
          setCategories(mergedCategories);
          setLedger(mergedLedger);
        }
        setSyncStatus("live");
      } catch {
        if (!cancelled) setSyncStatus("local");
      } finally {
        if (!cancelled) setRemoteStorageReady(true);
      }
    }

    void loadRemotePlanner();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!plannerApiUrl || !remoteStorageReady || !storageReady) return;

    let cancelled = false;
    async function pullRemotePlanner() {
      try {
        const { snapshot, revision } = await fetchPlannerEnvelope(plannerApiUrl);
        if (cancelled) return;
        setSyncStatus("live");
        if (revision <= remoteRevisionRef.current) return;
        remoteRevisionRef.current = revision;
        const deleted = new Set([
          ...getDeletedTaskIds(),
          ...snapshot.deletedTaskIds,
        ]);
        const mergedTasks = mergeSeedTasks(snapshot.tasks, deleted);
        setDeletedTaskIds([...deleted]);
        setTasks(mergedTasks);
        setCategories(promoteHumanTasks(snapshot.categories, mergedTasks));
        setLedger(mergeSeedLedger(snapshot.ledger, deleted));
      } catch {
        if (!cancelled) setSyncStatus("local");
      }
    }

    const intervalId = window.setInterval(() => {
      void pullRemotePlanner();
    }, PLANNER_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [plannerApiUrl, remoteStorageReady, storageReady]);

  useEffect(() => {
    if (
      !plannerApiUrl ||
      !remoteStorageReady ||
      !storageReady ||
      !categoryStorageReady ||
      !ledgerStorageReady
    ) {
      return;
    }

    if (remoteWriteTimerRef.current !== null) {
      window.clearTimeout(remoteWriteTimerRef.current);
    }

    const snapshot: PlannerSnapshot = {
      schemaVersion: PLANNER_SCHEMA_VERSION,
      tasks,
      categories,
      ledger,
      deletedTaskIds,
    };
    remoteWriteTimerRef.current = window.setTimeout(() => {
      void fetchPlannerEnvelope(plannerApiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      })
        .then(({ revision }) => {
          remoteRevisionRef.current = revision;
          setSyncStatus("live");
        })
        .catch(() => {
          setSyncStatus("local");
        })
        .finally(() => {
          remoteWriteTimerRef.current = null;
        });
    }, 250);

    return () => {
      if (remoteWriteTimerRef.current !== null) {
        window.clearTimeout(remoteWriteTimerRef.current);
        remoteWriteTimerRef.current = null;
      }
    };
  }, [
    categories,
    deletedTaskIds,
    ledger,
    ledgerStorageReady,
    plannerApiUrl,
    remoteStorageReady,
    storageReady,
    tasks,
  ]);

  const rankedTasks = useMemo(
    () =>
      tasks
        .map((task) => ({ ...task, currentScore: task.history[periodIndex].score }))
        .sort((a, b) => {
          const selectedDifference = Number(selected.includes(b.id)) - Number(selected.includes(a.id));
          return selectedDifference || b.currentScore - a.currentScore;
        }),
    [periodIndex, selected, tasks],
  );
  const scoreScaleMax = useMemo(
    () => getScoreScaleMax(tasks, ledger),
    [ledger, tasks],
  );
  const scoreTicks = useMemo(
    () => getScoreTicks(scoreScaleMax),
    [scoreScaleMax],
  );

  const topTaskIds = new Set(categories.top);
  const bottomTaskIds = new Set(categories.bottom);
  const pinnedTasks = rankedTasks.filter(
    (task) => topTaskIds.has(task.id) || bottomTaskIds.has(task.id),
  );
  const middleCandidates = rankedTasks.filter(
    (task) => !topTaskIds.has(task.id) && !bottomTaskIds.has(task.id),
  );
  const visibleTasks = [...pinnedTasks, ...middleCandidates];
  const topTasks = categories.top
    .map((id) => visibleTasks.find((task) => task.id === id))
    .filter((task): task is (typeof visibleTasks)[number] => Boolean(task));
  const bottomTasks = categories.bottom
    .map((id) => visibleTasks.find((task) => task.id === id))
    .filter((task): task is (typeof visibleTasks)[number] => Boolean(task));
  const middleTasks = visibleTasks.filter(
    (task) => !topTaskIds.has(task.id) && !bottomTaskIds.has(task.id),
  );
  const selectedTasks = topTasks;

  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const timeSeries = useMemo<TimeSnapshot[]>(() => {
    const snapshots = new Map<number, TimeSnapshot>();
    ledger.forEach((entry) => {
      const snapshot = snapshots.get(entry.snapshotId) ?? {
        snapshotId: entry.snapshotId,
        minute: entry.minute,
        scores: {},
      };
      snapshot.scores[entry.taskId] = entry.elo;
      snapshots.set(entry.snapshotId, snapshot);
    });
    return [...snapshots.values()];
  }, [ledger]);
  const chartData = useMemo(
    () => timeSeries.map((snapshot, index) => ({
      snapshot: String(index + 1),
      time: formatTimelineTime(snapshot.minute),
      ...snapshot.scores,
    })),
    [timeSeries],
  );
  const latestTimeSnapshot = timeSeries[timeSeries.length - 1];

  function recordSnapshot() {
    const now = new Date();
    const minute = now.getHours() * 60 + now.getMinutes();
    const snapshotId = Date.now();
    setLedger((current) => [
      ...current,
      ...tasks.map((task) => ({
        taskId: task.id,
        snapshotId,
        minute,
        elo: task.history[periodIndex].score,
      })),
    ]);
  }

  function moveTask(taskId: string, target: "top" | "bottom") {
    setCategories((current) => {
      const source = current.top.includes(taskId)
        ? "top"
        : current.bottom.includes(taskId)
          ? "bottom"
          : "middle";
      let top = current.top.filter((id) => id !== taskId);
      let bottom = current.bottom.filter((id) => id !== taskId);

      if (target === "top") {
        top = [taskId, ...top];
        if (top.length > 5) {
          const displaced = top.pop();
          if (source === "bottom" && displaced) bottom = [displaced, ...bottom].slice(0, 5);
        }
      } else {
        bottom = [taskId, ...bottom];
        if (bottom.length > 5) {
          const displaced = bottom.pop();
          if (source === "top" && displaced) top = [displaced, ...top].slice(0, 5);
        }
      }

      return { top, bottom };
    });
  }

  function deleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    setCategories((current) => ({
      top: current.top.filter((id) => id !== taskId),
      bottom: current.bottom.filter((id) => id !== taskId),
    }));
    setLedger((current) => current.filter((entry) => entry.taskId !== taskId));
    const deletedTaskIds = getDeletedTaskIds();
    deletedTaskIds.add(taskId);
    setDeletedTaskIds([...deletedTaskIds]);
    window.localStorage.setItem(DELETED_TASK_IDS_KEY, JSON.stringify([...deletedTaskIds]));
  }

  function rate(winnerId: string, loserId: string) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== winnerId && task.id !== loserId) return task;
        const winner = current.find((item) => item.id === winnerId);
        const loser = current.find((item) => item.id === loserId);
        if (!winner || !loser) return task;
        const result = getRating(
          winner.history[periodIndex].score,
          loser.history[periodIndex].score,
        );
        const newScore = task.id === winnerId ? result.winner : result.loser;
        const delta = newScore - task.history[periodIndex].score;
        return {
          ...task,
          history: task.history.map((snapshot, index) =>
            index < periodIndex
              ? snapshot
              : { ...snapshot, score: Math.round(snapshot.score + delta) },
          ),
        };
      }),
    );
  }

  const firstSelected = selectedTasks[0];
  const secondSelected = selectedTasks[1];

  function renderTaskRow(
    task: (typeof rankedTasks)[number],
    index: number,
    category: "top" | "middle" | "bottom",
  ) {
    const isSelected = selected.includes(task.id);
    const isTop = category === "top";
    const isBottom = category === "bottom";

    return (
      <div key={task.id} className="task-row-shell">
        <div
          className={`task-row group ${isSelected ? "selected-row" : ""}`}
          style={{ "--row-index": index } as React.CSSProperties}
        >
          <div className="task-row-label flex min-w-0 items-center gap-2.5">
            <OriginMarker origin={task.origin} />
            <span className="min-w-0 flex-1 truncate text-[12px] font-medium tracking-[-0.01em] text-ink/78">{task.name}</span>
            <span className="task-row-score">{formatScore(task.currentScore)} ELO</span>
          </div>
          <div
            className="task-bar relative h-8 overflow-visible rounded-[1px] bg-ink/[0.045]"
            tabIndex={0}
            aria-describedby={`task-description-${task.id}`}
          >
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,transparent_0,transparent_calc(33.33%_-_1px),rgba(0,0,0,0.15)_33.33%,transparent_calc(33.33%_+_1px),transparent_calc(66.66%_-_1px),rgba(0,0,0,0.15)_66.66%,transparent_calc(66.66%_+_1px))]" />
            <div
              className="bar-fill absolute inset-y-0 left-0"
              style={{ width: getWidth(task.currentScore, scoreScaleMax), backgroundColor: task.color }}
            >
              <span className="bar-codename">
                <OriginMarker origin={task.origin} />
                <span>{task.codename}</span>
              </span>
            </div>
            {isSelected ? <span className="absolute inset-y-1 left-1 w-px bg-ink/45" /> : null}
            <p id={`task-description-${task.id}`} className="task-hover-description" role="tooltip">
              <span className="task-hover-name">{task.name}</span>
              <span className="task-hover-detail">{task.description}</span>
            </p>
          </div>
          <div className="category-actions" aria-label={`${task.name} category controls`}>
            <button
              type="button"
              onClick={() => moveTask(task.id, "top")}
              disabled={isTop}
              className={`category-button ${isTop ? "category-button-current" : ""}`}
              aria-label={`Move ${task.name} to top five`}
            >
              TOP
            </button>
            <button
              type="button"
              onClick={() => moveTask(task.id, "bottom")}
              disabled={isBottom}
              className={`category-button ${isBottom ? "category-button-current" : ""}`}
              aria-label={`Move ${task.name} to bottom five`}
            >
              BOTTOM
            </button>
            <button
              type="button"
              onClick={() => deleteTask(task.id)}
              className="category-button category-button-delete"
              aria-label={`Delete ${task.name}`}
            >
              DELETE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen px-5 py-8 sm:px-8 sm:py-12"
      aria-busy={!storageReady || !categoryStorageReady || !ledgerStorageReady || !remoteStorageReady}
      style={{ visibility: storageReady && categoryStorageReady && ledgerStorageReady && remoteStorageReady ? "visible" : "hidden" }}
    >
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-10 flex items-end justify-between border-b border-ink/15 pb-4">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-ink/45">Norré design</p>
            <h1 className="font-display text-4xl font-medium tracking-[-0.07em] text-ink sm:text-5xl">plan</h1>
          </div>
        </header>

        <section aria-label="Task rating" className="mx-auto mb-7 max-w-xl border-t border-ink/15 pt-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
            <button
              type="button"
              disabled={!firstSelected || !secondSelected}
              onClick={() => firstSelected && secondSelected && rate(firstSelected.id, secondSelected.id)}
              className="duel-button text-right"
            >
              <span className="block truncate">{firstSelected?.name ?? "—"}</span>
              <span className="mt-1 block font-mono text-[10px] text-coral">{firstSelected ? formatScore(firstSelected.currentScore) : ""}</span>
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35">vs</span>
            <button
              type="button"
              disabled={!firstSelected || !secondSelected}
              onClick={() => firstSelected && secondSelected && rate(secondSelected.id, firstSelected.id)}
              className="duel-button text-left"
            >
              <span className="block truncate">{secondSelected?.name ?? "—"}</span>
              <span className="mt-1 block font-mono text-[10px] text-coral">{secondSelected ? formatScore(secondSelected.currentScore) : ""}</span>
            </button>
          </div>
        </section>

        <section aria-label="Norre recreation plan" className="rounded-[2px] bg-white/55 px-4 py-5 shadow-[0_12px_45px_rgba(0,0,0,0.04)] sm:px-7 sm:py-7">
          <div className="mb-6 grid grid-cols-[minmax(148px,0.85fr)_minmax(0,2fr)] items-end gap-3 border-b border-ink/10 pb-3 sm:gap-5">
            <span aria-hidden="true" />
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-ink/35">
              <span>0</span>
              <span>500</span>
              <span>{formatScore(scoreScaleMax)}</span>
            </div>
          </div>

          <div className="category-board">
            <section className="category-section" aria-labelledby="top-five-title">
              <div className="category-section-header">
                <h2 id="top-five-title">Top 5</h2>
                <span>{topTasks.length} of 5</span>
              </div>
              <div className="category-rows">
                {topTasks.map((task, index) => renderTaskRow(task, index, "top"))}
              </div>
            </section>

            <section className="category-section" aria-labelledby="middle-tasks-title">
              <div className="category-section-header">
                <h2 id="middle-tasks-title">Middle</h2>
                <span>{middleTasks.length} tasks</span>
              </div>
              <div className="category-rows">
                {middleTasks.map((task, index) => renderTaskRow(task, index, "middle"))}
              </div>
            </section>

            <section className="category-section" aria-labelledby="bottom-five-title">
              <div className="category-section-header">
                <h2 id="bottom-five-title">Bottom 5</h2>
                <span>{bottomTasks.length} of 5</span>
              </div>
              <div className="category-rows">
                {bottomTasks.map((task, index) => renderTaskRow(task, index, "bottom"))}
              </div>
            </section>
          </div>

          <section aria-labelledby="time-elo-title" className="time-panel">
            <div className="time-panel-header">
              <div>
                <p className="section-kicker">Live score history</p>
                <h2 id="time-elo-title">Time × ELO</h2>
                <p className="time-panel-note">Each recorded action adds one equally spaced point.</p>
              </div>
              <div className="time-panel-controls">
                <div className="time-status" aria-live="polite">
                  <span className="live-pip" aria-hidden="true" />
                  <span>{formatTimelineTime(latestTimeSnapshot?.minute ?? INITIAL_TIME_MINUTES)}</span>
                  <span>{syncStatus === "live" ? "Live JSON" : syncStatus === "connecting" ? "Connecting" : "Local fallback"}</span>
                  <span>Last recorded</span>
                </div>
                <button type="button" className="record-snapshot-button" onClick={recordSnapshot}>
                  Record ELO snapshot
                </button>
              </div>
            </div>

            <div className="elo-chart-stage" aria-label="ELO scores over time for every task">
              <ResponsiveContainer
                width="100%"
                height="100%"
                initialDimension={{ width: 840, height: 350 }}
              >
                <LineChart data={chartData} margin={{ top: 12, right: 136, left: 42, bottom: 34 }}>
                  <CartesianGrid stroke="rgba(0,0,0,0.12)" strokeDasharray="1 3" />
                  <XAxis
                    dataKey="snapshot"
                    type="category"
                    interval={0}
                    tickFormatter={(value) => {
                      const snapshot = timeSeries[Number(value) - 1];
                      return snapshot ? formatTimelineTime(snapshot.minute) : String(value);
                    }}
                    axisLine={{ stroke: "#000000", strokeOpacity: 0.16 }}
                    tickLine={false}
                    tick={{ fill: "rgba(0,0,0,0.48)", fontFamily: "DM Mono", fontSize: 9 }}
                  />
                  <YAxis
                    domain={[MIN_SCORE, scoreScaleMax]}
                    ticks={scoreTicks}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgba(0,0,0,0.48)", fontFamily: "DM Mono", fontSize: 9 }}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ stroke: "#000000", strokeOpacity: 0.25, strokeDasharray: "2 3" }}
                    contentStyle={{
                      border: "1px solid rgba(0,0,0,0.18)",
                      borderRadius: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontFamily: "DM Mono",
                      fontSize: 9,
                    }}
                    labelStyle={{ color: "#000000", marginBottom: 5 }}
                    itemStyle={{ color: "#000000", padding: "1px 0" }}
                    labelFormatter={(label) => {
                      const snapshot = timeSeries[Number(label) - 1];
                      return snapshot ? formatTimelineTime(snapshot.minute) : String(label);
                    }}
                    formatter={(value, name) => [formatScore(Number(value)), String(name)]}
                  />
                  {visibleTasks.map((task) => {
                    const isSelected = selected.includes(task.id);
                    return (
                      <Line
                        key={task.id}
                        type="monotone"
                        dataKey={task.id}
                        name={task.codename}
                        stroke="#000000"
                        strokeOpacity={isSelected ? 1 : 0.22}
                        strokeWidth={isSelected ? 2 : 1}
                        dot={{
                          r: isSelected ? 4 : 2,
                          fill: "#000000",
                          stroke: "#ffffff",
                          strokeWidth: 1,
                        }}
                        activeDot={{ r: 5, fill: "#000000", stroke: "#ffffff", strokeWidth: 1 }}
                        isAnimationActive={false}
                        connectNulls
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>

            </div>

            <details className="ssot-ledger">
              <summary>
                <span className="ssot-ledger-title">Ledger / SSOT</span>
                <span className="ssot-ledger-meta">{ledger.length} values · {timeSeries.length} snapshots</span>
              </summary>
              <p className="ssot-ledger-rule">Snapshots are recorded manually; each click captures the current score once.</p>
              <div className="ssot-ledger-table-wrap">
                <table className="ssot-ledger-table">
                  <thead>
                    <tr>
                      <th scope="col">Task</th>
                      <th scope="col">Recorded</th>
                      <th scope="col">ELO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.slice().reverse().map((entry) => {
                      const task = taskById.get(entry.taskId);
                      if (!task) return null;
                      return (
                        <tr key={`${entry.taskId}-${entry.snapshotId}`}>
                          <td>
                            <span className="ledger-task-codename">
                              <OriginMarker origin={task.origin} />
                              <span>{task.codename}</span>
                            </span>
                            <span className="ledger-task-name">{task.name}</span>
                          </td>
                          <td>{formatTimelineTime(entry.minute)}</td>
                          <td>{formatScore(entry.elo)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

        </section>

      </div>

      <a
        className="version-badge"
        href={GIT_HISTORY_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Open Norra plan Git history"
      >
        <span className="version-badge-version">v16</span>
        <span className="version-badge-action">Git history <span aria-hidden="true">↗</span></span>
      </a>
    </main>
  );
}
