/* eslint-disable @typescript-eslint/no-explicit-any */
import { poweredBy } from 'hono/powered-by'
import { describe, it, expect, vi } from 'vitest'
import { createApp } from '../../src/server'

describe('Basic', () => {
  const ROUTES = import.meta.glob('./app/routes/**/[a-z[-][a-z[_-]*.(tsx|ts|mdx)', {
    eager: true,
  })

  const app = createApp({
    root: './app/routes',
    ROUTES: ROUTES as any,
    init: (app) => {
      app.use('*', poweredBy())
    },
  })

  it('Should have correct routes', () => {
    const routes = [
      {
        path: '/*',
        method: 'ALL',
        handler: expect.any(Function),
      },
      {
        path: '/about/:name/address',
        method: 'GET',
        handler: expect.any(Function),
      },
      {
        path: '/about/:name/address',
        method: 'GET',
        handler: expect.any(Function),
      },
      {
        path: '/about/:name',
        method: 'GET',
        handler: expect.any(Function),
      },
      {
        path: '/about/:name',
        method: 'GET',
        handler: expect.any(Function),
      },
      {
        path: '/about/:name',
        method: 'POST',
        handler: expect.any(Function),
      },
      {
        path: '/about/:name',
        method: 'POST',
        handler: expect.any(Function),
      },
      {
        path: '/interaction',
        method: 'GET',
        handler: expect.any(Function),
      },
      {
        path: '/interaction',
        method: 'GET',
        handler: expect.any(Function),
      },
      { path: '/api', method: 'POST', handler: expect.any(Function) },
      { path: '/api', method: 'POST', handler: expect.any(Function) },
      { path: '/api', method: 'GET', handler: expect.any(Function) },
      { path: '/api', method: 'GET', handler: expect.any(Function) },
      { path: '/', method: 'GET', handler: expect.any(Function) },
      { path: '/', method: 'GET', handler: expect.any(Function) },
      {
        path: '/post',
        method: 'GET',
        handler: expect.any(Function),
      },
      {
        path: '/post',
        method: 'GET',
        handler: expect.any(Function),
      },
      {
        path: '/throw_error',
        method: 'GET',
        handler: expect.any(Function),
      },
      {
        path: '/throw_error',
        method: 'GET',
        handler: expect.any(Function),
      },
    ]
    expect(app.routes).toHaveLength(routes.length)
    expect(app.routes).toEqual(expect.arrayContaining(routes))
  })

  it('Should return 200 response - / with a Powered By header', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<h1>Hello</h1>')
    expect(res.headers.get('x-powered-by'), 'Hono')
  })

  it('Should return 404 response - /foo', async () => {
    const res = await app.request('/foo')
    expect(res.status).toBe(404)
  })

  it('Should return 200 response - /about/me', async () => {
    const res = await app.request('/about/me')
    expect(res.status).toBe(200)
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe('<p>It&#39;s me</p><b>My name is me</b>')
  })

  it('Should return 200 response - POST /about/me', async () => {
    const res = await app.request('/about/me', {
      method: 'POST',
    })
    expect(res.status).toBe(201)
  })

  it('Should render MDX content - /post', async () => {
    const res = await app.request('/post')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<h1>Hello MDX</h1>')
  })

  it('Should return 500 response - /throw_error', async () => {
    global.console.trace = vi.fn()
    const res = await app.request('/throw_error')
    expect(res.status).toBe(500)
    expect(await res.text()).toBe('Internal Server Error')
  })
})

