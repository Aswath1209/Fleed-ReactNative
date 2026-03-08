const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidArch(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('abiFilters "arm64-v8a"')) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      /defaultConfig\s*\{/,
      `defaultConfig {\n        ndk {\n            abiFilters "arm64-v8a"\n        }`
    );
    return config;
  });
};
