const { series } = require("gulp");
const { spawn } = require("child_process");
const fg = require("fast-glob");
const fs = require("fs/promises");
const path = require("path");

function runTauriBuild() {
  return new Promise((resolve, reject) => {
    const args = ["tauri", "build"];
    const bundleTargets = process.env.TAURI_BUNDLES;

    if (bundleTargets) {
      args.push("--bundles", bundleTargets);
    }

    const tauriBin = path.resolve(
      __dirname,
      "..",
      "node_modules",
      ".bin",
      process.platform === "win32" ? "tauri.cmd" : "tauri",
    );
    const p = spawn(tauriBin, args.slice(1), {
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

async function copyArtifact(src, outDir) {
  const dest = path.join(outDir, path.basename(src));
  const stats = await fs.stat(src);

  if (stats.isDirectory()) {
    await fs.rm(dest, { recursive: true, force: true });
    await fs.cp(src, dest, { recursive: true });
    return;
  }

  await fs.copyFile(src, dest);

  if (
    process.platform === "linux" &&
    (dest.endsWith(".AppImage") || path.extname(dest) === "")
  ) {
    await fs.chmod(dest, 0o755);
  }
}

async function collectArtifacts(patterns, outDir) {
  const matches = await fg(patterns, {
    onlyFiles: false,
    markDirectories: false,
    unique: true,
  });

  if (matches.length === 0) {
    throw new Error(
      `No build artifacts found for ${process.platform} using patterns:\n${patterns.join("\n")}`,
    );
  }

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  for (const match of matches.sort()) {
    await copyArtifact(match, outDir);
  }
}

async function copyTauriExecutable() {
  const outDir = path.join("package", platformFolder());

  if (process.platform === "darwin") {
    return collectArtifacts(
      [
        "src-tauri/target/**/release/spcd3",
        "src-tauri/target/**/release/bundle/macos/*.app",
        "src-tauri/target/**/release/bundle/dmg/*.dmg",
      ],
      outDir,
    );
  }
  if (process.platform === "win32") {
    return collectArtifacts(
      [
        "src-tauri/target/**/release/*.exe",
        "src-tauri/target/**/release/bundle/msi/*.msi",
        "src-tauri/target/**/release/bundle/nsis/*.exe",
      ],
      outDir,
    );
  }
  if (process.platform === "linux") {
    return collectArtifacts(
      [
        "src-tauri/target/**/release/spcd3",
        "src-tauri/target/**/release/bundle/appimage/*",
        "src-tauri/target/**/release/bundle/deb/*",
        "src-tauri/target/**/release/bundle/rpm/*",
      ],
      outDir,
    );
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

const tauriBuild = series(runTauriBuild, copyTauriExecutable);

module.exports = { tauriBuild };
