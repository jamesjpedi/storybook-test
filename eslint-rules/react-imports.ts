import type { Rule } from 'eslint';
import type { ImportDeclaration, ImportSpecifier } from 'estree';

type TsImportDeclaration = ImportDeclaration & {
  importKind?: 'type' | 'value';
};

type TsImportSpecifier = ImportSpecifier & {
  importKind?: 'type' | 'value';
};

type NamedBinding = {
  imported: string;
  isType: boolean;
  local: string;
};

function importedName(specifier: ImportSpecifier): string | undefined {
  const imported = specifier.imported;

  return imported.type === 'Identifier' ? imported.name : undefined;
}

function isTypeImport(declaration: TsImportDeclaration, specifier?: TsImportSpecifier): boolean {
  return declaration.importKind === 'type' || specifier?.importKind === 'type';
}

function printNamedList(bindings: NamedBinding[]): string {
  return [...bindings]
    .sort((left, right) => left.imported.localeCompare(right.imported))
    .map((binding) =>
      binding.imported === binding.local
        ? binding.imported
        : `${binding.imported} as ${binding.local}`,
    )
    .join(', ');
}

function printReactImport(named: NamedBinding[]): string {
  if (named.length === 0) {
    return "import React from 'react';";
  }

  return `import React, { ${printNamedList(named)} } from 'react';`;
}

export const reactImportsRule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description:
        'Always import React as a value default. Combine named React imports on the same line. Do not use import type from react.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      reactImport:
        "Import React as a value: `import React, { … } from 'react'` (or `import React from 'react'` when there are no named imports). Do not use `import type` from 'react'.",
    },
  },
  create(context) {
    const declarations: TsImportDeclaration[] = [];

    return {
      ImportDeclaration(node: TsImportDeclaration) {
        if (node.source.value === 'react') {
          declarations.push(node);
        }
      },
      'Program:exit'() {
        if (declarations.length === 0) {
          return;
        }

        const named: NamedBinding[] = [];
        let hasNamespace = false;
        let hasTypeNamed = false;
        let hasDefaultReact = false;
        let extraDefault = false;

        for (const declaration of declarations) {
          for (const specifier of declaration.specifiers) {
            if (specifier.type === 'ImportNamespaceSpecifier') {
              hasNamespace = true;
              continue;
            }

            if (specifier.type === 'ImportDefaultSpecifier') {
              if (specifier.local.name === 'React') {
                hasDefaultReact = true;
              } else {
                extraDefault = true;
              }

              continue;
            }

            const imported = importedName(specifier);

            if (imported === undefined) {
              continue;
            }

            const binding: NamedBinding = {
              imported,
              isType: isTypeImport(declaration, specifier),
              local: specifier.local.name,
            };

            if (binding.isType) {
              hasTypeNamed = true;
            }

            named.push(binding);
          }
        }

        const valueNamed = named.filter((binding) => !binding.isType);
        const expected = printReactImport(valueNamed);
        const actual = declarations.map((declaration) => context.sourceCode.getText(declaration));

        const alreadyCorrect =
          !hasNamespace &&
          !extraDefault &&
          !hasTypeNamed &&
          hasDefaultReact &&
          declarations.length === 1 &&
          declarations[0]?.importKind !== 'type' &&
          actual[0] === expected;

        if (alreadyCorrect) {
          return;
        }

        const [first] = declarations;

        if (first === undefined) {
          return;
        }

        context.report({
          node: first,
          messageId: 'reactImport',
          fix(fixer) {
            return [
              fixer.replaceText(first, expected),
              ...declarations.slice(1).map((node) => fixer.remove(node)),
            ];
          },
        });
      },
    };
  },
};
