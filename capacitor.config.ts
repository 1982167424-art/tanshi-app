import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.textime.app',
  appName: '探时',
  webDir: 'dist',
  server: {
    url: 'https://textime.top',
    cleartext: false,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
