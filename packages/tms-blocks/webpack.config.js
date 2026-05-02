const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

const configuredOutputPath = process.env.TMS_WORKSPACE_OUTPUT_PATH || process.env.TMS_BLOCKS_OUTPUT_PATH;
const outputPath = configuredOutputPath
  ? path.resolve(process.cwd(), configuredOutputPath)
  : null;

module.exports = {
  ...defaultConfig,
  entry: {
    index: path.resolve(process.cwd(), 'src', 'index.js'),
    // view: path.resolve(process.cwd(), 'src', 'carousel', 'view.js'),
    editor: path.resolve(process.cwd(), 'src', 'js', 'editor.js'),
  },
  ...(outputPath
    ? {
        output: {
          ...defaultConfig.output,
          path: outputPath,
        },
      }
    : {}),
};
