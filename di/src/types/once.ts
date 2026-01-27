import { isDefined } from '@/types/defined'

type Callback<TResult = unknown, TParams extends unknown[] = []> = (...args: TParams) => TResult

export function once<TParams extends unknown[] = [], TResult = unknown>(
  callback: Callback<TResult, TParams>,
): Callback<TResult, TParams> {
  let capture: { result: TResult } | { error: unknown } | undefined
  return (...args: TParams) => {
    if (!isDefined(capture)) {
      try {
        capture = { result: callback(...args) }
      } catch (error) {
        capture = { error }
      }
    }
    if ('result' in capture) {
      return capture.result
    } else {
      throw capture.error
    }
  }
}
