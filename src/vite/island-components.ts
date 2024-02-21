import fs from 'fs/promises'
import _generate from '@babel/generator'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const generate = (_generate.default as typeof _generate) ?? _generate
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const traverse = (_traverse.default as typeof _traverse) ?? _traverse
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
    traverse(ast, {
      ExportDefaultDeclaration(path) {
        const declarationType = path.node.declaration.type

        if (
          declarationType === 'FunctionDeclaration' ||
          declarationType === 'FunctionExpression' ||
          declarationType === 'ArrowFunctionExpression' ||
          declarationType === 'Identifier'
        ) {
          const functionName =
            declarationType === 'Identifier'
              ? path.node.declaration.name
              : ((declarationType === 'FunctionDeclaration' ||
                  declarationType === 'FunctionExpression') &&
                  path.node.declaration.id?.name) ||
                '__HonoIsladComponent__'

          let originalFunctionId
          if (declarationType === 'Identifier') {
            originalFunctionId = path.node.declaration
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
              variableDeclaration('const', [
                variableDeclarator(originalFunctionId, originalFunction),
              ])
            )
          }

          const wrappedFunction = addSSRCheck(originalFunctionId.name, componentName)
          const wrappedFunctionId = identifier('Wrapped' + functionName)
          exports.default = wrappedFunctionId.name
          path.replaceWith(
            variableDeclaration('const', [variableDeclarator(wrappedFunctionId, wrappedFunction)])
          )
        }
      },
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
