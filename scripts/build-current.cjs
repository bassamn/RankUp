const { spawnSync } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
let command;
let args;

if (process.platform === "win32") {
  command = "powershell.exe";
  args = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    path.join(__dirname, "build-windows.ps1")
  ];
} else {
  command = path.join(projectRoot, "node_modules", ".bin", "electron-builder");
  args = [process.platform === "darwin" ? "--mac" : "--linux"];
}

const result = spawnSync(command, args, {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
