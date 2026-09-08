# PROMPT

## MUI Integration

Make below changes in the code:

1. Update component to use MUI material as base.
2. It should expose all the components as MUI material & MUI x components, while overriding Button, Card and Data Grid components.
3. Update existing components to use MUI material as base, no new components required.
4. It should be able to publish as NPM package.
5. Components should be able to use MUI x components, which will be used as base for the components. (Example: Data-Grid, Data-Table, etc.)
6. Add all MUI packages in package.json for future use.
7. Add Data Grid component using MUI-x Data Grid component.
8. Package signing should be done along with building the package for publishing.
9. Add all the components to the storybook for documentation.
10. Consumer application should be able to use the components from the NPM package, without doing mui-x signing in their application.
11. Configure dependencies in such a way that, minimum NPM package bundle size, keep mui-x signing in the package itself.
12. This NPM package is suppose to be a replacement for MUI material & MUI x components, so it should be able to replace them in the consumer application.
13. Make sure dependency config (dependencies, peerDependencies, devDependencies) will not trigger version conflict or any build issues in consumer application.
14. Create a doc for getting started for consumer application to use this NPM package.
15. Create it for React 18+, while current development is using React 18.
16. Re-Export of x packages with user the name as in MUI kind of package names. ie
    'bhhc-design-system' (@mui/material) (root = Material, plus a /material alias)
    'bhhc-design-system/x-data-grid-premium' (@mui/x-data-grid-premium)
    'bhhc-design-system/x-charts-premium' (@mui/x-charts-premium)
    etc..
17. Should include "@base-ui/react"
18. Make sure all mui's public/core/x packages are in dependencies and vite config to handle it correctly.
19. Add azure-devops pipeline config for the same.

---

## typescript + ESLint + Prettier + Commitlint + husky + gitignore

Create and configure typescript + ESLint + Prettier + Commitlint + husky + gitignore + editorconfig for the app based on points below

1. Should follow all react + JS latest standards
2. Code should be easily readable for humans
3. Overview of code should be beautiful, meaningful, aligned for using industry standards rules.
4. Import order, line breaks, function-function empty line etc should be configured gracefully for a good codebase.
5. All should work seamlessly with each other, only enforce for changed documents / code when committing.
6. prettier should work with eslint.
7. Should be strictly typed as per latest standards.
8. Rule should be enforcing developer to maintain all standards strictly.
9. Create a md file for all the rules applied / disabled / warning with example for understanding.
10. Add / update azure-devops pipeline config for the same.
