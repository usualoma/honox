import fs from 'fs/promises'
import _generate from '@babel/generator'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const generate = (_generate.default as typeof _generate) ?? _generate
import { parse } from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import _traverse from '@babel/traverse'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const traverse = (_traverse.default as typeof _traverse) ?? _traverse
import type { ExportDefaultDeclaration, ExportNamedDeclaration } from '@babel/types'
import {
  identifier,
  jsxAttribute,
  jsxClosingElement,
  jsxElement,
  jsxIdentifier,
  jsxOpeningElement,
  stringLiteral,
  callExpression,
  variableDeclarator,
  variableDeclaration,
  functionExpression,
  blockStatement,
  returnStatement,
  jsxSpreadAttribute,
  jsxExpressionContainer,
  conditionalExpression,
  memberExpression,
  exportNamedDeclaration,
} from '@babel/types'
// eslint-disable-next-line node/no-extraneous-import
import type { Plugin } from 'vite'
import { COMPONENT_NAME, DATA_HONO_TEMPLATE, DATA_SERIALIZED_PROPS } from '../constants.js'

function addSSRCheck(funcName: string, componentName: string) {
  const isSSR = memberExpression(
    memberExpression(identifier('import'), identifier('meta')),
    identifier('env.SSR')
  )

  // serialize props by excluding the children
  const serializedProps = callExpression(identifier('JSON.stringify'), [
    callExpression(memberExpression(identifier('Object'), identifier('fromEntries')), [
      callExpression(
        memberExpression(
          callExpression(memberExpression(identifier('Object'), identifier('entries')), [
            identifier('props'),
          ]),
          identifier('filter')
        ),
        [identifier('([key]) => key !== "children"')]
      ),
    ]),
  ])

  const ssrElement = jsxElement(
    jsxOpeningElement(
      jsxIdentifier('honox-island'),
      [
        jsxAttribute(jsxIdentifier(COMPONENT_NAME), stringLiteral(componentName)),
        jsxAttribute(jsxIdentifier(DATA_SERIALIZED_PROPS), jsxExpressionContainer(serializedProps)),
      ],
      false
    ),
    jsxClosingElement(jsxIdentifier('honox-island')),
    [
      jsxElement(
        jsxOpeningElement(
          jsxIdentifier(funcName),
          [jsxSpreadAttribute(identifier('props'))],
          false
        ),
        jsxClosingElement(jsxIdentifier(funcName)),
        []
      ),
      jsxExpressionContainer(
        conditionalExpression(
          memberExpression(identifier('props'), identifier('children')),
          jsxElement(
            jsxOpeningElement(
              jsxIdentifier('template'),
              [jsxAttribute(jsxIdentifier(DATA_HONO_TEMPLATE), stringLiteral(''))],
              false
            ),
            jsxClosingElement(jsxIdentifier('template')),
            [jsxExpressionContainer(memberExpression(identifier('props'), identifier('children')))]
          ),
          identifier('null')
        )
      ),
    ]
  )

  const clientElement = jsxElement(
    jsxOpeningElement(jsxIdentifier(funcName), [jsxSpreadAttribute(identifier('props'))], false),
    jsxClosingElement(jsxIdentifier(funcName)),
    []
  )

  const returnStmt = returnStatement(conditionalExpression(isSSR, ssrElement, clientElement))
  const functionExpr = functionExpression(null, [identifier('props')], blockStatement([returnStmt]))
  return functionExpr
}

