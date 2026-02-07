# @mumpitz/piks

A lightweight, type-safe dependency injection library for Node.js-based serverless environments.

## Why "piks"?

*Piks* is German for "jab" — a small, quick needle prick. That's what this library does: it gives your dependencies a tiny poke, just enough to get them where they need to go. No heavy frameworks, no decorators, no magic. Just a little piks.

## Design Principles

- **Fully Async**: All factory and destruction callbacks are async because serverless workloads are inherently I/O-bound.
- **Tree-Shakeable**: No service locator or central registry. Each dependency is a standalone reference, so bundlers like those in Next.js only
  include what each server function actually uses.
- **Request-Aware**: First-class request scope with automatic per-request lifecycle, reflecting that serverless business logic runs inside discrete
  request handlers.
- **Minimal API**: An opinionated, small surface area rather than a swiss-army knife.

## Quick Start

Create a shared context and define a database provider:

```typescript
// lib/context.ts
import { createContext } from '@mumpitz/piks'

export const context = createContext()
```

```typescript
// lib/database.ts
import { provide } from '@mumpitz/piks'

export const database = provide({
  name: 'database',
  scope: 'root',
  use: async () => createConnection(process.env.DATABASE_URL),
  onDestroy: async (db) => {
    await db.close()
  },
})
```

Use them in a Next.js API route. Each route handler should be wrapped in a single `context.run` call:

```typescript
// app/api/users/route.ts
import { context } from '@/lib/context'
import { database } from '@/lib/database'
import { NextResponse } from 'next/server'

export async function GET() {
  return context.run(async () => {
    const db = await database()
    const users = await db.query('SELECT * FROM users')
    return NextResponse.json(users)
  })
}
```

## Examples

### Root-Scoped Bindings (Singleton)

Root-scoped bindings are created once and shared across all requests within the same serverless instance. Use them for database connections, configuration, and other long-lived resources:

```typescript
// lib/database.ts
import { provide } from '@mumpitz/piks'

export const database = provide({
  name: 'database',
  scope: 'root',
  use: async () => {
    // Created once on first resolution, reused across all subsequent requests
    return createConnection({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })
  },
  onDestroy: async (db) => {
    await db.close()
  },
})
```

```typescript
// app/api/users/route.ts
import { context } from '@/lib/context'
import { database } from '@/lib/database'
import { NextResponse } from 'next/server'

export async function GET() {
  return context.run(async () => {
    const db = await database() // Same connection across all requests
    const users = await db.query('SELECT * FROM users')
    return NextResponse.json(users)
  })
}
```

### Request-Scoped Bindings

Request-scoped bindings are created fresh for each `context.run` call and destroyed when it completes. Use them for transactions, per-request state, and temporary resources:

```typescript
// lib/transaction.ts
import { provide } from '@mumpitz/piks'
import { database } from './database'

export const transaction = provide({
  name: 'transaction',
  scope: 'request',
  use: async () => {
    const db = await database()
    return db.beginTransaction()
  },
  onDestroy: async (tx, result) => {
    if (result.reason === 'success') {
      await tx.commit()
    } else {
      await tx.rollback()
    }
  },
})
```

```typescript
// app/api/users/route.ts
import { context } from '@/lib/context'
import { transaction } from '@/lib/transaction'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  return context.run(async () => {
    const body = await request.json()
    const tx = await transaction()
    await tx.query('INSERT INTO users (name) VALUES ($1)', [body.name])
    return NextResponse.json({ success: true })
    // Transaction auto-commits on success, rolls back on error
  })
}
```

### Manual Binding

Use `bindTo` to inject values that are not created by a factory. This is useful for framework-provided values like the incoming request:

```typescript
// lib/request.ts
import { provide } from '@mumpitz/piks'
import type { NextRequest } from 'next/server'

export const nextRequest = provide<NextRequest>({
  name: 'nextRequest',
  scope: 'request',
})
```

`context.with` wraps a handler in `context.run`, so you can use `bindTo` inside the handler directly:

```typescript
// app/api/users/route.ts
import { context } from '@/lib/context'
import { nextRequest } from '@/lib/request'
import { NextResponse } from 'next/server'

export const GET = context.with(async (request: NextRequest) => {
  nextRequest.bindTo(request)
  const search = request.nextUrl.searchParams.get('search')
  // ... business logic ...
  return NextResponse.json({ search })
})
```

## API Reference

### `createContext(): RootContext`

Creates a new root dependency injection context.

**Returns:** A `RootContext` instance with the following methods:

- `run<T>(callback: () => T): Promise<Awaited<T>>`: Executes the callback within a request scope. Request-scoped bindings are created and destroyed within this call.
- `with<TArgs, T>(handler: (...args: TArgs) => T): (...args: TArgs) => Promise<Awaited<T>>`: Wraps a handler so each call executes inside `run`. Arguments are passed through to the handler.
- `destroy(): Promise<void>`: Waits for in-flight requests to complete, then destroys all root-scoped bindings.
- `isDestroyed: boolean`: Whether the context has been destroyed.

### `provide<T>(options): Ref<T>`

Creates a dependency reference that can be resolved within a context. `T` must extend `Defined` (not `null` or `undefined`).

**Options:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | — | Unique name for the binding |
| `scope` | `'root' \| 'request'` | `'root'` | Binding scope |
| `use` | `() => Awaitable<T>` | — | Factory function. If omitted, the binding must be set with `bindTo`. |
| `onDestroy` | see below | — | Cleanup callback |

The `onDestroy` signature depends on the scope:

- **Root**: `(value: T) => Awaitable<void>`
- **Request**: `(value: T, result: RequestResult) => Awaitable<void>`

Where `RequestResult` is `{ reason: 'success'; result: unknown } | { reason: 'error'; error: unknown }`.

**Returns:** A `Ref<T>` — a callable reference:

- `(): Promise<T>` — Resolves the binding, creating it via the factory if needed.
- `bindTo(value: T): void` — Manually binds a value, bypassing the factory.
- `isBound(): boolean` — Whether the binding has been resolved in the current scope.

## Scopes and Lifecycle

Bindings are **lazily created** on first resolution and **cached** within their scope:

| | Root Scope | Request Scope |
|---|---|---|
| **Created** | On first resolution | On first resolution per `context.run` call |
| **Shared** | Across all `context.run` calls | Within a single `context.run` call |
| **Destroyed** | When `context.destroy()` is called | When `context.run` completes (success or error) |

Bindings are destroyed in **reverse order** of creation.

## Best Practices

1. **Wrap each route handler in `context.run` or `context.with`** — Ensures proper creation and cleanup of request-scoped bindings per request.
2. **Use root scope for singletons** — Database connections, configuration, and shared services.
3. **Use request scope for per-request state** — Transactions, user sessions, and temporary resources.
4. **Keep providers in separate modules** — Enables tree-shaking so each server function only bundles what it uses.
5. **Provide `onDestroy` for bindings that hold resources** — Connections, file handles, transactions, etc.

## Ideas

Future enhancements and features under consideration:

- **Request Interceptors**: Middleware-like functionality to intercept and modify requests before they execute, useful for logging, authentication, and request transformation
- **Provide Interceptors**: Intercept binding resolution to add cross-cutting concerns like caching, logging, or validation
- **Multi Bindings**: Support for binding multiple implementations to the same key, enabling plugin architectures and strategy patterns
- **Graceful Shutdown**: Enhanced shutdown handling with configurable timeouts, in-flight request completion, and health check integration
- **HMR Support**: Hot Module Replacement support for development, allowing dependency updates without full application restart

## License

[MIT](LICENSE)
