const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const fs = require("node:fs");
const path = require("node:path");

class RankUpDatabase {
  static async create(databasePath) {
    const instance = new RankUpDatabase();
    instance.db = await open({ filename: databasePath, driver: sqlite3.Database });
    await instance.initialize();
    return instance;
  }

  async initialize() {
    await this.db.exec("PRAGMA journal_mode = WAL");
    await this.db.exec("PRAGMA foreign_keys = ON");
    const schemaPath = path.join(__dirname, "schema.sql");
    await this.db.exec(fs.readFileSync(schemaPath, "utf8"));
    await this.migrate();
  }

  async migrate() {
    const todoColumns = await this.db.all("PRAGMA table_info(todos)");
    if (!todoColumns.some((column) => column.name === "due_date")) {
      await this.db.exec("ALTER TABLE todos ADD COLUMN due_date TEXT");
    }
  }

  async getSetting(key) {
    return (await this.db.get("SELECT value FROM settings WHERE key = ?", key))?.value;
  }

  async setSetting(key, value) {
    await this.db.run(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value
    );
    return { key, value };
  }

  async listTopics({ today, weekStart }) {
    return this.db.all(
      `SELECT
        t.id,
        t.name,
        t.created_at,
        COALESCE(SUM(l.duration_seconds), 0) AS total_seconds,
        COALESCE(SUM(CASE WHEN l.date = :today THEN l.duration_seconds ELSE 0 END), 0) AS today_seconds,
        COALESCE(SUM(CASE WHEN l.date BETWEEN :weekStart AND :today THEN l.duration_seconds ELSE 0 END), 0) AS week_seconds
      FROM topics t
      LEFT JOIN time_logs l ON l.topic_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC, t.id DESC`,
      { ":today": today, ":weekStart": weekStart }
    );
  }

  async createTopic(name) {
    const result = await this.db.run("INSERT INTO topics (name) VALUES (?)", name);
    return this.db.get("SELECT * FROM topics WHERE id = ?", result.lastID);
  }

  async updateTopic(id, name) {
    await this.db.run("UPDATE topics SET name = ? WHERE id = ?", name, id);
    return this.db.get("SELECT * FROM topics WHERE id = ?", id);
  }

  async deleteTopic(id) {
    return { deleted: (await this.db.run("DELETE FROM topics WHERE id = ?", id)).changes > 0 };
  }

  async addTimeLog(topicId, durationSeconds, date) {
    const result = await this.db.run(
      "INSERT INTO time_logs (topic_id, duration_seconds, date) VALUES (?, ?, ?)",
      topicId,
      durationSeconds,
      date
    );
    return this.db.get("SELECT * FROM time_logs WHERE id = ?", result.lastID);
  }

  async listTodos({ topicId, dueDate, completed }) {
    const clauses = [];
    const params = {};
    if (topicId) {
      clauses.push("td.topic_id = :topicId");
      params[":topicId"] = topicId;
    }
    if (dueDate) {
      clauses.push("td.due_date = :dueDate");
      params[":dueDate"] = dueDate;
    }
    if (typeof completed === "boolean") {
      clauses.push("td.is_completed = :completed");
      params[":completed"] = completed ? 1 : 0;
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    return this.db.all(
      `SELECT td.*, t.name AS topic_name
       FROM todos td
       JOIN topics t ON t.id = td.topic_id
       ${where}
       ORDER BY
         CASE WHEN td.due_date IS NULL THEN 1 ELSE 0 END,
         td.due_date ASC,
         td.created_at DESC`,
      params
    );
  }

  async createTodo(topicId, taskText, dueDate) {
    const result = await this.db.run(
      "INSERT INTO todos (topic_id, task_text, due_date) VALUES (?, ?, ?)",
      topicId,
      taskText,
      dueDate || null
    );
    return this.db.get("SELECT * FROM todos WHERE id = ?", result.lastID);
  }

  async completeTodo(id, completedAt) {
    await this.db.run("UPDATE todos SET is_completed = 1, completed_at = ? WHERE id = ?", completedAt, id);
    return this.db.get("SELECT * FROM todos WHERE id = ?", id);
  }

  async deleteTodo(id) {
    return { deleted: (await this.db.run("DELETE FROM todos WHERE id = ?", id)).changes > 0 };
  }

  async analytics({ startDate, endDate, topicId }) {
    const topicClause = topicId ? "AND l.topic_id = :topicId" : "";
    const params = { ":startDate": startDate, ":endDate": endDate };
    if (topicId) params[":topicId"] = topicId;
    const daily = await this.db.all(
      `SELECT l.date, t.id AS topic_id, t.name AS topic_name,
              SUM(l.duration_seconds) AS duration_seconds
       FROM time_logs l
       JOIN topics t ON t.id = l.topic_id
       WHERE l.date BETWEEN :startDate AND :endDate ${topicClause}
       GROUP BY l.date, t.id
       ORDER BY l.date ASC, t.name ASC`,
      params
    );
    const byTopic = await this.db.all(
      `SELECT t.id AS topic_id, t.name AS topic_name,
              SUM(l.duration_seconds) AS duration_seconds
       FROM time_logs l
       JOIN topics t ON t.id = l.topic_id
       WHERE l.date BETWEEN :startDate AND :endDate ${topicClause}
       GROUP BY t.id
       ORDER BY duration_seconds DESC`,
      params
    );
    const monthly = await this.db.all(
      `SELECT substr(l.date, 1, 7) AS month,
              SUM(l.duration_seconds) AS duration_seconds
       FROM time_logs l
       WHERE l.date BETWEEN :startDate AND :endDate ${topicClause}
       GROUP BY month
       ORDER BY month ASC`,
      params
    );
    const totals = await this.db.get(
      `SELECT COALESCE(SUM(l.duration_seconds), 0) AS total_seconds,
              COUNT(DISTINCT l.date) AS active_days,
              COUNT(l.id) AS sessions
       FROM time_logs l
       WHERE l.date BETWEEN :startDate AND :endDate ${topicClause}`,
      params
    );
    return {
      daily,
      byTopic,
      monthly,
      totalSeconds: totals.total_seconds,
      activeDays: totals.active_days,
      sessions: totals.sessions
    };
  }

  async close() {
    await this.db.close();
  }
}

module.exports = { RankUpDatabase };
