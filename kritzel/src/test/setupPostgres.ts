import { PostgreSqlContainer } from '@testcontainers/postgresql'

const image = 'postgres:17'

export default async function setup(): Promise<() => Promise<void>> {
  const container = await new PostgreSqlContainer(image).start()
  process.env.DATABASE_URL = container.getConnectionUri()
  return async () => {
    await container.stop()
  }
}
