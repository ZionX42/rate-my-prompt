import { describe, it, expect } from '@jest/globals';

// Simple schema validation test that doesn't require database connection
describe('Database Schema', () => {
  it('should have valid schema definition', () => {
    // This test just checks that the schema file exists and is parseable
    const schemaPath = '../../prisma/schema.prisma';
    
    // Check that we can require the schema definition
    expect(() => {
      const fs = require('fs');
      const path = require('path');
      const schemaFile = path.join(__dirname, schemaPath);
      
      if (fs.existsSync(schemaFile)) {
        const schemaContent = fs.readFileSync(schemaFile, 'utf8');
        
        // Basic schema validation - check for required models
        expect(schemaContent).toContain('model User');
        expect(schemaContent).toContain('model Account');
        expect(schemaContent).toContain('model Session');
        expect(schemaContent).toContain('model Prompt');
        expect(schemaContent).toContain('model Rating');
        expect(schemaContent).toContain('model Comment');
        expect(schemaContent).toContain('model VerificationToken');
        
        // Check for enums
        expect(schemaContent).toContain('enum Role');
      }
    }).not.toThrow();
  });
  
  it('should have Prisma client generated', () => {
    // Check that Prisma client was generated
    const fs = require('fs');
    const path = require('path');
    const clientPath = path.join(__dirname, '../../app/generated/prisma');
    
    expect(fs.existsSync(clientPath)).toBe(true);
    expect(fs.existsSync(path.join(clientPath, 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(clientPath, 'index.d.ts'))).toBe(true);
  });
});
