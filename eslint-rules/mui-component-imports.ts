import type { Rule } from 'eslint';
import type { ImportDeclaration, ImportSpecifier } from 'estree';

type PackageConfig = {
  barrel: string;
  barrelOnlyComponents: ReadonlySet<string>;
  nonComponentSubpaths: ReadonlySet<string>;
};

type TsImportDeclaration = ImportDeclaration & {
  importKind?: 'type' | 'value';
};

type TsImportSpecifier = ImportSpecifier & {
  importKind?: 'type' | 'value';
};

type Binding = {
  imported: string;
  isType: boolean;
  local: string;
};

const packages: PackageConfig[] = [
  {
    barrel: '@mui/material',
    barrelOnlyComponents: new Set([
      'CssVarsProvider',
      'Experimental_CssVarsProvider',
      'StyledEngineProvider',
      'ThemeProvider',
      'ThemeProviderNoVars',
      'ThemeProviderWithVars',
    ]),
    nonComponentSubpaths: new Set([
      'className',
      'colors',
      'darkScrollbar',
      'DefaultPropsProvider',
      'generateUtilityClass',
      'generateUtilityClasses',
      'InitColorSchemeScript',
      'locale',
      'styles',
      'useAutocomplete',
      'useMediaQuery',
      'useScrollTrigger',
      'useTouchRipple',
      'version',
    ]),
  },
  {
    barrel: '@mui/icons-material',
    barrelOnlyComponents: new Set(),
    nonComponentSubpaths: new Set(),
  },
  {
    barrel: '@mui/lab',
    barrelOnlyComponents: new Set(),
    nonComponentSubpaths: new Set(),
  },
];

function importedName(specifier: ImportSpecifier): string | undefined {
  const imported = specifier.imported;

  return imported.type === 'Identifier' ? imported.name : undefined;
}

function isTypeImport(declaration: TsImportDeclaration, specifier?: TsImportSpecifier): boolean {
  return declaration.importKind === 'type' || specifier?.importKind === 'type';
}

function isComponentName(name: string): boolean {
  return /^[A-Z]/u.test(name);
}

function isPathImportable(name: string, pkg: PackageConfig): boolean {
  return (
    isComponentName(name) &&
    !pkg.barrelOnlyComponents.has(name) &&
    !pkg.nonComponentSubpaths.has(name)
  );
}

function parseSource(
  source: string,
  pkg: PackageConfig,
): { kind: 'barrel' } | { kind: 'ignored' } | { kind: 'component'; name: string } | undefined {
  if (source === pkg.barrel) {
    return { kind: 'barrel' };
  }

  const prefix = `${pkg.barrel}/`;

  if (!source.startsWith(prefix)) {
    return undefined;
  }

  const rest = source.slice(prefix.length);

  if (rest.length === 0 || rest.includes('/') || pkg.nonComponentSubpaths.has(rest)) {
    return { kind: 'ignored' };
  }

  return { kind: 'component', name: rest };
}

function printNamedList(bindings: Binding[]): string {
  return [...bindings]
    .sort((left, right) => left.imported.localeCompare(right.imported))
    .map((binding) =>
      binding.imported === binding.local
        ? binding.imported
        : `${binding.imported} as ${binding.local}`,
    )
    .join(', ');
}

function printValueImport(bindings: Binding[], source: string, defaultLocal?: string): string {
  if (defaultLocal !== undefined && bindings.length === 0) {
    return `import ${defaultLocal} from '${source}';`;
  }

  if (defaultLocal !== undefined) {
    return `import ${defaultLocal}, { ${printNamedList(bindings)} } from '${source}';`;
  }

  return `import { ${printNamedList(bindings)} } from '${source}';`;
}

function printTypeImport(bindings: Binding[], source: string): string | undefined {
  if (bindings.length === 0) {
    return undefined;
  }

  return `import type { ${printNamedList(bindings)} } from '${source}';`;
}

function belongsToComponent(typeName: string, component: string): boolean {
  const camel = `${component.charAt(0).toLowerCase()}${component.slice(1)}`;

  return (
    typeName === `${component}Props` ||
    typeName === `${component}OwnerState` ||
    typeName === `${component}Classes` ||
    typeName === `${camel}Classes`
  );
}

