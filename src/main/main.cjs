const { app, BrowserWindow, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { RankUpDatabase } = require("../db/database.cjs");

let mainWindow;
let database;

function assertString(value, label, maxLength = 200) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maxLength) throw new Error(`${label} is too long.`);
  return normalized;
}

function assertId(value, label = "ID") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error(`Invalid ${label}.`);
  return id;
}

function assertDate(value, label = "date") {
  const date = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid ${label}.`);
  return date;
}

function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

function systemTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function dateInTimezone(timezone, instant = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayOfWeek(dateString) {
  const day = new Date(`${dateString}T12:00:00Z`).getUTCDay();
  return shiftDate(dateString, -(day === 0 ? 6 : day - 1));
}

async function currentDateContext() {
  const timezone = (await database.getSetting("timezone")) || systemTimezone();
  const today = dateInTimezone(timezone);
  return { timezone, today, weekStart: mondayOfWeek(today) };
}

function registerIpcHandlers() {
  ipcMain.handle("settings:get", async () => {
    const timezone = await database.getSetting("timezone");
    const dailyGoalValue = await database.getSetting("daily_goal_minutes");
    return {
      timezone: timezone || null,
      detectedTimezone: systemTimezone(),
      dailyGoalMinutes: dailyGoalValue === "none"
        ? null
        : Number(dailyGoalValue || 240)
    };
  });

  ipcMain.handle("settings:set-timezone", async (_event, timezoneValue) => {
    const timezone = assertString(timezoneValue, "Timezone", 100);
    if (!isValidTimezone(timezone)) throw new Error("That timezone is not supported.");
    await database.setSetting("timezone", timezone);
    return { timezone, today: dateInTimezone(timezone) };
  });

  ipcMain.handle("settings:set-daily-goal", async (_event, goalValue) => {
    if (goalValue === null || goalValue === "none") {
      await database.setSetting("daily_goal_minutes", "none");
      return { dailyGoalMinutes: null };
    }
    const minutes = Number(goalValue);
    const allowedGoals = new Set([120, 240, 480, 600]);
    if (!allowedGoals.has(minutes)) throw new Error("Invalid daily focus goal.");
    await database.setSetting("daily_goal_minutes", String(minutes));
    return { dailyGoalMinutes: minutes };
  });

  ipcMain.handle("date:context", () => currentDateContext());

  ipcMain.handle("topics:list", async () => database.listTopics(await currentDateContext()));

  ipcMain.handle("topics:create", (_event, nameValue) => {
    const name = assertString(nameValue, "Topic name", 80);
    return database.createTopic(name);
  });

  ipcMain.handle("topics:update", async (_event, idValue, nameValue) => {
    const id = assertId(idValue, "topic ID");
    const name = assertString(nameValue, "Topic name", 80);
    const topic = await database.updateTopic(id, name);
    if (!topic) throw new Error("Topic not found.");
    return topic;
  });

  ipcMain.handle("topics:delete", (_event, idValue) =>
    database.deleteTopic(assertId(idValue, "topic ID"))
  );

  ipcMain.handle("time:add", async (_event, payload = {}) => {
    const topicId = assertId(payload.topicId, "topic ID");
    const durationSeconds = Math.floor(Number(payload.durationSeconds));
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 31536000) {
      throw new Error("Invalid session duration.");
    }
    const { timezone } = await currentDateContext();
    const date = dateInTimezone(timezone);
    return database.addTimeLog(topicId, durationSeconds, date);
  });

  ipcMain.handle("todos:list", (_event, filters = {}) =>
    database.listTodos({
      topicId: filters.topicId ? assertId(filters.topicId, "topic ID") : null,
      dueDate: filters.dueDate ? assertDate(filters.dueDate, "due date") : null,
      completed: typeof filters.completed === "boolean" ? filters.completed : undefined
    })
  );

  ipcMain.handle("todos:create", (_event, payload = {}) =>
    database.createTodo(
      assertId(payload.topicId, "topic ID"),
      assertString(payload.taskText, "Task", 300),
      payload.dueDate ? assertDate(payload.dueDate, "due date") : null
    )
  );

  ipcMain.handle("todos:complete", (_event, idValue) =>
    database.completeTodo(assertId(idValue, "to-do ID"), new Date().toISOString())
  );

  ipcMain.handle("todos:delete", (_event, idValue) =>
    database.deleteTodo(assertId(idValue, "to-do ID"))
  );

  ipcMain.handle("analytics:get", async (_event, filters = {}) => {
    const { today } = await currentDateContext();
    const startDate = filters.startDate ? assertDate(filters.startDate, "start date") : shiftDate(today, -29);
    const endDate = filters.endDate ? assertDate(filters.endDate, "end date") : today;
    if (startDate > endDate) throw new Error("Start date must not be after end date.");
    return database.analytics({
      startDate,
      endDate,
      topicId: filters.topicId ? assertId(filters.topicId, "topic ID") : null
    });
  });
}

function createWindow() {
  const screenshotPath = process.env.RANKUP_SCREENSHOT_PATH;
  const windowIcon = app.isPackaged
    ? path.join(process.resourcesPath, "icon.png")
    : path.join(__dirname, "../../build/icon.png");
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: "#0d0f12",
    icon: windowIcon,
    title: "RankUp",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.once("ready-to-show", () => {
    if (!screenshotPath) mainWindow.show();
  });
  if (screenshotPath) {
    mainWindow.webContents.once("did-finish-load", () => {
      setTimeout(async () => {
        const image = await mainWindow.webContents.capturePage();
        fs.writeFileSync(screenshotPath, image.toPNG());
        app.quit();
      }, 3000);
    });
    mainWindow.webContents.once("did-fail-load", (_event, code, description) => {
      console.error(`Renderer failed to load (${code}): ${description}`);
      app.exit(1);
    });
  }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../dist/renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  database = await RankUpDatabase.create(path.join(app.getPath("userData"), "rankup.db"));
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (database) database.close();
});
