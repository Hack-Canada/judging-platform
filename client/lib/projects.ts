import { getSql } from "@/lib/db";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type DatabaseTable = {
  schema: string;
  name: string;
  columns: string[];
};

export type Project = {
  id: string;
  name: string | null;
  project_name: string;
  team_name: string | null;
  members: string[];
  tracks: string[];
  devpost_link: string | null;
  submitted_at: string | null;
  created_at: string | null;
  raw: Record<string, JsonValue>;
};

export type ProjectScheduleSlot = {
  id: string;
  projectId: string;
  projectName: string;
  room: string;
  roomLocation: string | null;
  track: string | null;
  scheduledAt: string;
  durationMinutes: number;
  delayMinutes: number;
  status: string;
  project: Project;
};

export type ProjectsResult = {
  sourceTable: DatabaseTable | null;
  availableTables: DatabaseTable[];
  projects: Project[];
};

const PROJECT_NAME_COLUMNS = [
  "project_name",
  "project_title",
  "title",
  "name",
  "project",
];

const SUBMITTER_COLUMNS = [
  "submitter_name",
  "submitter",
  "owner_name",
  "creator_name",
  "contact_name",
  "author_name",
];

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function tableReference(table: DatabaseTable) {
  return `${quoteIdentifier(table.schema)}.${quoteIdentifier(table.name)}`;
}

function toJsonValue(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        toJsonValue(item),
      ])
    );
  }

  return String(value);
}

function toStringValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        // Fall through to delimiter parsing.
      }
    }

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return parsePostgresArray(trimmed);
    }

    return value
      .split(/[|,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parsePostgresArray(value: string): string[] {
  const body = value.slice(1, -1);
  const items: string[] = [];
  let current = "";
  let quoted = false;
  let escaping = false;

  for (const char of body) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\") {
      escaping = true;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      if (current && current !== "NULL") items.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current && current !== "NULL") items.push(current);

  return items.map((item) => item.trim()).filter(Boolean);
}

function firstString(
  row: Record<string, unknown>,
  columns: string[]
): { key: string; value: string } | null {
  for (const column of columns) {
    const value = toStringValue(row[column]);
    if (value) return { key: column, value };
  }

  return null;
}

function scoreProjectTable(table: DatabaseTable) {
  const tableName = table.name.toLowerCase();
  const schemaName = table.schema.toLowerCase();
  const columns = new Set(table.columns.map((column) => column.toLowerCase()));
  let score = 0;

  if (schemaName === "neon_auth" || schemaName === "auth" || schemaName === "storage") {
    return 0;
  }

  if (tableName === "projects") score += 300;
  if (tableName === "project_submissions_test") score += 25;
  if (tableName === "submissions") score += 90;
  if (tableName.includes("project")) score += 60;
  if (tableName.includes("submission")) score += 50;
  if (tableName.includes("entry")) score += 25;

  if (columns.has("project_name")) score += 50;
  if (columns.has("project_title")) score += 40;
  if (columns.has("devpost_link")) score += 35;
  if (columns.has("devpost_url")) score += 35;
  if (columns.has("git_repo")) score += 35;
  if (columns.has("team_name")) score += 25;
  if (columns.has("members")) score += 20;
  if (columns.has("team_members")) score += 20;
  if (columns.has("tracks")) score += 15;
  if (columns.has("award_categories")) score += 15;

  return score;
}

function findProjectTable(tables: DatabaseTable[]) {
  return tables
    .map((table) => ({ table, score: scoreProjectTable(table) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)[0]?.table ?? null;
}

function normalizeProject(row: Record<string, unknown>, index: number): Project {
  const projectName = firstString(row, PROJECT_NAME_COLUMNS);
  const submitterColumns =
    projectName?.key === "name" ? SUBMITTER_COLUMNS : [...SUBMITTER_COLUMNS, "name"];

  const raw = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, toJsonValue(value)])
  );

  return {
    id:
      firstString(row, ["id", "project_id", "submission_id"])?.value ??
      `row-${index + 1}`,
    name: firstString(row, submitterColumns)?.value ?? null,
    project_name: projectName?.value ?? `Project ${index + 1}`,
    team_name: firstString(row, ["team_name", "team", "teamName"])?.value ?? null,
    members: toStringArray(row.members ?? row.member_names ?? row.team_members),
    tracks: toStringArray(
      row.tracks ?? row.track ?? row.category ?? row.award_categories
    ),
    devpost_link:
      firstString(row, [
        "devpost_link",
        "devpost_url",
        "demo_url",
        "live_post_demo",
        "url",
        "link",
      ])?.value ??
      null,
    submitted_at:
      firstString(row, ["submitted_at", "submission_date", "created_at", "updated_at"])?.value ??
      null,
    created_at: firstString(row, ["created_at", "inserted_at"])?.value ?? null,
    raw,
  };
}

export async function getDatabaseTables(): Promise<DatabaseTable[]> {
  const sql = getSql();

  const rows = await sql`
    SELECT
      columns.table_schema,
      columns.table_name,
      array_agg(columns.column_name ORDER BY columns.ordinal_position) AS column_names
    FROM information_schema.columns
    INNER JOIN information_schema.tables
      ON tables.table_schema = columns.table_schema
      AND tables.table_name = columns.table_name
    WHERE columns.table_schema NOT IN ('information_schema', 'pg_catalog')
      AND columns.table_schema NOT LIKE 'pg_toast%'
      AND tables.table_type = 'BASE TABLE'
    GROUP BY columns.table_schema, columns.table_name
    ORDER BY columns.table_schema, columns.table_name
  `;

  return rows.map((row) => ({
    schema: String(row.table_schema),
    name: String(row.table_name),
    columns: toStringArray(row.column_names),
  }));
}

