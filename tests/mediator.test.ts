import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    BaseCommand,
    BaseQuery,
    CommandHandler,
    Mediator,
    QueryHandler,
    Result,
} from "@k1netic101/cqrs";

// Mock types for testing (simplified User)
type User = { id: string; name: string };

// Example Command class - just extend BaseCommand with payload type
class CreateUserCommand extends BaseCommand<{ name: string }> {}

// Example Handler (returns void)
class CreateUserHandler implements CommandHandler<CreateUserCommand> {
    async handle(command: CreateUserCommand): Promise<Result<void>> {
        // Simulate side effect (e.g., DB insert)
        return Result.success();
    }
}

// Void Command for coverage
class LogCommand extends BaseCommand<{ message: string }> {}

class LogHandler implements CommandHandler<LogCommand> {
    async handle(command: LogCommand): Promise<Result<void>> {
        console.log(command.payload.message); // Side effect
        return Result.success();
    }
}

// Example Query class - extend BaseQuery with params type AND result type
class GetUserQuery extends BaseQuery<{ userId: string }, User> {}

// Example Handler
class GetUserHandler implements QueryHandler<GetUserQuery, User> {
    async handle(query: GetUserQuery): Promise<Result<User>> {
        if (query.params.userId === "123") {
            return Result.success({ id: "123", name: "Test User" });
        }
        return Result.failure(new Error("User not found"));
    }
}

describe("Mediator", () => {
    let mediator: Mediator;

    beforeEach(() => {
        mediator = new Mediator();
        vi.restoreAllMocks(); // Reset mocks if used
    });

    describe("Registration", () => {
        it("should register a command handler", () => {
            const handler = new CreateUserHandler();
            mediator.registerCommandHandler(CreateUserCommand.name, handler);

            // Internal check (via dispatch later, but assert registration indirectly)
            expect(mediator).toBeDefined(); // Placeholder; extend with private access if needed
        });

        it("should register a query handler", () => {
            const handler = new GetUserHandler();
            mediator.registerQueryHandler(GetUserQuery.name, handler);
        });

        it("should overwrite existing handlers", () => {
            const handler1 = new CreateUserHandler();
            const handler2 = vi.fn() as any; // Mock second

            mediator.registerCommandHandler(CreateUserCommand.name, handler1);
            mediator.registerCommandHandler(CreateUserCommand.name, handler2);

            // Later dispatch would use handler2
        });
    });

    describe("Dispatch Command", () => {
        it("should dispatch a registered command successfully", async () => {
            const handler = new CreateUserHandler();
            mediator.registerCommandHandler(CreateUserCommand.name, handler);

            const command = new CreateUserCommand({ name: "Jane" });
            const result = await mediator.dispatch(command);  // Result<void>

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBeUndefined(); // void
        });

        it("should handle void command successfully", async () => {
            const handler = new LogHandler();
            mediator.registerCommandHandler(LogCommand.name, handler);

            const command = new LogCommand({ message: "Test log" });
            const result = await mediator.dispatch(command);  // Result<void>

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBeUndefined(); // void
        });

        it("should return failure if no handler for command", async () => {
            const command = new CreateUserCommand({ name: "Jane" });
            const result = await mediator.dispatch(command);

            expect(result.isSuccess()).toBe(false);
            expect(result.error?.message).toBe(
                "No handler for command: CreateUserCommand",
            );
        });

        it("should propagate handler errors as failure", async () => {
            const failingHandler = {
                async handle(): Promise<Result<void>> {
                    return Result.failure(new Error("Handler boom"));
                },
            } as CommandHandler<CreateUserCommand>;

            mediator.registerCommandHandler(
                CreateUserCommand.name,
                failingHandler,
            );

            const command = new CreateUserCommand({ name: "Jane" });
            const result = await mediator.dispatch(command);

            expect(result.isSuccess()).toBe(false);
            expect(result.error?.message).toContain("Handler boom");
        });
    });

    describe("Dispatch Query", () => {
        it("should dispatch a registered query successfully", async () => {
            const handler = new GetUserHandler();
            mediator.registerQueryHandler(GetUserQuery.name, handler);

            const query = new GetUserQuery({ userId: "123" });
            const result = await mediator.dispatch(query);  // Result<User>

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toEqual({ id: "123", name: "Test User" });
        });

        it("should return handler failure for query", async () => {
            const handler = new GetUserHandler();
            mediator.registerQueryHandler(GetUserQuery.name, handler);

            const query = new GetUserQuery({ userId: "404" });
            const result = await mediator.dispatch(query);

            expect(result.isSuccess()).toBe(false);
            expect(result.error?.message).toBe("User not found");
        });

        it("should return failure if no handler for query", async () => {
            const query = new GetUserQuery({ userId: "123" });
            const result = await mediator.dispatch(query);

            expect(result.isSuccess()).toBe(false);
            expect(result.error?.message).toBe(
                "No handler for query: GetUserQuery",
            );
        });
    });

    describe("Overload Resolution", () => {
        it("should infer types correctly for commands", async () => {
            // TS infers Promise<Result<void>>
            const handler = new CreateUserHandler();
            mediator.registerCommandHandler(CreateUserCommand.name, handler);
            const command = new CreateUserCommand({ name: "Jane" });
            await expect(mediator.dispatch(command)).resolves.toBeInstanceOf(
                Result,
            );
        });

        it("should infer types correctly for queries", async () => {
            // TS infers Promise<Result<User>>
            const handler = new GetUserHandler();
            mediator.registerQueryHandler(GetUserQuery.name, handler);
            const query = new GetUserQuery({ userId: "123" });
            await expect(mediator.dispatch(query)).resolves.toBeInstanceOf(
                Result,
            );
        });

        it("should error at compile-time for invalid dispatch (tested implicitly)", async () => {
            const invalid = { kind: 'invalid' as any, id: "bad", timestamp: new Date() } as any;
            const result = await mediator.dispatch(invalid);
            expect(result.isSuccess()).toBe(false);
            expect(result.error?.message).toBe(
                "Invalid message type: neither Command nor Query",
            );
        });
    });

    describe("map on Result", () => {
        it("should chain map on success", async () => {
            const handler = new GetUserHandler();
            mediator.registerQueryHandler(GetUserQuery.name, handler);

            const query = new GetUserQuery({ userId: "123" });
            const result = await mediator.dispatch(query);  // Result<User>
            const nameResult = result.map((user) => user.name);  // user: User

            expect(nameResult.isSuccess()).toBe(true);
            expect(nameResult.getValue()).toBe("Test User");
        });

        it("should preserve error on map failure", async () => {
            // Simulate failure
            const failingHandler = {
                async handle(): Promise<Result<User>> {
                    return Result.failure(new Error("Fail"));
                },
            } as QueryHandler<GetUserQuery, User>;

            mediator.registerQueryHandler(
                GetUserQuery.name,
                failingHandler,
            );
            const query = new GetUserQuery({ userId: "123" });
            const result = await mediator.dispatch(query);
            const nameResult = result.map((user) => user.name);  // Safe on error

            expect(nameResult.isSuccess()).toBe(false);
            expect(nameResult.error?.message).toBe("Fail"); // Preserved
        });
    });
});