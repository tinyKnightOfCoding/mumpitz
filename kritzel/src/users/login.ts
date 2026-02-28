export type LoginRequest = { email: string }

export async function login(_req: LoginRequest): Promise<void> {
  throw new Error('Not implemented')
}