export async function getProjects(): Promise<ProjectsResult> {
  const sql = getSql();
  const availableTables = await getDatabaseTables();
  const sourceTable = findProjectTable(availableTables);

  if (!sourceTable) {
    return { sourceTable: null, availableTables, projects: [] };
  }

  const orderColumns = ["submitted_at", "created_at", "updated_at", "id"].filter((column) =>
    sourceTable.columns.includes(column)
  );
  const orderBy = orderColumns.length
    ? ` ORDER BY ${orderColumns
        .map((column) => `${quoteIdentifier(column)} DESC NULLS LAST`)
        .join(", ")}`
    : "";

  const rows = await sql`
    SELECT *
    FROM ${sql.unsafe(tableReference(sourceTable))}
    ${sql.unsafe(orderBy)}
  `;

  return {
    sourceTable,
    availableTables,
    projects: rows.map((row, index) => normalizeProject(row, index)),
  };
}

export async function getProjectScheduleSlots(
  availableTables?: DatabaseTable[]
): Promise<ProjectScheduleSlot[]> {
  const sql = getSql();
  const tables = availableTables ?? (await getDatabaseTables());
  const scheduleSlotsTable = tables.find(
    (table) => table.schema === "public" && table.name === "schedule_slots"
  );
  const hasRooms = tables.some(
    (table) => table.schema === "public" && table.name === "rooms"
  );
  const hasProjects = tables.some(
    (table) => table.schema === "public" && table.name === "projects"
  );

  if (!scheduleSlotsTable || !hasProjects) {
    return [];
  }

  const scheduleColumns = new Set(scheduleSlotsTable.columns);
  const hasRoomId = scheduleColumns.has("room_id");
  const hasRoomText = scheduleColumns.has("room");
  const hasDelayMinutes = scheduleColumns.has("delay_minutes");
  const hasStatus = scheduleColumns.has("status");

  if (!hasRoomText && (!hasRoomId || !hasRooms)) {
    return [];
  }

  const rows =
    hasRoomId && hasRooms
      ? hasDelayMinutes && hasStatus
        ? await sql`
            SELECT
              projects.*,
              schedule_slots.id AS schedule_slot_id,
              schedule_slots.project_id AS schedule_project_id,
              rooms.name AS schedule_room_name,
              rooms.location AS schedule_room_location,
              schedule_slots.track AS schedule_track,
              schedule_slots.scheduled_at AS schedule_scheduled_at,
              schedule_slots.duration_minutes AS schedule_duration_minutes,
              schedule_slots.delay_minutes AS schedule_delay_minutes,
              schedule_slots.status AS schedule_status
            FROM schedule_slots
            INNER JOIN projects ON projects.id = schedule_slots.project_id
            INNER JOIN rooms ON rooms.id = schedule_slots.room_id
            ORDER BY schedule_slots.scheduled_at ASC, rooms.name ASC, projects.project_name ASC
          `
        : await sql`
            SELECT
              projects.*,
              schedule_slots.id AS schedule_slot_id,
              schedule_slots.project_id AS schedule_project_id,
              rooms.name AS schedule_room_name,
              rooms.location AS schedule_room_location,
              schedule_slots.track AS schedule_track,
              schedule_slots.scheduled_at AS schedule_scheduled_at,
              schedule_slots.duration_minutes AS schedule_duration_minutes,
              0::int AS schedule_delay_minutes,
              'pending'::text AS schedule_status
            FROM schedule_slots
            INNER JOIN projects ON projects.id = schedule_slots.project_id
            INNER JOIN rooms ON rooms.id = schedule_slots.room_id
            ORDER BY schedule_slots.scheduled_at ASC, rooms.name ASC, projects.project_name ASC
          `
      : await sql`
          SELECT
            projects.*,
            schedule_slots.id AS schedule_slot_id,
            schedule_slots.project_id AS schedule_project_id,
            schedule_slots.room AS schedule_room_name,
            NULL::text AS schedule_room_location,
            schedule_slots.track AS schedule_track,
            schedule_slots.scheduled_at AS schedule_scheduled_at,
            schedule_slots.duration_minutes AS schedule_duration_minutes,
            0::int AS schedule_delay_minutes,
            'pending'::text AS schedule_status
          FROM schedule_slots
          INNER JOIN projects ON projects.id = schedule_slots.project_id
          ORDER BY schedule_slots.scheduled_at ASC, schedule_slots.room ASC, projects.project_name ASC
        `;

  return rows.map((row, index) => {
    const project = normalizeProject(row, index);
    const scheduledAt = toStringValue(row.schedule_scheduled_at);
    const durationMinutes = Number(row.schedule_duration_minutes ?? 5);
    const delayMinutes = Number(row.schedule_delay_minutes ?? 0);

    return {
      id: toStringValue(row.schedule_slot_id) ?? `${project.id}-${index}`,
      projectId: toStringValue(row.schedule_project_id) ?? project.id,
      projectName: project.project_name,
      room: toStringValue(row.schedule_room_name) ?? "Room TBD",
      roomLocation: toStringValue(row.schedule_room_location),
      track: toStringValue(row.schedule_track),
      scheduledAt: scheduledAt ?? new Date().toISOString(),
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : 5,
      delayMinutes: Number.isFinite(delayMinutes) ? delayMinutes : 0,
      status: toStringValue(row.schedule_status) ?? "pending",
      project,
    };
  });
}
