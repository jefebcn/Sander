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
    backgroundColor: "#0b0b0c",
    preferredContentMode: "mobile",
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    backgroundColor: "#0b0b0c",
  },
  webDir: "out",
  plugins: {
    // Native Google sign-in (Google refuses OAuth inside the web view). Only
    // the Google provider is bundled: no Facebook SDK, nothing unused.
    SocialLogin: {
      providers: { google: true, facebook: false, apple: false, twitter: false },
      logLevel: 1,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0b0b0c",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#c6f736",
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#0b0b0c",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
}

export default config
