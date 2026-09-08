function isExcluded(file) {
  const normalized = file.replaceAll('\\', '/');

  return normalized === '.storybook/test.html' || normalized.startsWith('.storybook/public/');
}

function runOn(files, command) {
  const selected = files.filter((file) => !isExcluded(file));

  if (selected.length === 0) {
    return [];
  }

  const quoted = selected.map((file) => `"${file}"`).join(' ');

  return [`${command} ${quoted}`];
}

/** @type {import('lint-staged').Configuration} */
const config = {
  '*.{ts,tsx,js,jsx,mjs,cjs}': (files) => runOn(files, 'eslint --fix --max-warnings=0'),
  '*.{json,md,mdx,css,yml,yaml,html}': (files) => runOn(files, 'prettier --write'),
};

export default config;
