# @mumpitz/di

A lightweight, type-safe dependency injection library for Node.js with support for root and request-scoped bindings, lifecycle management, and async context isolation.

## Features

- 🎯 **Type-safe**: Full TypeScript support with strict type checking
- 🔄 **Dual Scoping**: Root-scoped (singleton) and request-scoped bindings
- 🧹 **Lifecycle Management**: Automatic cleanup with `onDestroy` callbacks
- 🔒 **Context Isolation**: Uses Node.js `AsyncLocalStorage` for request isolation
- ⚡ **Async Support**: Native support for async factories and cleanup
- 🎨 **Simple API**: Minimal, intuitive API surface
- 🚀 **Zero Dependencies**: No runtime dependencies

## Requirements

- **Node.js**: `^24` (uses `AsyncLocalStorage` from `node:async_hooks`)

## Installation

```bash
pnpm add @mumpitz/di
# or
npm install @mumpitz/di
# or
yarn add @mumpitz/di
```

## Quick Start

```typescript
import { createContext, provide } from '@mumpitz/di'

// Create a root context
const context = createContext()

// Define a database connection (root-scoped singleton)
const database = provide({
  name: 'database',
  scope: 'root',
  use: async () => {
    // Create database connection
    const connection = await createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432')
    })
    return connection
  },
  onDestroy: async (db) => {
    await db.close()
  }
})

// Use the database within a context
await context.run(async () => {
  const db = await database()
  const users = await db.query('SELECT * FROM users')
  console.log(users)
})

// Clean up when done
await context.destroy()
```

## Usage Examples

### Root-Scoped Bindings (Singleton)

Root-scoped bindings are created once and shared across all requests. Perfect for database connections, configuration, and other singletons:

```typescript
const database = provide({
  name: 'database',
  scope: 'root',
  use: async () => {
    // Create database connection (only called once)
    const connection = await createConnection({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    })
    return connection
  },
  onDestroy: async (db) => {
    // Clean up connection when context is destroyed
    await db.close()
  }
})

const context = createContext()

// First request - connection is created
await context.run(async () => {
  const db = await database()
  await db.query('SELECT * FROM users')
})

// Second request - same connection is reused
await context.run(async () => {
  const db = await database() // Same connection instance
  await db.query('SELECT * FROM posts')
})

// Clean up connection
await context.destroy() // onDestroy is called, connection is closed
```

### Request-Scoped Bindings

Request-scoped bindings are created fresh for each `context.run()` call. Perfect for transactions, request-specific data, and temporary resources:

```typescript
const database = provide({
  name: 'database',
  scope: 'root',
  use: async () => createConnection(/* ... */)
})

const transaction = provide({
  name: 'transaction',
  scope: 'request',
  use: async () => {
    const db = await database()
    // Start a new transaction for this request
    const tx = await db.beginTransaction()
    return tx
  },
  onDestroy: async (tx, result) => {
    if (result.reason === 'success') {
      // Commit transaction on success
      await tx.commit()
    } else {
      // Rollback transaction on error
      await tx.rollback()
      console.error('Transaction rolled back:', result.error)
    }
  }
})

const context = createContext()

// First request - new transaction
await context.run(async () => {
  const tx = await transaction()
  await tx.query('INSERT INTO users (name) VALUES ($1)', ['Alice'])
  // Transaction is committed when run completes
})

// Second request - different transaction
await context.run(async () => {
  const tx = await transaction() // New transaction instance
  await tx.query('INSERT INTO users (name) VALUES ($1)', ['Bob'])
  // Transaction is committed when run completes
})

// Error handling - transaction is rolled back
try {
  await context.run(async () => {
    const tx = await transaction()
    await tx.query('INSERT INTO users (name) VALUES ($1)', ['Charlie'])
    throw new Error('Something went wrong')
    // Transaction is rolled back automatically
  })
} catch (error) {
  // Error is caught, transaction was rolled back
}
```

### Manual Binding

You can manually bind values using `bindTo()`. This is useful when you have the value available before the factory would be called, such as binding the HTTP request object:

```typescript
const httpRequest = provide({
  name: 'httpRequest',
  scope: 'request',
  // No factory - must be bound manually
})

// In your HTTP server middleware
app.use(async (req, res, next) => {
  await context.run(async () => {
    // Manually bind the request object
    httpRequest.bindTo(req)
    
    // Now handlers can access the request
    await next()
  })
})

// In your route handlers
app.get('/users', async () => {
  const req = await httpRequest() // Get the bound request
  const userId = req.query.userId
  // Use userId...
})
```

