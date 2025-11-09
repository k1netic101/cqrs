# @k1netic101/cqrs

A lightweight, shared CQRS (Command Query Responsibility Segregation) module for TypeScript applications. It provides a flexible mediator pattern implementation to handle commands, queries, and events in a decoupled manner. Built with modern TypeScript and optimized for ESM/CommonJS compatibility.

[![npm version](https://badge.fury.io/js/%40k1netic101%2Fcqrs.svg)](https://badge.fury.io/js/%40k1netic101%2Fcqrs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)

## Features

- **Mediator Pattern**: Central hub for dispatching commands, queries, and notifications.
- **Type-Safe**: Full TypeScript support with generics for payloads and handlers.
- **Modular**: Easy to integrate into any TS/JS project, including Node.js, React, or NestJS.
- **Zero Dependencies**: Lightweight with no runtime dependencies.
- **Tested**: Comprehensive test suite with Vitest.

## Installation

Install the package via npm, yarn, or pnpm:

```bash
npm install @k1netic101/cqrs
# or
yarn add @k1netic101/cqrs
# or
pnpm add @k1netic101/cqrs
```

For development (with TypeScript):

```bash
pnpm add -D @k1netic101/cqrs
```

## Quick Start

### 1. Define Commands and Queries

Create request types extending the base interfaces:

```typescript
import { Command, Query } from '@k1netic101/cqrs';

interface CreateUserCommand extends Command<{ name: string; email: string }> {
  readonly type: 'CreateUser';
}

interface GetUserQuery extends Query<{ id: string }> {
  readonly type: 'GetUser';
}
```

### 2. Implement Handlers

Handlers process requests and return results:

```typescript
import { CommandHandler, QueryHandler, Mediator } from '@k1netic101/cqrs';

class CreateUserHandler implements CommandHandler<CreateUserCommand, { id: string }> {
  async handle(command: CreateUserCommand): Promise<{ id: string }> {
    // Simulate user creation logic
    const userId = `user_${Date.now()}`;
    console.log(`Created user: ${command.payload.name} (${userId})`);
    return { id: userId };
  }
}

class GetUserHandler implements QueryHandler<GetUserQuery, { id: string; name: string }> {
  async handle(query: GetUserQuery): Promise<{ id: string; name: string }> {
    // Simulate user retrieval
    return { id: query.payload.id, name: 'John Doe' };
  }
}
```

### 3. Register and Use the Mediator

Set up the mediator with your handlers:

```typescript
const mediator = new Mediator();

// Register handlers
mediator.registerCommandHandler(CreateUserCommand, new CreateUserHandler());
mediator.registerQueryHandler(GetUserQuery, new GetUserHandler());

// Dispatch a command
const createResult = await mediator.send<CreateUserCommand, { id: string }>({
  type: 'CreateUser',
  payload: { name: 'Alice', email: 'alice@example.com' },
});
console.log(createResult); // { id: 'user_1234567890' }

// Dispatch a query
const userResult = await mediator.send<GetUserQuery, { id: string; name: string }>({
  type: 'GetUser',
  payload: { id: 'user_1234567890' },
});
console.log(userResult); // { id: 'user_1234567890', name: 'John Doe' }
```

For notifications (fire-and-forget events), use `mediator.publish(notification)`.

## Examples

Check out the built-in examples for more advanced usage:

- **Mediator Example**: Run `pnpm example:mediator` after building to see a full CQRS flow in action.

Examples are in the `examples/` directory and use TSX for quick execution.

## API Reference

- **Mediator**: Core class for dispatching requests.
  - `send<T extends Command | Query, R>(request: T): Promise<R>`
  - `publish(notification: Notification): Promise<void>`
  - `registerCommandHandler<T extends Command, H extends CommandHandler<T>>(type: T['type'], handler: H): void`
  - Similar methods for queries and notifications.

- **Command/Query/Notification**: Base interfaces for requests.
  - Extend with `type` (string literal) and `payload` (your data).

Full types are exported from the main module. See `dist/index.d.ts` for details.

## Development

### Prerequisites

- Node.js >= 18
- pnpm (recommended)

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build the library (ESM/CJS + types). |
| `pnpm test` | Run tests with Vitest. |
| `pnpm test:coverage` | Run tests with coverage report. |
| `pnpm prepublishOnly` | Build before publishing. |
| `pnpm example:mediator` | Build and run the mediator example. |

To contribute:
1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Commit changes (`git commit -m 'Add my feature'`).
4. Push to the branch (`git push origin feature/my-feature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

[Kiet Tran](https://github.com/k1netic101) - Full-stack developer passionate about clean architecture.

---

*Built with ❤️ using Vite, TypeScript, and Vitest.*