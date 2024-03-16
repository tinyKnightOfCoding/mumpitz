import { common } from '@mumpitz/common'
import { pluginZod } from '../src'

describe('smoke', () => {
  it('should have access to common', () => {
    expect(common).toEqual('common')
  })

  it('should run', () => {
    expect(pluginZod).toEqual('plugin-zod -> common')
  })
})