export const transformJsxTags = (contents: string, componentName: string) => {
  const ast = parse(contents, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })

  if (ast) {
    const exports: Record<string, string> = {}

    const wrappedFunctions: Set<string> = new Set()
    const insertWrappedFunction = (
      path: NodePath,
      originalFunctionName: string,
      functionName: string,
      componentName: string
    ) => {
      const wrappedFunctionName = 'Wrapped' + functionName
      if (!wrappedFunctions.has(wrappedFunctionName)) {
        wrappedFunctions.add(wrappedFunctionName)
        const wrappedFunction = addSSRCheck(
          originalFunctionName,
          componentName.replace(/#default$/, '#')
        )
        path.insertBefore(
          variableDeclaration('const', [
            variableDeclarator(identifier(wrappedFunctionName), wrappedFunction),
          ])
        )
      }
      return wrappedFunctionName
    }

    const transformExport = (path: NodePath<ExportNamedDeclaration | ExportDefaultDeclaration>) => {
      const declarationType = path.node.declaration?.type

      if (declarationType === 'VariableDeclaration') {
        // export const Component = () => <div></div>

        path.insertBefore(path.node.declaration)
      } else if ('specifiers' in path.node && path.node.specifiers.length > 0) {
        // export { Component as default, Component2 as Component3, Component4 }

        for (const specifier of path.node.specifiers) {
          if (specifier.type === 'ExportSpecifier') {
            const exportAs =
              specifier.exported.type === 'StringLiteral'
                ? specifier.exported.value
                : specifier.exported.name

            const wrappedFunctionName = insertWrappedFunction(
              path,
              specifier.local.name,
              specifier.local.name,
              `${componentName}#${exportAs}`
            )

            exports[exportAs] = wrappedFunctionName
          }
        }
        path.remove()
        return
      }

      if (
        declarationType === 'FunctionDeclaration' ||
        declarationType === 'FunctionExpression' ||
        declarationType === 'ArrowFunctionExpression' ||
        declarationType === 'Identifier' ||
        declarationType === 'VariableDeclaration'
      ) {
        if (
          declarationType === 'VariableDeclaration' &&
          !('name' in path.node.declaration.declarations[0].id)
        ) {
          // unsupported
          return
        }

        const functionName =
          (declarationType === 'VariableDeclaration'
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (path.node.declaration.declarations[0].id as any).name
            : declarationType === 'Identifier'
              ? path.node.declaration.name
              : (declarationType === 'FunctionDeclaration' ||
                  declarationType === 'FunctionExpression') &&
                path.node.declaration.id?.name) || '__HonoIsladComponent__'

        let originalFunctionId
        if (declarationType === 'Identifier') {
          originalFunctionId = path.node.declaration
        } else if (declarationType === 'VariableDeclaration') {
          originalFunctionId = path.node.declaration.declarations[0].id
        } else {
          originalFunctionId = identifier(functionName + 'Original')

          const originalFunction = functionExpression(
            null,
            path.node.declaration.params,
            path.node.declaration.body.type === 'BlockStatement'
              ? path.node.declaration.body
              : blockStatement([returnStatement(path.node.declaration.body)])
          )
          originalFunction.async = path.node.declaration.async

          path.insertBefore(
            variableDeclaration('const', [variableDeclarator(originalFunctionId, originalFunction)])
          )
        }

        const exportAs = path.node.type === 'ExportDefaultDeclaration' ? 'default' : functionName
        const wrappedFunctionName = insertWrappedFunction(
          path,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (originalFunctionId as any).name,
          functionName,
          `${componentName}#${exportAs}`
        )
        exports[exportAs] = wrappedFunctionName
        path.remove()
      }
    }

    traverse(ast, {
      ExportNamedDeclaration: transformExport,
      ExportDefaultDeclaration: transformExport,
    })

    if (Object.keys(exports).length !== 0) {
      ast.program.body.push(
        exportNamedDeclaration(
          null,
          Object.entries(exports).map(([key, value]) => {
            return {
              type: 'ExportSpecifier',
              exported: identifier(key),
              local: identifier(value),
            }
          })
        )
      )
    }

    const { code } = generate(ast)
    return code
  }
}

export function islandComponents(): Plugin {
  return {
    name: 'transform-island-components',
    async load(id) {
      const match = id.match(/\/islands\/(.+?\.tsx)$/)
      if (match) {
        const componentName = match[1]
        const contents = await fs.readFile(id, 'utf-8')
        const code = transformJsxTags(contents, componentName)
        if (code) {
          return {
            code,
            map: null,
          }
        }
      }
    },
  }
}
