// Command: For mutations (side effects) - Payload only; always void return
export interface Command<TPayload = unknown> {
  readonly kind: 'command';  // Discriminator
  readonly id: string;  // Correlation ID for tracing
  readonly timestamp: Date;
  readonly payload: TPayload;
}

// Query: For reads (no side effects) - Params and explicit result type
export interface Query<TPayload = unknown, TResult = unknown> {
  readonly kind: 'query';  // Discriminator
  readonly id: string;
  readonly timestamp: Date;
  readonly params: TPayload;
  readonly _result?: TResult;  // Phantom type to preserve TResult
}

// Abstract base classes that automatically capture types
export abstract class BaseCommand<TPayload> implements Command<TPayload> {
  readonly kind = 'command' as const;
  readonly id: string;
  readonly timestamp: Date;
  
  constructor(public readonly payload: TPayload) {
    this.id = `cmd-${Date.now()}-${Math.random()}`;
    this.timestamp = new Date();
  }
}

export abstract class BaseQuery<TPayload, TResult> implements Query<TPayload, TResult> {
  readonly kind = 'query' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly _result!: TResult;  // Phantom field automatically included
  
  constructor(public readonly params: TPayload) {
    this.id = `query-${Date.now()}-${Math.random()}`;
    this.timestamp = new Date();
  }
}

// Handler: Processes command/query
export interface CommandHandler<TCommand extends Command<any>> {
  handle(command: TCommand): Promise<Result<void>>;
}

export interface QueryHandler<TQuery extends Query<any, any>, TResult> {
  handle(query: TQuery): Promise<Result<TResult>>;
}

// Result: Wrapper for success/error (avoids exceptions); value is always TValue | undefined
export class Result<TValue> {
  private constructor(
    public readonly value: TValue | undefined,
    public readonly error: Error | undefined
  ) {}

  static success<TValue>(value?: TValue): Result<TValue> {
    return new Result<TValue>(value, undefined);
  }

  static failure<TValue>(error: Error): Result<TValue> {
    return new Result<TValue>(undefined, error);
  }

  isSuccess(): this is { value: TValue; error: undefined } {
    return this.error === undefined;
  }

  // Safe access: Returns value if success, undefined otherwise (no throw)
  getValue(): TValue | undefined {
    return this.value;
  }

  // Optional: Throwing version for convenience (use after isSuccess check if paranoid)
  unwrap(): TValue {
    if (this.error) {
      throw this.error;
    }
    return this.value!;
  }

  // Optional: Map over success value (FP-style)
  map<TOutput>(fn: (val: TValue) => TOutput): Result<TOutput> {
    if (this.isSuccess()) {
      return Result.success(fn(this.value!));
    }
    return Result.failure(this.error!);  // Preserved error in new generic
  }
}