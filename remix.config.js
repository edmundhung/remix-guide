/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  appDirectory: 'app',
  browserBuildDirectory: 'public/build',
  publicPath: '/build/',
  serverBuildDirectory: 'build',
  serverPlatform: 'neutral',
  serverModuleFormat: 'esm',
  devServerBroadcastDelay: 1000,
};
