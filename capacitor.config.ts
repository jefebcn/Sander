import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.sanderbv.app",
  appName: "Sander",
  server: {
    url: "https://www.sanderbv.it",
    cleartext: false,
    // Allow navigation within both the main domain and Vercel preview
    allowNavigation: ["sanderbv.it", "*.sanderbv.it", "sander-two.vercel.app"],
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
