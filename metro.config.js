const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx', 'js', 'jsx', 'json'];
config.resolver.assetExts.push('tflite', 'bin', 'task');

module.exports = config;
