import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.metrochi.app",
  appName: "Metrochi",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
