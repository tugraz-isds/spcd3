type SvgDownloadSettings = {
  decimals: number;
  keepClasses: boolean;
  includeUiControls: boolean;
  includeDataValues: boolean;
  convertSymbolsToPaths: boolean;
};

type ExampleUiSettings = {
  selectionSensitivityRem: number;
  dimensionSpacingRem: number;
  zoomFactor: number;
};

const SVG_DOWNLOAD_SETTINGS_KEY = "spcd3:svg-download-settings";
const EXAMPLE_UI_SETTINGS_KEY = "spcd3:example-ui-settings";
const TAURI_SVG_SAVE_DIRECTORY_KEY = "spcd3:tauri-svg-save-directory";

const DEFAULT_SVG_DOWNLOAD_SETTINGS: SvgDownloadSettings = {
  decimals: 2,
  keepClasses: true,
  includeUiControls: true,
  includeDataValues: true,
  convertSymbolsToPaths: false,
};

const DEFAULT_EXAMPLE_UI_SETTINGS: ExampleUiSettings = {
  selectionSensitivityRem: 0.4,
  dimensionSpacingRem: 6,
  zoomFactor: 1,
};

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return fallback;
    return { ...fallback, ...JSON.parse(rawValue) } as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } 
  catch {}
}

export function getSvgDownloadSettings(): SvgDownloadSettings {
  return readJson(SVG_DOWNLOAD_SETTINGS_KEY, DEFAULT_SVG_DOWNLOAD_SETTINGS);
}

export function setSvgDownloadSettings(
  settings: SvgDownloadSettings,
): void {
  writeJson(SVG_DOWNLOAD_SETTINGS_KEY, settings);
}

export function getExampleUiSettings(): ExampleUiSettings {
  return readJson(EXAMPLE_UI_SETTINGS_KEY, DEFAULT_EXAMPLE_UI_SETTINGS);
}

export function setExampleUiSettings(settings: ExampleUiSettings): void {
  writeJson(EXAMPLE_UI_SETTINGS_KEY, settings);
}

export function getTauriSvgSaveDirectory(): string | null {
  if (!canUseLocalStorage()) return null;

  try {
    return window.localStorage.getItem(TAURI_SVG_SAVE_DIRECTORY_KEY);
  } catch {
    return null;
  }
}

export function setTauriSvgSaveDirectory(directory: string): void {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(TAURI_SVG_SAVE_DIRECTORY_KEY, directory);
  } 
  catch {}
}
