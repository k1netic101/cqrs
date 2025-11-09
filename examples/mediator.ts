import {
    BaseCommand,
    BaseQuery,
    CommandHandler,
    QueryHandler,
    Result,
    mediator,
} from "@k1netic101/cqrs";

// ============================================================================
// Domain Models
// ============================================================================

type User = {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
};

type Product = {
    id: string;
    name: string;
    price: number;
    stock: number;
};

// ============================================================================
// Commands (Write Operations - Side Effects)
// ============================================================================

// Create User Command
class CreateUserCommand extends BaseCommand<{
    name: string;
    email: string;
}> {}

class CreateUserHandler implements CommandHandler<CreateUserCommand> {
    async handle(command: CreateUserCommand): Promise<Result<void>> {
        try {
            // Simulate database write
            console.log("Creating user:", command.payload);
            
            // Simulate validation
            if (!command.payload.email.includes("@")) {
                return Result.failure(new Error("Invalid email format"));
            }
            
            // Simulate async operation
            await new Promise((resolve) => setTimeout(resolve, 100));
            
            console.log("User created successfully!");
            return Result.success();
        } catch (error) {
            return Result.failure(error as Error);
        }
    }
}

// Update Product Stock Command
class UpdateProductStockCommand extends BaseCommand<{
    productId: string;
    quantity: number;
}> {}

class UpdateProductStockHandler
    implements CommandHandler<UpdateProductStockCommand>
{
    async handle(
        command: UpdateProductStockCommand
    ): Promise<Result<void>> {
        try {
            console.log("Updating product stock:", command.payload);
            
            if (command.payload.quantity < 0) {
                return Result.failure(
                    new Error("Stock quantity cannot be negative")
                );
            }
            
            await new Promise((resolve) => setTimeout(resolve, 50));
            
            console.log("Stock updated successfully!");
            return Result.success();
        } catch (error) {
            return Result.failure(error as Error);
        }
    }
}

// ============================================================================
// Queries (Read Operations - No Side Effects)
// ============================================================================

// Get User Query
class GetUserQuery extends BaseQuery<{ userId: string }, User> {}

class GetUserHandler implements QueryHandler<GetUserQuery, User> {
    async handle(query: GetUserQuery): Promise<Result<User>> {
        try {
            console.log("Fetching user:", query.params.userId);
            
            // Simulate database read
            await new Promise((resolve) => setTimeout(resolve, 50));
            
            // Mock user data
            if (query.params.userId === "123") {
                return Result.success({
                    id: "123",
                    name: "John Doe",
                    email: "john@example.com",
                    createdAt: new Date(),
                });
            }
            
            return Result.failure(new Error("User not found"));
        } catch (error) {
            return Result.failure(error as Error);
        }
    }
}

// Get Product Query
class GetProductQuery extends BaseQuery<{ productId: string }, Product> {}

class GetProductHandler implements QueryHandler<GetProductQuery, Product> {
    async handle(query: GetProductQuery): Promise<Result<Product>> {
        try {
            console.log("Fetching product:", query.params.productId);
            
            await new Promise((resolve) => setTimeout(resolve, 50));
            
            // Mock product data
            if (query.params.productId === "prod-1") {
                return Result.success({
                    id: "prod-1",
                    name: "Laptop",
                    price: 999.99,
                    stock: 50,
                });
            }
            
            return Result.failure(new Error("Product not found"));
        } catch (error) {
            return Result.failure(error as Error);
        }
    }
}

// List Users Query (returns array)
class ListUsersQuery extends BaseQuery<{ limit: number }, User[]> {}

class ListUsersHandler implements QueryHandler<ListUsersQuery, User[]> {
    async handle(query: ListUsersQuery): Promise<Result<User[]>> {
        try {
            console.log("Listing users, limit:", query.params.limit);
            
            await new Promise((resolve) => setTimeout(resolve, 50));
            
            // Mock user list
            const users: User[] = [
                {
                    id: "123",
                    name: "John Doe",
                    email: "john@example.com",
                    createdAt: new Date(),
                },
                {
                    id: "456",
                    name: "Jane Smith",
                    email: "jane@example.com",
                    createdAt: new Date(),
                },
            ];
            
            return Result.success(users.slice(0, query.params.limit));
        } catch (error) {
            return Result.failure(error as Error);
        }
    }
}

// ============================================================================
// Application Bootstrap
// ============================================================================

