module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // NOTE: react-native-reanimated/plugin is intentionally omitted.
    // reanimated v4 with react-native-worklets handles this automatically.
    // Adding it manually causes "Cannot find module 'react-native-worklets/plugin'" error.
  };
};
