import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tensi.ku',
  appName: 'tensi.ku',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