function bootstrap() {
    // Register all command handlers
    mediator.registerCommandHandler(
        CreateUserCommand.name,
        new CreateUserHandler()
    );
    mediator.registerCommandHandler(
        UpdateProductStockCommand.name,
        new UpdateProductStockHandler()
    );
    
    // Register all query handlers
    mediator.registerQueryHandler(GetUserQuery.name, new GetUserHandler());
    mediator.registerQueryHandler(
        GetProductQuery.name,
        new GetProductHandler()
    );
    mediator.registerQueryHandler(
        ListUsersQuery.name,
        new ListUsersHandler()
    );
    
    console.log("Application bootstrapped!");
}

// ============================================================================
// Usage Examples
// ============================================================================

async function main() {
    // Initialize the application
    bootstrap();
    
    console.log("\n=== Example 1: Create User (Command) ===");
    const createCommand = new CreateUserCommand({
        name: "Alice",
        email: "alice@example.com",
    });
    
    const createResult = await mediator.dispatch(createCommand);
    if (createResult.isSuccess()) {
        console.log("✓ User created successfully");
    } else {
        console.error("✗ Failed:", createResult.error?.message);
    }
    
    console.log("\n=== Example 2: Get User (Query) ===");
    const getUserQuery = new GetUserQuery({ userId: "123" });
    const userResult = await mediator.dispatch(getUserQuery); // Type: Result<User>
    
    if (userResult.isSuccess()) {
        const user = userResult.getValue()!; // Type: User
        console.log("✓ User found:", user.name, user.email);
    } else {
        console.error("✗ Failed:", userResult.error?.message);
    }
    
    console.log("\n=== Example 3: Query Not Found ===");
    const notFoundQuery = new GetUserQuery({ userId: "999" });
    const notFoundResult = await mediator.dispatch(notFoundQuery);
    
    if (!notFoundResult.isSuccess()) {
        console.log("✓ Expected error:", notFoundResult.error?.message);
    }
    
    console.log("\n=== Example 4: Map over Result (Functional Style) ===");
    const query = new GetUserQuery({ userId: "123" });
    const result = await mediator.dispatch(query);
    
    // Chain transformations
    const emailResult = result.map((user) => user.email); // Type: Result<string>
    const upperEmailResult = emailResult.map((email) => email.toUpperCase()); // Type: Result<string>
    
    if (upperEmailResult.isSuccess()) {
        console.log("✓ Transformed email:", upperEmailResult.getValue());
    }
    
    console.log("\n=== Example 5: List Users (Array Result) ===");
    const listQuery = new ListUsersQuery({ limit: 10 });
    const listResult = await mediator.dispatch(listQuery); // Type: Result<User[]>
    
    if (listResult.isSuccess()) {
        const users = listResult.getValue()!;
        console.log(`✓ Found ${users.length} users:`);
        users.forEach((u) => console.log(`  - ${u.name} (${u.email})`));
    }
    
    console.log("\n=== Example 6: Update Product Stock (Command) ===");
    const updateCommand = new UpdateProductStockCommand({
        productId: "prod-1",
        quantity: 100,
    });
    
    const updateResult = await mediator.dispatch(updateCommand);
    if (updateResult.isSuccess()) {
        console.log("✓ Stock updated successfully");
    }
    
    console.log("\n=== Example 7: Get Product (Query) ===");
    const productQuery = new GetProductQuery({ productId: "prod-1" });
    const productResult = await mediator.dispatch(productQuery); // Type: Result<Product>
    
    if (productResult.isSuccess()) {
        const product = productResult.getValue()!; // Type: Product
        console.log(
            `✓ Product: ${product.name} - $${product.price} (Stock: ${product.stock})`
        );
    }
    
    console.log("\n=== Example 8: Validation Error (Command) ===");
    const invalidCommand = new CreateUserCommand({
        name: "Bob",
        email: "invalid-email", // Missing @
    });
    
    const invalidResult = await mediator.dispatch(invalidCommand);
    if (!invalidResult.isSuccess()) {
        console.log("✓ Validation caught:", invalidResult.error?.message);
    }
    
    console.log("\n=== Example 9: Unwrap (throws on error) ===");
    try {
        const successQuery = new GetUserQuery({ userId: "123" });
        const successResult = await mediator.dispatch(successQuery);
        const user = successResult.unwrap(); // Type: User, throws if error
        console.log("✓ Unwrapped user:", user.name);
    } catch (error) {
        console.error("✗ Unwrap failed:", error);
    }
    
    console.log("\n=== All examples completed! ===");
}

// Run the examples
main().catch(console.error);