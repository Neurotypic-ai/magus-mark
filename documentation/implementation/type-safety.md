# Type Safety

The project maximizes TypeScript's type system for safety and developer experience:

## Core Type Safety Principles

- **Strict TypeScript Configuration**: We use the strictest TypeScript settings including strict null checking, noImplicitAny, and other strict flags
- **Type-Safe API Boundaries**: All external API interactions use proper typing and runtime validation
- **Error Handling**: Use Result pattern for operations that might fail rather than exceptions
- **LLM-Generated Code**: All code (including AI-generated code) must follow project type safety standards

## Project Configuration

Our TypeScript environment is configured with:

- TypeScript 5.8+ with strict settings in `tsconfig.base.json`
- ESLint with typescript-eslint configured in `eslint.config.js`
- Prettier with specific formatting rules in `prettier.config.js`

## Type System Best Practices

### 1. Use Explicit Types for Function Signatures

```typescript
// ❌ Bad: Relying on inference for parameters
function processItems(items) {
  return items.map(item => item.name);
}

// ✅ Good: Explicit parameter and return types
function processItems(items: Item[]): string[] {
  return items.map(item => item.name);
}
```

### 2. Never Use `any` - Use `unknown` with Type Guards

```typescript
// ❌ Bad: Using 'any' bypasses type checking - ESLint will flag this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processData(data: any) {
  return data.value; // Error: Property 'value' does not exist on type 'unknown'
}

// ✅ Good: Use 'unknown' with type guards
function processData(data: unknown): Result<Value> {
  if (!isValidData(data)) {
    return Result.fail(new ValidationError('Invalid data'));
  }
  return Result.ok(data.value);
}

// Define type guard functions
function isValidData(data: unknown): data is ValidData {
  return (
    typeof data === 'object' && 
    data !== null && 
    'value' in data && 
    typeof data.value === 'string'
  );
}
```

### 3. Avoid Non-null Assertions and Type Assertions

```typescript
// ❌ Bad: Non-null assertion - ESLint will flag this
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const element = document.getElementById('root')!;

// ✅ Good: Proper null checking
const element = document.getElementById('root');
if (element === null) {
  throw new Error('Root element not found');
}

// ❌ Bad: Type assertion without validation
const user = data as User;

// ✅ Good: Validate before casting
if (isUser(data)) {
  const user: User = data; // Type is safely narrowed
}
```

### 4. Use Discriminated Unions for State Management

```typescript
// Define a discriminated union for request state
type RequestState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T };

// Use with exhaustive checking
function handleState<T>(state: RequestState<T>) {
  switch(state.status) {
    case 'idle': return renderIdle();
    case 'loading': return renderLoading();
    case 'error': return renderError(state.error);
    case 'success': return renderSuccess(state.data);
    default: {
      // TypeScript will error if a case is missing
      const _exhaustiveCheck: never = state;
      return null;
    }
  }
}
```

### 5. Use the Result Pattern for Error Handling

```typescript
import { Result, ValidationError, toAppError } from '@obsidian-magic/core';

// Return Result instead of throwing
function processData(input: unknown): Result<ProcessedData> {
  if (!isValidInput(input)) {
    return Result.fail(new ValidationError('Invalid input', { field: 'input' }));
  }
  
  try {
    const processed = process(input as ValidInput);
    return Result.ok(processed);
  } catch (err) {
    return Result.fail(toAppError(err));
  }
}

// Chain operations with Results
async function processThenSave(input: unknown): Promise<Result<SavedData>> {
  return processData(input)
    .andThen(data => saveData(data))
    .andThen(savedId => loadSavedData(savedId));
}
```

### 6. Type React Components Properly

```typescript
// Define prop types with optional properties where appropriate
interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

// Use destructuring with defaults
function Button({ 
  label, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}: ButtonProps) {
  // Return JSX (rendered here as text for documentation)
  // In real code, this would be a JSX element
  // <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled} type="button">
  //   {label}
  // </button>
  return renderButton(label, onClick, variant, disabled);
}

// For useState with complex types, provide explicit typing
function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<RequestState<User>>({ status: 'idle' });
  
  // ...
}
```

### 7. Properly Type Test Files

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

// Type mock functions
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
const handleClick = vi.fn<[], void>();