function specifierBindings(declaration: TsImportDeclaration): {
  defaultLocal?: string;
  hasNamespace: boolean;
  named: Binding[];
} {
  let defaultLocal: string | undefined;
  let hasNamespace = false;
  const named: Binding[] = [];

  for (const specifier of declaration.specifiers) {
    if (specifier.type === 'ImportNamespaceSpecifier') {
      hasNamespace = true;
      continue;
    }

    if (specifier.type === 'ImportDefaultSpecifier') {
      defaultLocal = specifier.local.name;
      continue;
    }

    const imported = importedName(specifier);

    if (imported === undefined) {
      continue;
    }

    named.push({
      imported,
      isType: isTypeImport(declaration, specifier),
      local: specifier.local.name,
    });
  }

  return { defaultLocal, hasNamespace, named };
}

function uniqueBindings(bindings: Binding[]): Binding[] {
  const seen = new Set<string>();
  const unique: Binding[] = [];

  for (const binding of bindings) {
    const key = `${binding.isType ? 'type' : 'value'}:${binding.imported}:${binding.local}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(binding);
  }

  return unique;
}

export const muiComponentImportsRule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description:
        'Use a default path import for a single MUI component, and a named barrel import when importing more than one.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      usePath:
        "Import a single '{{name}}' as `import {{local}} from '{{path}}'`. Use `import { … } from '{{barrel}}'` only when this file imports more than one {{barrel}} component.",
      useBarrel:
        "Import multiple '{{barrel}}' components from '{{barrel}}' (named), not from component subpaths.",
    },
  },
  create(context) {
    const declarations: TsImportDeclaration[] = [];

    return {
      ImportDeclaration(node: TsImportDeclaration) {
        declarations.push(node);
      },
      'Program:exit'() {
        for (const pkg of packages) {
          checkPackage(context, declarations, pkg);
        }
      },
    };
  },
};

function checkPackage(
  context: Rule.RuleContext,
  declarations: TsImportDeclaration[],
  pkg: PackageConfig,
): void {
  const related: TsImportDeclaration[] = [];
  const valueComponents = new Map<string, { local: string; pathImportable: boolean }>();
  const extraValueNamed: Binding[] = [];
  const typeBindings: Binding[] = [];
  let hasNamespace = false;
  let hasPathComponentImport = false;
  let hasNamedComponentFromBarrel = false;
  let hasDefaultFromBarrel = false;

  for (const declaration of declarations) {
    if (typeof declaration.source.value !== 'string') {
      continue;
    }

    const parsed = parseSource(declaration.source.value, pkg);

    if (parsed === undefined || parsed.kind === 'ignored') {
      continue;
    }

    const bindings = specifierBindings(declaration);

    hasNamespace = hasNamespace || bindings.hasNamespace;
    related.push(declaration);

    if (parsed.kind === 'component') {
      hasPathComponentImport = true;

      if (declaration.importKind !== 'type') {
        const local =
          bindings.defaultLocal ??
          bindings.named.find((binding) => !binding.isType && binding.imported === parsed.name)
            ?.local ??
          parsed.name;

        valueComponents.set(parsed.name, {
          local,
          pathImportable: isPathImportable(parsed.name, pkg),
        });
      }

      for (const binding of bindings.named) {
        if (binding.isType) {
          typeBindings.push(binding);
          continue;
        }

        if (binding.imported !== parsed.name) {
          extraValueNamed.push(binding);
        }
      }

      if (declaration.importKind === 'type') {
        typeBindings.push(...bindings.named);
      }

      continue;
    }

    if (bindings.defaultLocal !== undefined && declaration.importKind !== 'type') {
      hasDefaultFromBarrel = true;
    }

    if (declaration.importKind === 'type') {
      typeBindings.push(...bindings.named);
      continue;
    }

    for (const binding of bindings.named) {
      if (binding.isType) {
        typeBindings.push(binding);
        continue;
      }

      if (isComponentName(binding.imported) || pkg.barrelOnlyComponents.has(binding.imported)) {
        hasNamedComponentFromBarrel = true;
        valueComponents.set(binding.imported, {
          local: binding.local,
          pathImportable: isPathImportable(binding.imported, pkg),
        });
        continue;
      }

      extraValueNamed.push(binding);
    }
  }

  if (related.length === 0 || hasNamespace || hasDefaultFromBarrel) {
    return;
  }

  const components = [...valueComponents.entries()];

  if (components.length >= 2) {
    if (!hasPathComponentImport) {
      return;
    }

    const valueNamed = uniqueBindings([
      ...components.map(([imported, meta]) => ({
        imported,
        isType: false,
        local: meta.local,
      })),
      ...extraValueNamed,
    ]);

    const types = uniqueBindings(typeBindings);

    reportRewrite(context, related, 'useBarrel', {
      barrel: pkg.barrel,
      lines: [printValueImport(valueNamed, pkg.barrel), printTypeImport(types, pkg.barrel)],
    });

    return;
  }

  const pathImportable = components.filter(([, meta]) => meta.pathImportable);

  if (pathImportable.length !== 1) {
    return;
  }

  const [name, meta] = pathImportable[0] ?? [];

  if (name === undefined || meta === undefined) {
    return;
  }

  const path = `${pkg.barrel}/${name}`;

  const matchingTypes = uniqueBindings(
    typeBindings.filter((binding) => belongsToComponent(binding.imported, name)),
  );

  const otherTypes = uniqueBindings(
    typeBindings.filter((binding) => !belongsToComponent(binding.imported, name)),
  );

  const extra = uniqueBindings(extraValueNamed);

  const expectedLines = [
    printValueImport(extra, path, meta.local),
    printTypeImport(matchingTypes, path),
    printTypeImport(otherTypes, pkg.barrel),
  ];

  const expected = expectedLines.filter((line): line is string => line !== undefined);
  const actual = related.map((declaration) => context.sourceCode.getText(declaration));

  if (
    actual.length === expected.length &&
    expected.every((line, index) => actual[index] === line)
  ) {
    return;
  }

  const singlePathDefault =
    extra.length === 0 &&
    related.filter((declaration) => declaration.importKind !== 'type').length === 1 &&
    related.some((declaration) => {
      if (declaration.importKind === 'type' || declaration.source.value !== path) {
        return false;
      }

      return (
        declaration.specifiers.length === 1 &&
        declaration.specifiers[0]?.type === 'ImportDefaultSpecifier' &&
        declaration.specifiers[0].local.name === meta.local
      );
    });

  const typesMatch =
    matchingTypes.length === 0 ||
    related.some((declaration) => {
      if (declaration.importKind !== 'type' || declaration.source.value !== path) {
        return false;
      }

      const names = specifierBindings(declaration).named;

      return (
        names.length === matchingTypes.length &&
        matchingTypes.every((typeBinding) =>
          names.some(
            (binding) =>
              binding.imported === typeBinding.imported && binding.local === typeBinding.local,
          ),
        )
      );
    });

  const leftoverMatch =
    otherTypes.length === 0 &&
    !hasNamedComponentFromBarrel &&
    related.every((declaration) => {
      if (declaration.source.value !== pkg.barrel || declaration.importKind === 'type') {
        return declaration.importKind === 'type' || declaration.source.value === path;
      }

      return false;
    });

  if (singlePathDefault && typesMatch && leftoverMatch && extra.length === 0) {
    return;
  }

  reportRewrite(context, related, 'usePath', {
    barrel: pkg.barrel,
    local: meta.local,
    name,
    path,
    lines: expected,
  });
}

function reportRewrite(
  context: Rule.RuleContext,
  nodes: TsImportDeclaration[],
  messageId: 'usePath' | 'useBarrel',
  data: {
    barrel: string;
    lines: (string | undefined)[];
    local?: string;
    name?: string;
    path?: string;
  },
): void {
  const [first] = nodes;

  if (first === undefined) {
    return;
  }

  const text = data.lines
    .filter((line): line is string => line !== undefined && line.length > 0)
    .join('\n');

  context.report({
    node: first,
    messageId,
    data: {
      barrel: data.barrel,
      local: data.local ?? '',
      name: data.name ?? '',
      path: data.path ?? '',
    },
    fix(fixer) {
      return [fixer.replaceText(first, text), ...nodes.slice(1).map((node) => fixer.remove(node))];
    },
  });
}
