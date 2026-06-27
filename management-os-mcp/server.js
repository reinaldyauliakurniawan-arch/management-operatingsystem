import express from "express";
import mysql from "mysql2/promise";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// Config — Laragon default: host 127.0.0.1, port 3306, user root, no password.
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME; // required, no sane default

if (!DB_NAME) {
  console.error("Missing DB_NAME env var. Set it to your Laravel app's database name.");
  process.exit(1);
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || null;

const DENYLIST = new Set([
  "users", "sessions", "password_reset_tokens", "personal_access_tokens",
  "cache", "cache_locks", "jobs", "job_batches", "failed_jobs", "migrations",
]);

const pool = mysql.createPool({
  host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
});

async function listAllTableNames() {
  const [rows] = await pool.query(
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ?",
    [DB_NAME]
  );
  return rows.map((r) => r.name);
}

async function assertAllowedTable(table) {
  if (typeof table !== "string" || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  const all = await listAllTableNames();
  if (!all.includes(table)) {
    throw new Error(`Table "${table}" does not exist. Use list_tables to see available tables.`);
  }
  if (DENYLIST.has(table)) {
    throw new Error(`Table "${table}" is not accessible through this server (sensitive/internal table).`);
  }
  return table;
}

async function getColumns(table) {
  const [rows] = await pool.query(
    `SELECT column_name AS name, data_type AS type, is_nullable AS nullable,
            column_default AS \`default\`, column_key AS \`key\`
     FROM information_schema.columns
     WHERE table_schema = ? AND table_name = ?
     ORDER BY ordinal_position`,
    [DB_NAME, table]
  );
  return rows;
}

function nowMysql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

async function sanitizeData(table, data, { forCreate }) {
  const columns = await getColumns(table);
  const columnNames = new Set(columns.map((c) => c.name));
  const pkColumn = columns.find((c) => c.key === "PRI")?.name;

  const clean = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (key === pkColumn) continue;
    if (!columnNames.has(key)) {
      throw new Error(`Unknown column "${key}" on table "${table}". Use describe_table to see valid columns.`);
    }
    clean[key] = typeof value === "boolean" ? (value ? 1 : 0) : value;
  }

  if (forCreate && columnNames.has("created_at") && clean.created_at === undefined) {
    clean.created_at = nowMysql();
  }
  if (columnNames.has("updated_at") && clean.updated_at === undefined) {
    clean.updated_at = nowMysql();
  }
  return clean;
}

// ponytail: table/column names are checked against information_schema before
// reaching SQL (assertAllowedTable / sanitizeData), so backtick-wrapping here
// is correct quoting, not the injection guard. Don't reuse q() on raw input.
const q = (id) => `\`${id}\``;

function buildServer() {
  const server = new McpServer(
    { name: "management-os-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.registerTool(
    "list_tables",
    { description: "List all tables available for CRUD (sensitive tables like users/sessions are hidden).", inputSchema: {} },
    async () => {
      const tables = (await listAllTableNames()).filter((t) => !DENYLIST.has(t));
      return { content: [{ type: "text", text: JSON.stringify(tables, null, 2) }] };
    }
  );

  server.registerTool(
    "describe_table",
    { description: "Show columns (name, type, nullable, default, primary key) for a table.", inputSchema: { table: z.string() } },
    async ({ table }) => {
      await assertAllowedTable(table);
      return { content: [{ type: "text", text: JSON.stringify(await getColumns(table), null, 2) }] };
    }
  );

  server.registerTool(
    "list_records",
    {
      description: "List rows from a table, optionally filtered by exact-match column values. Supports pagination.",
      inputSchema: {
        table: z.string(),
        filters: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
        limit: z.number().int().min(1).max(500).default(50),
        offset: z.number().int().min(0).default(0),
      },
    },
    async ({ table, filters, limit, offset }) => {
      await assertAllowedTable(table);
      const columns = new Set((await getColumns(table)).map((c) => c.name));
      const whereParts = [];
      const params = [];
      for (const [key, value] of Object.entries(filters || {})) {
        if (!columns.has(key)) throw new Error(`Unknown filter column "${key}" on table "${table}".`);
        whereParts.push(`${q(key)} = ?`);
        params.push(typeof value === "boolean" ? (value ? 1 : 0) : value);
      }
      const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
      const [rows] = await pool.query(`SELECT * FROM ${q(table)} ${whereSql} LIMIT ? OFFSET ?`, [...params, limit, offset]);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }
  );

  server.registerTool(
    "get_record",
    { description: "Get a single row by primary key id.", inputSchema: { table: z.string(), id: z.union([z.number(), z.string()]) } },
    async ({ table, id }) => {
      await assertAllowedTable(table);
      const pk = (await getColumns(table)).find((c) => c.key === "PRI")?.name || "id";
      const [rows] = await pool.query(`SELECT * FROM ${q(table)} WHERE ${q(pk)} = ?`, [id]);
      if (!rows[0]) return { content: [{ type: "text", text: `No row found in "${table}" with id ${id}.` }] };
      return { content: [{ type: "text", text: JSON.stringify(rows[0], null, 2) }] };
    }
  );

  server.registerTool(
    "create_record",
    { description: "Insert a row. 'data' keys must match real columns. created_at/updated_at auto-filled if omitted.", inputSchema: { table: z.string(), data: z.record(z.any()) } },
    async ({ table, data }) => {
      await assertAllowedTable(table);
      const clean = await sanitizeData(table, data, { forCreate: true });
      const keys = Object.keys(clean);
      if (keys.length === 0) throw new Error("No valid columns provided in 'data'.");
      const [info] = await pool.query(
        `INSERT INTO ${q(table)} (${keys.map(q).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
        keys.map((k) => clean[k])
      );
      const pk = (await getColumns(table)).find((c) => c.key === "PRI")?.name || "id";
      const [rows] = await pool.query(`SELECT * FROM ${q(table)} WHERE ${q(pk)} = ?`, [info.insertId]);
      return { content: [{ type: "text", text: JSON.stringify(rows[0], null, 2) }] };
    }
  );

  server.registerTool(
    "update_record",
    { description: "Update a row by id. Only given columns change. updated_at refreshed automatically.", inputSchema: { table: z.string(), id: z.union([z.number(), z.string()]), data: z.record(z.any()) } },
    async ({ table, id, data }) => {
      await assertAllowedTable(table);
      const clean = await sanitizeData(table, data, { forCreate: false });
      const keys = Object.keys(clean);
      if (keys.length === 0) throw new Error("No valid columns provided in 'data'.");
      const pk = (await getColumns(table)).find((c) => c.key === "PRI")?.name || "id";
      const [info] = await pool.query(
        `UPDATE ${q(table)} SET ${keys.map((k) => `${q(k)} = ?`).join(", ")} WHERE ${q(pk)} = ?`,
        [...keys.map((k) => clean[k]), id]
      );
      if (info.affectedRows === 0) return { content: [{ type: "text", text: `No row found in "${table}" with id ${id}.` }] };
      const [rows] = await pool.query(`SELECT * FROM ${q(table)} WHERE ${q(pk)} = ?`, [id]);
      return { content: [{ type: "text", text: JSON.stringify(rows[0], null, 2) }] };
    }
  );

  server.registerTool(
    "delete_record",
    { description: "Delete by id. Soft-deletes if table has 'deleted_at' (Laravel SoftDeletes), unless hard=true.", inputSchema: { table: z.string(), id: z.union([z.number(), z.string()]), hard: z.boolean().default(false) } },
    async ({ table, id, hard }) => {
      await assertAllowedTable(table);
      const columns = await getColumns(table);
      const pk = columns.find((c) => c.key === "PRI")?.name || "id";
      const hasSoftDelete = columns.some((c) => c.name === "deleted_at");

      if (hasSoftDelete && !hard) {
        const [info] = await pool.query(
          `UPDATE ${q(table)} SET ${q("deleted_at")} = ? WHERE ${q(pk)} = ? AND deleted_at IS NULL`,
          [nowMysql(), id]
        );
        if (info.affectedRows === 0) return { content: [{ type: "text", text: `No active row found in "${table}" with id ${id}.` }] };
        return { content: [{ type: "text", text: `Soft-deleted row ${id} from "${table}".` }] };
      }

      const [info] = await pool.query(`DELETE FROM ${q(table)} WHERE ${q(pk)} = ?`, [id]);
      if (info.affectedRows === 0) return { content: [{ type: "text", text: `No row found in "${table}" with id ${id}.` }] };
      return { content: [{ type: "text", text: `Permanently deleted row ${id} from "${table}".` }] };
    }
  );

  return server;
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  if (!AUTH_TOKEN) return next();
  if (req.headers["authorization"] === `Bearer ${AUTH_TOKEN}`) return next();
  res.status(401).json({ error: "Unauthorized" });
});

app.post("/mcp", async (req, res) => {
  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => { transport.close(); server.close(); });
  } catch (err) {
    console.error("Error handling MCP request:", err);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: err.message || "Internal server error" }, id: null });
    }
  }
});

app.get("/mcp", (req, res) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
});

app.get("/health", async (req, res) => {
  try {
    res.json({ ok: true, database: DB_NAME, tableCount: (await listAllTableNames()).length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`management-os-mcp listening on http://localhost:${PORT}/mcp`);
  console.log(`Using MySQL database: ${DB_NAME}@${DB_HOST}:${DB_PORT}`);
  if (AUTH_TOKEN) console.log("Bearer auth ENABLED.");
  else console.log("Bearer auth DISABLED (MCP_AUTH_TOKEN not set).");
});
