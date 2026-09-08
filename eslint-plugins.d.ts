declare module 'eslint-plugin-jsx-a11y' {
  import type { ESLint, Linter } from 'eslint';

  type JsxA11yPlugin = ESLint.Plugin & {
    flatConfigs: {
      recommended: Linter.Config;
      strict: Linter.Config;
    };
  };

  const plugin: JsxA11yPlugin;
  export default plugin;
}