This pattern is especially useful for web frameworks where the request object is available from the framework but needs to be injected into your business logic.

### Checking Binding Status

Check if a binding has been resolved:

```typescript
const service = provide({
  name: 'service',
  use: () => ({ value: 42 })
})

await context.run(async () => {
  console.log(service.isBound()) // false
  
  await service()
  console.log(service.isBound()) // true
})
```

### Async Factories

Factories can return promises:

```typescript
const dataLoader = provide({
  name: 'data',
  use: async () => {
    const response = await fetch('https://api.example.com/data')
    return response.json()
  }
})

await context.run(async () => {
  const data = await dataLoader()
  console.log(data)
})
```

### Error Handling

Request-scoped bindings receive error information in their `onDestroy` callback:

```typescript
const resource = provide({
  name: 'resource',
  scope: 'request',
  use: () => ({ id: 1 }),
  onDestroy: (resource, result) => {
    if (result.reason === 'error') {
      console.error('Request failed:', result.error)
      // Clean up resources
    }
  }
})

const context = createContext()

try {
  await context.run(async () => {
    const res = await resource()
    throw new Error('Something went wrong')
  })
} catch (error) {
  // onDestroy was called with { reason: 'error', error }
}
```

## API Reference

### `createContext(): RootContext`

Creates a new root dependency injection context.

**Returns:** A `RootContext` instance with the following methods:

- `run<T>(callback: () => T): Promise<T>` - Execute code within a request context
- `destroy(): Promise<void>` - Destroy the context and all bindings
- `isDestroyed: boolean` - Whether the context has been destroyed

### `provide<T>(options: ProvideOptions<T>): Ref<T>`

Creates a dependency reference that can be resolved within a context.

**Parameters:**

- `options.name: string` - Unique name for the binding
- `options.scope?: 'root' | 'request'` - Binding scope (default: `'root'`)
- `options.use?: () => Awaitable<T>` - Factory function to create the value
- `options.onDestroy?: (value: T, ...args) => Awaitable<void>` - Cleanup callback

**Returns:** A `Ref<T>` with the following methods:

- `(): Promise<T>` - Resolve the binding
- `bindTo(value: T): void` - Manually bind a value
- `isBound(): boolean` - Check if the binding has been resolved

**Type Parameters:**

- `T extends Defined` - The type of the value (must be defined, not `null` or `undefined`)

## Scopes

### Root Scope

- Bindings are created once and shared across all `context.run()` calls
- Destroyed when `context.destroy()` is called
- Useful for singletons, configuration, and shared resources

### Request Scope

- Bindings are created fresh for each `context.run()` call
- Destroyed automatically when the request completes (success or error)
- Useful for request-specific data, user sessions, and temporary resources

## Lifecycle

1. **Creation**: Bindings are lazily created when first resolved
2. **Resolution**: Subsequent resolutions return the same instance (within scope)
3. **Destruction**: 
   - Request-scoped bindings are destroyed when `context.run()` completes
   - Root-scoped bindings are destroyed when `context.destroy()` is called
   - Dependencies are destroyed in reverse order of creation

## Best Practices

1. **Use root scope for singletons**: Services, configuration, and shared resources
2. **Use request scope for request-specific data**: User sessions, request IDs, etc.
3. **Always call `context.destroy()`**: Clean up resources when done
4. **Handle errors in `onDestroy`**: Use try-catch if cleanup might fail
5. **Check `isBound()` before use**: Useful for optional dependencies

## Ideas

Future enhancements and features under consideration:

- **Request Interceptors**: Middleware-like functionality to intercept and modify requests before they execute, useful for logging, authentication, and request transformation
- **Provide Interceptors**: Intercept binding resolution to add cross-cutting concerns like caching, logging, or validation
- **Multi Bindings**: Support for binding multiple implementations to the same key, enabling plugin architectures and strategy patterns
- **Graceful Shutdown**: Enhanced shutdown handling with configurable timeouts, in-flight request completion, and health check integration
- **HMR Support**: Hot Module Replacement support for development, allowing dependency updates without full application restart

## License

[License information to be added]

## Contributing

[Contributing guidelines to be added]

## Support

[Support information to be added]
