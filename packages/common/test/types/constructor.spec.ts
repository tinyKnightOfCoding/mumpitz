import { isConstructor } from '../../src'

describe('isConstructor', () => {
  it('should return false given input is not a constructor', () => {
    expect(isConstructor(() => {})).toBeFalsy()
    expect(isConstructor('Hello, World!')).toBeFalsy()
  })

  it('should return true given input is a constructor', () => {
    expect(isConstructor(function () {})).toBeTruthy()
    expect(isConstructor(function namedFunction() {})).toBeTruthy()
    expect(class NoArg {}).toBeTruthy()
    expect(
      class TwoArgs {
        constructor(arg1: string, arg2: number) {
          arg1
          arg2
        }
      },
    ).toBeTruthy()
  })
})