describe('With preserved', () => {
  const ROUTES = import.meta.glob('./app/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)', {
    eager: true,
  })

  const RENDERER = import.meta.glob('./app/routes/**/_renderer.tsx', {
    eager: true,
  })

  const NOT_FOUND = import.meta.glob('./app/routes/_404.tsx', {
    eager: true,
  })

  const ERROR = import.meta.glob('./app/routes/_error.tsx', {
    eager: true,
  })

  const app = createApp({
    root: './app/routes',
    ROUTES: ROUTES as any,
    RENDERER: RENDERER as any,
    NOT_FOUND: NOT_FOUND as any,
    ERROR: ERROR as any,
  })

  it('Should return 200 response - /', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title>This is a title</title></head><body><h1>Hello</h1></body></html>'
    )
  })

  it('Should return 404 response - /foo', async () => {
    const res = await app.request('/foo')
    expect(res.status).toBe(404)
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Not Found</h1></body></html>'
    )
  })

  it('Should return 200 response - /about/me', async () => {
    const res = await app.request('/about/me')
    expect(res.status).toBe(200)
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title>me</title></head><body><p>It&#39;s me</p><b>My name is me</b></body></html>'
    )
  })

  it('Should return 200 response - /about/me/address', async () => {
    const res = await app.request('/about/me/address')
    expect(res.status).toBe(200)
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title>me&#39;s address</title></head><body><h1>About</h1><address><b>me&#39;s address</b></address></body></html>'
    )
  })

  it('Should return 200 response - /interaction', async () => {
    const res = await app.request('/interaction')
    expect(res.status).toBe(200)
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title></title><script type="module" src="/app/client.ts"></script></head><body><honox-island component-name="Counter.tsx" data-serialized-props="{&quot;initial&quot;:5}"><div><p>Count: 5</p><button onClick="() =&gt; setCount(count + 1)">Increment</button></div></honox-island></body></html>'
    )
  })

  it('Should return 500 response - /throw_error', async () => {
    const res = await app.request('/throw_error')
    expect(res.status).toBe(500)
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title>Internal Server Error</title></head><body><h1>Custom Error Message: Foo</h1></body></html>'
    )
  })
})

describe('API', () => {
  const ROUES = import.meta.glob('./app/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)', {
    eager: true,
  })

  const app = createApp({
    root: './app/routes',
    ROUTES: ROUES as any,
  })

  it('Should return 200 response - /api', async () => {
    const res = await app.request('/api')
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Custom')).toBe('Hello')
    expect(await res.json()).toEqual({ foo: 'bar' })
  })

  it('Should return 200 response - POST /api', async () => {
    const res = await app.request('/api', {
      method: 'POST',
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      ok: true,
      message: 'created',
    })
  })
})

describe('Nested Layouts', () => {
  const ROUTES = import.meta.glob('./app-nested/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)', {
    eager: true,
  })

  const RENDERER = import.meta.glob('./app-nested/routes/**/_renderer.tsx', {
    eager: true,
  })

  const app = createApp({
    root: './app-nested/routes',
    ROUTES: ROUTES as any,
    RENDERER: RENDERER as any,
  })

  it('Should return 200 response - /nested', async () => {
    const res = await app.request('/nested')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<main><h1>Nested</h1></main>')
  })

  it('Should return 200 response - /nested/foo', async () => {
    const res = await app.request('/nested/foo')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<main><nav>foo menu</nav><h1>Foo</h1></main>')
  })

  it('Should return 200 response - /nested/foo/bar', async () => {
    const res = await app.request('/nested/foo/bar')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<main><nav>foo menu</nav><nav>bar menu</nav><h1>Bar</h1></main>')
  })

  it('Should return 200 response - /nested/foo/bar/baz', async () => {
    const res = await app.request('/nested/foo/bar/baz')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<main><nav>foo menu</nav><nav>bar menu</nav><h1>Baz</h1></main>')
  })
})

describe('<Script /> component', () => {
  const ROUTES = import.meta.glob('./app-script/routes/index.tsx', {
    eager: true,
  })

  const RENDERER = import.meta.glob('./app-script/routes/**/_renderer.tsx', {
    eager: true,
  })

  const app = createApp({
    root: './app-script/routes',
    ROUTES: ROUTES as any,
    RENDERER: RENDERER as any,
  })

  it('Should convert the script path correctly', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(
      '<html><head><script type="module" src="/static/client-abc.js"></script></head><body><main><honox-island component-name="Component.tsx" data-serialized-props="{}"><p>Component</p></honox-island></main></body></html>'
    )
  })
})
