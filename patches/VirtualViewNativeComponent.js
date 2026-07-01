/**
 * Stub for VirtualViewNativeComponent.js
 *
 * The original file in react-native 0.85.x has nested Readonly<{}> types
 * in its DirectEventHandler that the @react-native/babel-plugin-codegen
 * Flow parser cannot handle, causing a SyntaxError during Metro bundling.
 *
 * This stub is safe because VirtualView is a New Architecture component
 * and is not used in Old Architecture mode (newArchEnabled: false).
 */

// $FlowIgnore - intentional stub
export default null;
