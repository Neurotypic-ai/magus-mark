import { describe, expect, it } from 'vitest';

import {
  ConstraintViolationError,
  EntityNotFoundError,
  NoFieldsToUpdateError,
  RepositoryError,
  SchemaError,
  TransactionError,
} from './RepositoryError';

describe('RepositoryError', () => {
  it('should create error with operation and repository context', () => {
    const error = new RepositoryError('Something failed', 'create', 'TestRepository');

    expect(error.message).toContain('[TestRepository]');
    expect(error.message).toContain('create');
    expect(error.message).toContain('Something failed');
    expect(error.operation).toBe('create');
    expect(error.repository).toBe('TestRepository');
    expect(error.name).toBe('RepositoryError');
  });

  it('should chain errors with cause', () => {
    const rootCause = new Error('Root cause');
    const error = new RepositoryError('Operation failed', 'update', 'TestRepo', rootCause);

    expect(error.cause).toBe(rootCause);
  });

  it('should get root cause from error chain', () => {
    const rootCause = new Error('Root cause');
    const midError = new RepositoryError('Mid error', 'read', 'MidRepo', rootCause);
    const topError = new RepositoryError('Top error', 'process', 'TopRepo', midError);

    const root = topError.getRootCause();
    expect(root).toBe(rootCause);
  });

  it('should generate error chain string', () => {
    const rootCause = new Error('Root cause');
    const midError = new RepositoryError('Mid error', 'read', 'MidRepo', rootCause);
    const topError = new RepositoryError('Top error', 'process', 'TopRepo', midError);

    const chain = topError.getErrorChain();
    expect(chain).toContain('Top error');
    expect(chain).toContain('Mid error');
    expect(chain).toContain('Root cause');
    expect(chain).toContain('->');
  });
});

describe('EntityNotFoundError', () => {
  it('should format entity not found message', () => {
    const error = new EntityNotFoundError('User', 'user-123', 'UserRepository');

    expect(error.message).toContain('User');
    expect(error.message).toContain('user-123');
    expect(error.message).toContain('not found');
    expect(error.name).toBe('EntityNotFoundError');
  });
});

describe('NoFieldsToUpdateError', () => {
  it('should indicate no fields to update', () => {
    const error = new NoFieldsToUpdateError('User', 'UserRepository');

    expect(error.message).toContain('No fields');
    expect(error.message).toContain('User');
    expect(error.name).toBe('NoFieldsToUpdateError');
  });
});

describe('ConstraintViolationError', () => {
  it('should indicate constraint violation', () => {
    const error = new ConstraintViolationError('Unique constraint failed', 'create', 'UserRepository');

    expect(error.message).toContain('Constraint violation');
    expect(error.message).toContain('Unique constraint failed');
    expect(error.name).toBe('ConstraintViolationError');
  });
});

describe('SchemaError', () => {
  it('should indicate schema error', () => {
    const error = new SchemaError('Invalid table definition', 'initialize', 'DatabaseSetup');

    expect(error.message).toContain('Schema error');
    expect(error.message).toContain('Invalid table definition');
    expect(error.name).toBe('SchemaError');
  });
});

describe('TransactionError', () => {
  it('should indicate transaction error', () => {
    const error = new TransactionError('Transaction rolled back', 'commit', 'Database');

    expect(error.message).toContain('Transaction error');
    expect(error.message).toContain('Transaction rolled back');
    expect(error.name).toBe('TransactionError');
  });
});
