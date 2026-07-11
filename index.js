import { registerRootComponent } from 'expo';
import { fcmService } from './src/services/fcmService';

import App from './App';

// Setup FCM Background Handler
fcmService.setupBackgroundHandler();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

