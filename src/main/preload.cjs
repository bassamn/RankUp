const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rankup", {
  getDateContext: () => ipcRenderer.invoke("date:context"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setTimezone: (timezone) => ipcRenderer.invoke("settings:set-timezone", timezone),
  setDailyGoal: (minutes) => ipcRenderer.invoke("settings:set-daily-goal", minutes),

  listTopics: () => ipcRenderer.invoke("topics:list"),
  createTopic: (name) => ipcRenderer.invoke("topics:create", name),
  updateTopic: (id, name) => ipcRenderer.invoke("topics:update", id, name),
  deleteTopic: (id) => ipcRenderer.invoke("topics:delete", id),

  addTimeLog: (payload) => ipcRenderer.invoke("time:add", payload),

  listTodos: (filters) => ipcRenderer.invoke("todos:list", filters),
  createTodo: (payload) => ipcRenderer.invoke("todos:create", payload),
  completeTodo: (id) => ipcRenderer.invoke("todos:complete", id),
  deleteTodo: (id) => ipcRenderer.invoke("todos:delete", id),

  getAnalytics: (filters) => ipcRenderer.invoke("analytics:get", filters)
});
