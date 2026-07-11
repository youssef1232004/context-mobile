const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withFirebaseManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // Ensure xmlns:tools is present in the manifest tag
    if (!androidManifest.manifest.$['xmlns:tools']) {
      androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const app = androidManifest.manifest.application[0];
    
    if (app['meta-data']) {
      const colorMeta = app['meta-data'].find(
        (m) => m.$['android:name'] === 'com.google.firebase.messaging.default_notification_color'
      );
      if (colorMeta) {
        colorMeta.$['tools:replace'] = 'android:resource';
      }
    }
    return config;
  });
};
