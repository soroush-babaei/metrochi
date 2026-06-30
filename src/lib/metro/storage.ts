// Local-storage favorites (offline, no backend).

const KEY_STATIONS = "metrochi:fav_stations";
const KEY_ROUTES = "metrochi:fav_routes";
const KEY_SETTINGS = "metrochi:settings";

export interface FavoriteRoute {
  id: string;
  from: string;
  to: string;
  mode: "fastest" | "least_transfers";
  createdAt: number;
}

export interface Settings {
  theme: "dark" | "light";
  accent: string; // hex color
  showIntermediateStations: boolean; // نمایش ایستگاه‌های بین راهی
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getFavStations: () => read<string[]>(KEY_STATIONS, []),
  setFavStations: (v: string[]) => write(KEY_STATIONS, v),
  getFavRoutes: () => read<FavoriteRoute[]>(KEY_ROUTES, []),
  setFavRoutes: (v: FavoriteRoute[]) => write(KEY_ROUTES, v),
  getSettings: () => read<Settings>(KEY_SETTINGS, { theme: "dark", accent: "#26ABE3", showIntermediateStations: true }),
  setSettings: (v: Settings) => write(KEY_SETTINGS, v),
};
