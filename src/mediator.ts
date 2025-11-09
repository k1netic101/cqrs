import { Command, Query, CommandHandler, QueryHandler, Result } from './types';

// Utility: Extract TResult from Query<TPayload, TResult>
type QueryResult<TQuery extends Query<any, any>> = 
  TQuery extends Query<any, infer R> ? R : never;

export class Mediator {
  private commandHandlers = new Map<string, CommandHandler<any>>();
  private queryHandlers = new Map<string, QueryHandler<any, any>>();

  // Register handlers (call in app bootstrap)
  registerCommandHandler<TCommand extends Command<any>>(
    commandType: string,
    handler: CommandHandler<TCommand>
  ): void {
    this.commandHandlers.set(commandType, handler);
  }

  registerQueryHandler<TQuery extends Query<any, any>>(
    queryType: string,
    handler: QueryHandler<TQuery, QueryResult<TQuery>>
  ): void {
    this.queryHandlers.set(queryType, handler);
  }

  // Overload for Command (returns void)
  async dispatch<TCommand extends Command<any>>(
    command: TCommand
  ): Promise<Result<void>>;
  
  // Overload for Query (returns inferred result type)
  async dispatch<TPayload, TResult>(
    query: Query<TPayload, TResult>
  ): Promise<Result<TResult>>;
  
  // Implementation
  async dispatch(message: Command<any> | Query<any, any>): Promise<Result<any>> {
    // Use discriminator for proper type narrowing
    if (message.kind === 'command') {
      const command = message as Command<any>;
      const handler = this.commandHandlers.get(command.constructor.name);
      
      if (!handler) {
        return Result.failure(new Error(`No handler for command: ${command.constructor.name}`));
      }
      
      return handler.handle(command);
    } else if (message.kind === 'query') {
      const query = message as Query<any, any>;
      const handler = this.queryHandlers.get(query.constructor.name);
      
      if (!handler) {
        return Result.failure(new Error(`No handler for query: ${query.constructor.name}`));
      }
      
      return handler.handle(query);
    }
    
    // Fallback (shouldn't hit with discriminator)
    return Result.failure(new Error('Invalid message type: neither Command nor Query'));
  }
}

export const mediator = new Mediator();  // Singleton; use DI in prod