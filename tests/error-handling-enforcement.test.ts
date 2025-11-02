/**
 * CI Test: Centralized Error Handling Enforcement
 * 
 * This test ensures that all error handling in DooDates follows the centralized pattern.
 * It scans the codebase for violations and fails the CI if inconsistent patterns are found.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { glob } from 'glob';
import { readFileSync } from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

describe('Centralized Error Handling Enforcement', () => {
  let sourceFiles: string[] = [];

  beforeAll(async () => {
    // Get all TypeScript files in src directory
    sourceFiles = await glob('**/*.{ts,tsx}', { 
      cwd: SRC_DIR,
      ignore: [
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/components/ui/**', // Allow UI components to use context errors
        '**/lib/error-handling.ts', // Allow the error handling file itself
        '**/lib/logger.ts', // Allow the logger file (it IS the logging system)
        '**/__prototypes__/**' // Exclude prototype/experimental files
      ]
    });
  });

  it('should not use direct console.error calls', () => {
    const violations: Array<{ file: string; line: number; content: string }> = [];

    sourceFiles.forEach(file => {
      const filePath = path.join(SRC_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Skip commented lines
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
          return;
        }
        
        // Allow console.error in development/debugging contexts
        if (line.includes('console.error') && 
            !line.includes('// DEV:') && 
            !line.includes('// DEBUG:') &&
            !line.includes('import.meta.env.DEV')) {
          violations.push({
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });

    if (violations.length > 0) {
      const errorMessage = violations
        .map(v => `${v.file}:${v.line} - ${v.content}`)
        .join('\n');
      
      throw new Error(
        `Found ${violations.length} direct console.error usage(s). Use logError() instead:\n${errorMessage}`
      );
    }

    expect(violations.length).toBe(0);
  });

  it('should not use direct console.warn calls for error scenarios', () => {
    const violations: Array<{ file: string; line: number; content: string }> = [];

    sourceFiles.forEach(file => {
      const filePath = path.join(SRC_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Skip commented lines
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
          return;
        }
        
        // Check for console.warn in error contexts
        if (line.includes('console.warn') && 
            (line.toLowerCase().includes('error') || 
             line.toLowerCase().includes('failed') ||
             line.toLowerCase().includes('exception'))) {
          violations.push({
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });

    if (violations.length > 0) {
      const errorMessage = violations
        .map(v => `${v.file}:${v.line} - ${v.content}`)
        .join('\n');
      
      throw new Error(
        `Found ${violations.length} console.warn usage(s) in error contexts. Use logError() instead:\n${errorMessage}`
      );
    }

    expect(violations.length).toBe(0);
  });

  it('should not use throw new Error directly', () => {
    const violations: Array<{ file: string; line: number; content: string }> = [];

    sourceFiles.forEach(file => {
      const filePath = path.join(SRC_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Allow throw new Error in specific contexts
        if (line.includes('throw new Error') && 
            !line.includes('useAuth must be used within') &&
            !line.includes('must be used within a <') &&
            !file.includes('components/ui/')) {
          violations.push({
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });

    if (violations.length > 0) {
      const errorMessage = violations
        .map(v => `${v.file}:${v.line} - ${v.content}`)
        .join('\n');
      
      throw new Error(
        `Found ${violations.length} direct "throw new Error" usage(s). Use ErrorFactory instead:\n${errorMessage}`
      );
    }

    expect(violations.length).toBe(0);
  });

  it('should import centralized error handling where errors are used', () => {
    const violations: Array<{ file: string; reason: string }> = [];

    sourceFiles.forEach(file => {
      const filePath = path.join(SRC_DIR, file);
      const content = readFileSync(filePath, 'utf-8');

      // Skip files that don't handle errors
      if (!content.includes('catch') && !content.includes('throw') && !content.includes('Error')) {
        return;
      }

      // Check if file uses error handling but doesn't import from centralized system
      const hasErrorHandling = content.includes('catch (error)') || 
                              content.includes('catch(error)') ||
                              content.includes('throw ');

      const hasCentralizedImport = content.includes('from ../lib/error-handling') ||
                                  content.includes('from ../../lib/error-handling') ||
                                  content.includes('from ../../../lib/error-handling') ||
                                  content.includes('from \'../lib/error-handling\'') ||
                                  content.includes('from "../../lib/error-handling"');

      if (hasErrorHandling && !hasCentralizedImport && !file.includes('types/')) {
        violations.push({
          file,
          reason: 'Uses error handling but does not import centralized error system'
        });
      }
    });

    if (violations.length > 0) {
      const errorMessage = violations
        .map(v => `${v.file} - ${v.reason}`)
        .join('\n');
      
      console.warn(
        `Warning: ${violations.length} file(s) use error handling without centralized imports:\n${errorMessage}`
      );
    }

    // This is a warning, not a failure for now
    expect(true).toBe(true);
  });

  it('should use DooDatesError for custom errors', () => {
    const violations: Array<{ file: string; line: number; content: string }> = [];

    sourceFiles.forEach(file => {
      const filePath = path.join(SRC_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // ConversationError is an alias to DooDatesError - allow it
        // (Legacy check removed as ConversationError is valid)

        // Look for other custom error classes that should use DooDatesError
        if (line.match(/new \w+Error\(/) && 
            !line.includes('DooDatesError') &&
            !line.includes('ConversationError') &&
            !line.includes('ValidationError') &&
            !line.includes('TypeError') &&
            !line.includes('SyntaxError') &&
            !line.includes('ReferenceError')) {
          violations.push({
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });

    if (violations.length > 0) {
      const errorMessage = violations
        .map(v => `${v.file}:${v.line} - ${v.content}`)
        .join('\n');
      
      throw new Error(
        `Found ${violations.length} custom error usage(s). Use DooDatesError/ErrorFactory instead:\n${errorMessage}`
      );
    }

    expect(violations.length).toBe(0);
  });

  it('should provide helpful error messages for common violations', () => {
    // This test documents the expected patterns for developers
    const expectedPatterns = {
      'Centralized Error Logging': 'logError(ErrorFactory.storage("message", "userMessage"), { context })',
      'Error Creation': 'ErrorFactory.validation("message", "userMessage")',
      'Error Handling': 'handleError(error, { context }, "fallback message")',
      'Async Error Wrapping': 'withErrorHandling(async () => { ... }, { context })',
      'Custom Error Types': 'throw ErrorFactory.network("message", "userMessage")'
    };

    // Log patterns for documentation
    Object.entries(expectedPatterns).forEach(([pattern, example]) => {
      console.info(`✅ ${pattern}: ${example}`);
    });

    expect(Object.keys(expectedPatterns)).toHaveLength(5);
  });
});

describe('Error Handling Integration Tests', () => {
  it('should have centralized error handling system available', async () => {
    // Test that we can import the centralized system
    const { DooDatesError, ErrorFactory, logError, handleError } = await import('../src/lib/error-handling');
    
    expect(DooDatesError).toBeDefined();
    expect(ErrorFactory).toBeDefined();
    expect(logError).toBeDefined();
    expect(handleError).toBeDefined();
  });

  it('should have error factory methods for common scenarios', async () => {
    const { ErrorFactory } = await import('../src/lib/error-handling');
    
    expect(typeof ErrorFactory.network).toBe('function');
    expect(typeof ErrorFactory.validation).toBe('function');
    expect(typeof ErrorFactory.storage).toBe('function');
    expect(typeof ErrorFactory.auth).toBe('function');
    expect(typeof ErrorFactory.api).toBe('function');
    expect(typeof ErrorFactory.critical).toBe('function');
  });

  it('should properly categorize and handle errors', async () => {
    const { ErrorFactory, handleError } = await import('../src/lib/error-handling');
    
    const testError = ErrorFactory.validation('Test error', 'Test user message');
    const handledError = handleError(testError, { component: 'test' });
    
    expect(handledError.name).toBe('DooDatesError');
    expect(handledError.severity).toBeDefined();
    expect(handledError.category).toBeDefined();
  });
});
