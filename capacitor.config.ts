import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.sanderbv.app",
  appName: "Sander",
  // Points to the live Vercel deployment — no static export needed
  server: {
    url: "https://sander-two.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#07090a",
    preferredContentMode: "mobile",
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    backgroundColor: "#07090a",
  },
  // Local web assets folder (used as fallback / for cap sync)
  webDir: "out",
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#07090a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#c8ff00",
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#07090a",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
}

export default config
