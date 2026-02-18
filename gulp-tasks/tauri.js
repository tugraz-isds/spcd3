const {series} = require("gulp");
const { spawn } = require("child_process");
const fg = require("fast-glob");
const fs = require("fs/promises");
const path = require("path");

function runTauriBuild() {
  return new Promise((resolve, reject) => {
    const p = spawn("npx", ["tauri", "build"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tauri build failed (exit ${code})`));
    });

    p.on("error", reject);
  });
}

function platformFolder() {
  if (process.platform === "win32") return "win";
  if (process.platform === "darwin") return "mac";
  if (process.platform === "linux") return "linux";
  return process.platform;
}

async function copyExactlyOneFile(pattern, outDir) {
  const matches = await fg([pattern], { onlyFiles: true });
  if (matches.length !== 1) {
    throw new Error(`Expected exactly 1 file for pattern "${pattern}", got ${matches.length}:\n${matches.join("\n")}`);
  }

  await fs.mkdir(outDir, { recursive: true });

  const src = matches[0];
  const dest = path.join(outDir, path.basename(src));

  await fs.copyFile(src, dest);

  if (process.platform === "linux" && dest.endsWith(".AppImage")) {
    await fs.chmod(dest, 0o755);
  }
}

async function copyTauriExecutable() {
  const outDir = path.join("package", platformFolder());

  if (process.platform === "darwin") {
    return copyExactlyOneFile("src-tauri/target/**/release/bundle/dmg/*.dmg", outDir);
  }
  if (process.platform === "win32") {
    return copyExactlyOneFile("src-tauri/target/**/release/*.exe", outDir);
  }
  if (process.platform === "linux") {
    return copyExactlyOneFile("src-tauri/target/**/release/bundle/appimage/*.AppImage", outDir);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

const tauriBuild = series(runTauriBuild, copyTauriExecutable);

module.exports = { tauriBuild };