describe('Button', () => {
  it('renders with the correct label', () => {
    // In real tests, this would render a component 
    // render(<Button label="Click me" onClick={handleClick} />);
    renderButton("Click me", handleClick);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    // render(<Button label="Click me" onClick={handleClick} />);
    renderButton("Click me", handleClick);
    
    const button = screen.getByRole('button');
    button.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 8. Handling Error Types Safely

```typescript
// ❌ Bad: Unsafe member access on error types
try {
  // some operation
} catch (err) {
  console.log(err.message); // ESLint: Unsafe member access on error type
}

// ✅ Good: Proper error type narrowing
try {
  // some operation
} catch (err) {
  const error = toAppError(err);
  console.log(error.message); // Now safe
}

// ✅ Better: Use Result pattern to avoid exception handling
const result = doSomething();
if (result.isErr()) {
  const error = result.error;
  console.log(error.message);
}
```

### 9. Avoid Floating Promises

```typescript
// ❌ Bad: Unhandled promise (floating promise)
function handleClick() {
  fetchData(); // ESLint: Promise returned in function where void is expected
}

// ✅ Good: Properly handled promises
async function handleClick() {
  try {
    await fetchData();
  } catch (err) {
    handleError(toAppError(err));
  }
}

// If you intentionally don't want to wait:
function handleClick() {
  void fetchData().catch(err => handleError(toAppError(err)));
}
```

## Common Type Safety Issues to Avoid

1. **Untyped Empty Arrays and Objects**
   ```typescript
   // ❌ Bad: TypeScript infers `any[]` type
   const items = [];
   
   // ✅ Good: Explicit type annotation
   const items: string[] = [];
   ```

2. **Missing Promise Error Handling**
   ```typescript
   // ❌ Bad: No error handling
   async function fetchData() {
     const response = await fetch('/api/data');
     const data = await response.json();
     return data;
   }
   
   // ✅ Good: Proper error handling with Result
   async function fetchData(): Promise<Result<Data>> {
     try {
       const response = await fetch('/api/data');
       if (!response.ok) {
         return Result.fail(new APIError(`API error: ${response.status}`, { 
           statusCode: response.status 
         }));
       }
       const data = await response.json();
       return Result.ok(data);
     } catch (err) {
       return Result.fail(toAppError(err));
     }
   }
   ```

3. **Inconsistent Null Handling**
   ```typescript
   // ❌ Bad: Inconsistent null checking
   function getUsername(user: User | null): string {
     if (user) {
       return user.name;
     }
     return 'Anonymous';
   }
   
   // ✅ Good: Nullish coalescing
   function getUsername(user: User | null): string {
     return user?.name ?? 'Anonymous';
   }
   ```

4. **Unused Variables**
   ```typescript
   // ❌ Bad: Variable defined but never used
   function processData(data: Data) {
     const tempValue = data.value * 2; // ESLint: 'tempValue' is defined but never used
     return data.name;
   }
   
   // ✅ Good: Only declare variables you actually use
   function processData(data: Data) {
     return data.name;
   }
   ```

5. **Unsafe Type Assertions in Tests**
   ```typescript
   // ❌ Bad: Unsafe assertions in tests
   it('processes data', () => {
     const result = processData(input);
     expect(result.value).toBe('expected');  // May fail if result is error
   });
   
   // ✅ Good: Type-safe assertions in tests
   it('processes data', () => {
     const result = processData(input);
     expect(result.isOk()).toBe(true);
     if (result.isOk()) {
       expect(result.value).toBe('expected');
     }
   });
   ```

## Tools for Type Safety

1. **ESLint with Typescript-ESLint**: We use ESLint with typescript-eslint configured for strict type checking
2. **Runtime Validation**: Use Zod or similar for runtime validation of external data
3. **VSCode Extensions**: Recommended extensions for better type safety:
   - ESLint
   - TypeScript Error Translator
   - Error Lens

## Implementation Example 

```typescript
// Complete tagged data model example
import { z } from 'zod';
import { Result } from '@obsidian-magic/core';

// Define literal types for constrained values
type Year = `${number}`;

const LifeAreas = ['career', 'relationships', 'health', 'learning', 'projects', 
                   'personal-growth', 'finance', 'hobby'] as const;
type LifeArea = typeof LifeAreas[number];

// Use interfaces for object types
interface TopicalTag {
  domain: string;
  subdomain?: string;
  contextual?: string;
}

const ConversationTypes = ['theory', 'practical', 'meta', 'casual', 'adhd-thought',
                           'deep-dive', 'exploration', 'experimental', 'reflection',
                           'planning', 'question', 'analysis'] as const;
type ConversationType = typeof ConversationTypes[number];

// Complete tag set
interface TagSet {
  year: Year;
  lifeArea?: LifeArea;
  topicalTags: TopicalTag[];
  conversationType: ConversationType;
}

// Zod schema for runtime validation matches TypeScript types
const tagSetSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  lifeArea: z.enum(LifeAreas).optional(),
  topicalTags: z.array(z.object({
    domain: z.string(),
    subdomain: z.string().optional(),
    contextual: z.string().optional()
  })).max(3),
  conversationType: z.enum(ConversationTypes)
});

// Type-safe function using Result pattern
function validateTagSet(data: unknown): Result<TagSet> {
  try {
    const validData = tagSetSchema.parse(data);
    return Result.ok(validData);
  } catch (err) {
    return Result.fail(new ValidationError('Invalid tag set', { cause: err }));
  }
}
``` 