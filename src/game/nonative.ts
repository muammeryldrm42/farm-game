// The YouTube build has no Android app around it: the Capacitor plugins are swapped for this (see
// next.config.mjs), so none of their code (cookies, native requests...) comes along. Everything
// that uses them asks Capacitor.isNativePlatform() first, so only that is ever called.
const none = () => Promise.reject(new Error('not in the Android app'));

export const Capacitor = { isNativePlatform: () => false, getPlatform: () => 'web' };
export const CapacitorHttp = { get: none };
export const App = { addListener: () => Promise.resolve({ remove: async () => {} }), minimizeApp: none };
export const LocalNotifications = {
  createChannel: none,
  getPending: none,
  cancel: none,
  removeAllDeliveredNotifications: none,
  checkPermissions: none,
  requestPermissions: none,
  schedule: none,
};
