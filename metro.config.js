const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Disable expo-router compatibility check (we use react-navigation, not expo-router)
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = '1';

const config = getDefaultConfig(__dirname);

// Fix: react-native 0.85.x bug — VirtualViewNativeComponent.js has nested
// Readonly<{}> types that @react-native/babel-plugin-codegen Flow parser
// cannot handle, causing "Unable to determine event arguments for 'onModeChange'".
// We redirect the import to a safe stub since VirtualView is New Arch only.
const BUGGY_MODULE = path.join(
  'react-native',
  'src',
  'private',
  'components',
  'virtualview',
  'VirtualViewNativeComponent.js'
);
const STUB_PATH = path.resolve(__dirname, 'patches', 'VirtualViewNativeComponent.js');

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName.includes('VirtualViewNativeComponent') ||
        (context.originModulePath && context.originModulePath.includes('virtualview'))) {
      return {
        filePath: STUB_PATH,
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;

