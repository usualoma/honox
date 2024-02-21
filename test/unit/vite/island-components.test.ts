import { transformJsxTags } from '../../../src/vite/island-components.js'

describe('transformJsxTags', () => {
  it('Should add component-wrapper and component-name attribute', () => {
    const code = `export default function Badge() {
      return <h1>Hello</h1>
    }`
    const result = transformJsxTags(code, 'Badge.tsx')
    expect(result).toBe(
      `const BadgeOriginal = function () {
  return <h1>Hello</h1>;
};
const WrappedBadge = function (props) {
  return import.meta.env.SSR ? <honox-island component-name="Badge.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><BadgeOriginal {...props}></BadgeOriginal>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <BadgeOriginal {...props}></BadgeOriginal>;
};
export { WrappedBadge as default };`
    )
  })
  it('Should not transform if it is blank', () => {
    const code = transformJsxTags('', 'Badge.tsx')
    expect(code).toBe('')
  })

  it('async', () => {
    const code = `export default async function AsyncComponent() {
      return <h1>Hello</h1>
    }`
    const result = transformJsxTags(code, 'AsyncComponent.tsx')
    expect(result).toBe(
      `const AsyncComponentOriginal = async function () {
  return <h1>Hello</h1>;
};
const WrappedAsyncComponent = function (props) {
  return import.meta.env.SSR ? <honox-island component-name="AsyncComponent.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><AsyncComponentOriginal {...props}></AsyncComponentOriginal>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <AsyncComponentOriginal {...props}></AsyncComponentOriginal>;
};
export { WrappedAsyncComponent as default };`
    )
  })

  it('unnamed', () => {
    const code = `export default async function() {
      return <h1>Hello</h1>
    }`
    const result = transformJsxTags(code, 'UnnamedComponent.tsx')
    expect(result).toBe(
      `const __HonoIsladComponent__Original = async function () {
  return <h1>Hello</h1>;
};
const Wrapped__HonoIsladComponent__ = function (props) {
  return import.meta.env.SSR ? <honox-island component-name="UnnamedComponent.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><__HonoIsladComponent__Original {...props}></__HonoIsladComponent__Original>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <__HonoIsladComponent__Original {...props}></__HonoIsladComponent__Original>;
};
export { Wrapped__HonoIsladComponent__ as default };`
    )
  })

  it('arrow - block', () => {
    const code = `export default () => {
      return <h1>Hello</h1>
    }`
    const result = transformJsxTags(code, 'UnnamedComponent.tsx')
    expect(result).toBe(
      `const __HonoIsladComponent__Original = function () {
  return <h1>Hello</h1>;
};
const Wrapped__HonoIsladComponent__ = function (props) {
  return import.meta.env.SSR ? <honox-island component-name="UnnamedComponent.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><__HonoIsladComponent__Original {...props}></__HonoIsladComponent__Original>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <__HonoIsladComponent__Original {...props}></__HonoIsladComponent__Original>;
};
export { Wrapped__HonoIsladComponent__ as default };`
    )
  })

  it('arrow - expression', () => {
    const code = 'export default () => <h1>Hello</h1>'
    const result = transformJsxTags(code, 'UnnamedComponent.tsx')
    expect(result).toBe(
      `const __HonoIsladComponent__Original = function () {
  return <h1>Hello</h1>;
};
const Wrapped__HonoIsladComponent__ = function (props) {
  return import.meta.env.SSR ? <honox-island component-name="UnnamedComponent.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><__HonoIsladComponent__Original {...props}></__HonoIsladComponent__Original>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <__HonoIsladComponent__Original {...props}></__HonoIsladComponent__Original>;
};
export { Wrapped__HonoIsladComponent__ as default };`
    )
  })

  it('export via variable', () => {
    const code = 'export default ExportViaVariable'
    const result = transformJsxTags(code, 'ExportViaVariable.tsx')
    expect(result).toBe(
      `const WrappedExportViaVariable = function (props) {
  return import.meta.env.SSR ? <honox-island component-name="ExportViaVariable.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><ExportViaVariable {...props}></ExportViaVariable>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <ExportViaVariable {...props}></ExportViaVariable>;
};
export { WrappedExportViaVariable as default };`
    )
  })

  it('export named variable', () => {
    const code = `export const NamedVariable = () => {
      return <h1>Hello</h1>
    }`
    const result = transformJsxTags(code, 'NamedVariable.tsx')
    expect(result).toBe(
      `const NamedVariable = () => {
  return <h1>Hello</h1>;
};
const WrappedNamedVariable = function (props) {
  return import.meta.env.SSR ? <honox-island component-name="NamedVariable.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><NamedVariable {...props}></NamedVariable>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <NamedVariable {...props}></NamedVariable>;
};
export { WrappedNamedVariable as NamedVariable };`
    )
  })

  it('export named variable via specifier', () => {
    const code = `const NamedVariable = () => {
      return <h1>Hello</h1>
    };
    export { NamedVariable }`
    const result = transformJsxTags(code, 'NamedVariable.tsx')
    expect(result).toBe(
      `const NamedVariable = () => {
  return <h1>Hello</h1>;
};
const WrappedNamedVariable = function (props) {
  return import.meta.env.SSR ? <honox-island component-name="NamedVariable.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><NamedVariable {...props}></NamedVariable>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <NamedVariable {...props}></NamedVariable>;
};
export { WrappedNamedVariable as NamedVariable };`
    )
  })

  it('export named variable via specifier with "as"', () => {
    const code = `const NamedVariable = () => {
      return <h1>Hello</h1>
    };
    export { NamedVariable as MyNamedComponent }`
    const result = transformJsxTags(code, 'NamedVariable.tsx')
    expect(result).toBe(
      `const NamedVariable = () => {
  return <h1>Hello</h1>;
};
const WrappedNamedVariable = function (props) {
  return import.meta.env.SSR ? <honox-island component-name="NamedVariable.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><NamedVariable {...props}></NamedVariable>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <NamedVariable {...props}></NamedVariable>;
};
export { WrappedNamedVariable as MyNamedComponent };`
    )
  })
})
