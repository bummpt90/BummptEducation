/**
 * BummptEducation — Database Error Handling
 * 
 * Provides structured, secure error classes for database operations.
 * Prevents raw database connection strings, credentials, or internal server
 * details from leaking to API consumers.
 */

export class DatabaseError extends Error {
  public readonly code?: string;
  public readonly isOperational: boolean;

  constructor(message: string, code?: string, isOperational = true) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(message = 'Database service unavailable or connection could not be established.') {
    super(message, 'DB_CONNECTION_ERROR', true);
    this.name = 'DatabaseConnectionError';
  }
}

export class DatabaseQueryError extends DatabaseError {
  public readonly querySnippet?: string;

  constructor(message: string, code?: string, querySnippet?: string) {
    super(message, code || 'DB_QUERY_ERROR', true);
    this.name = 'DatabaseQueryError';
    this.querySnippet = querySnippet;
  }
}

export class DatabaseTransactionError extends DatabaseError {
  constructor(message = 'Database transaction failed and was rolled back.') {
    super(message, 'DB_TRANSACTION_ERROR', true);
    this.name = 'DatabaseTransactionError';
  }
}

export class TenantIsolationError extends DatabaseError {
  constructor(message = 'Access denied: Target entity does not belong to the active school tenant.') {
    super(message, 'TENANT_ISOLATION_ERROR', true);
    this.name = 'TenantIsolationError';
  }
}

export class EntityNotFoundError extends DatabaseError {
  constructor(entityName = 'Record', id?: string) {
    super(id ? `${entityName} with ID '${id}' was not found.` : `${entityName} not found.`, 'NOT_FOUND', true);
    this.name = 'EntityNotFoundError';
  }
}

/**
 * Sanitizes an error to ensure internal database secrets, passwords, or connection URLs
 * are never sent to frontend clients.
 */
export function sanitizeDatabaseError(error: any): { message: string; code: string } {
  if (error instanceof DatabaseError) {
    return {
      message: error.message,
      code: error.code || 'DB_ERROR',
    };
  }

  // Generic fallback for unhandled exceptions
  const originalMessage = error?.message || 'A database error occurred.';
  // Strip out any accidental connection string substring
  const sanitized = originalMessage.replace(/postgres(ql)?:\/\/[^\s]+/gi, '[DATABASE_URL_REDACTED]');

  return {
    message: sanitized,
    code: error?.code || 'INTERNAL_DB_ERROR',
  };
}
