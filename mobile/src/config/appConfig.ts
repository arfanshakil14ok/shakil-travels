import { Platform } from 'react-native';

/**
 * Global Configuration for SHAKIL TRAVELS Android App
 */
export const APP_CONFIG = {
  appName: 'SHAKIL TRAVELS',
  tagline: 'Govt Approved Overseas Recruiting Agency',
  license: 'RL-1558',
  hotline: '+880 1711-000000',
  whatsapp: '+880 1711-000000',
  
  // URLs:
  // - On Web: http://localhost:3000
  // - On Android Emulator: http://10.0.2.2:3000
  // - On Physical Android Phone via Wi-Fi: http://192.168.0.127:3000
  // - Production: https://shakiltravels.com
  baseUrl: Platform.select({
    web: 'http://localhost:3000',
    android: 'http://10.0.2.2:3000', // Falls back to local IP if needed
    default: 'http://localhost:3000',
  }),

  // Fallback network URL for physical Android phones on the same Wi-Fi
  lanUrl: 'http://192.168.0.127:3000',
  productionUrl: 'https://shakiltravels.com',

  // Fast navigation shortcuts
  routes: {
    home: '/',
    jobs: '/jobs',
    tracking: '/track',
    portal: '/portal',
    portalLogin: '/portal/login',
    portalRegister: '/portal/register',
    verifyInvoice: '/verify/invoice',
    verifyCert: '/verify-certificate',
    scamAwareness: '/scam-awareness',
    contact: '/contact',
  },
};
