import type { Context } from 'hono'
import { useRequestContext } from 'hono/jsx-renderer'
import { IMPORTING_ISLANDS_ID } from '../../constants.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const HasIslands = ({ children, context }: { children: any; context?: Context }): any => {
  context ||= useRequestContext()
  return <>{context.get(IMPORTING_ISLANDS_ID) && children}</>
}
