import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tensiku.app',
  appName: 'tensi.ku',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
