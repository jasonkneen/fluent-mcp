import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { convertZodToJsonSchema, convertObjectToJsonSchema, isOptional } from './zod-schema.js';

describe('zod-schema utilities', () => {
  describe('isOptional', () => {
    it('should return true for optional schemas', () => {
      const optionalSchema = z.string().optional();
      expect(isOptional(optionalSchema)).toBe(true);
    });

    it('should return true for schemas with default values', () => {
      const defaultSchema = z.string().default('test');
      expect(isOptional(defaultSchema)).toBe(true);
    });

    it('should return false for required schemas', () => {
      const requiredSchema = z.string();
      expect(isOptional(requiredSchema)).toBe(false);
    });

    it('should return false for non-optional object schemas', () => {
      const objectSchema = z.object({ name: z.string() });
      expect(isOptional(objectSchema)).toBe(false);
    });
  });

  describe('convertZodToJsonSchema', () => {
    describe('string schemas', () => {
      it('should convert basic string schema', () => {
        const schema = z.string();
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({ type: 'string' });
      });

      it('should include description if provided', () => {
        const schema = z.string().describe('A test string');
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'string',
          description: 'A test string',
        });
      });

      it('should include min/max length constraints', () => {
        const schema = z.string().min(1).max(100);
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'string',
          minLength: 1,
          maxLength: 100,
        });
      });
    });

    describe('number schemas', () => {
      it('should convert basic number schema', () => {
        const schema = z.number();
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({ type: 'number' });
      });

      it('should include description if provided', () => {
        const schema = z.number().describe('A count value');
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'number',
          description: 'A count value',
        });
      });
    });

    describe('boolean schemas', () => {
      it('should convert basic boolean schema', () => {
        const schema = z.boolean();
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({ type: 'boolean' });
      });

      it('should include description if provided', () => {
        const schema = z.boolean().describe('A flag');
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'boolean',
          description: 'A flag',
        });
      });
    });

    describe('enum schemas', () => {
      it('should convert enum schema', () => {
        const schema = z.enum(['active', 'inactive', 'pending']);
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'string',
          enum: ['active', 'inactive', 'pending'],
        });
      });

      it('should include description if provided', () => {
        const schema = z.enum(['draft', 'published']).describe('Status of the item');
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'string',
          enum: ['draft', 'published'],
          description: 'Status of the item',
        });
      });
    });

    describe('array schemas', () => {
      it('should convert array of strings', () => {
        const schema = z.array(z.string());
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'array',
          items: { type: 'string' },
        });
      });

      it('should convert array of numbers', () => {
        const schema = z.array(z.number());
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'array',
          items: { type: 'number' },
        });
      });

      it('should convert array of objects', () => {
        const schema = z.array(z.object({ id: z.string() }));
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: ['id'],
            additionalProperties: false,
          },
        });
      });
    });

    describe('object schemas', () => {
      it('should convert simple object schema', () => {
        const schema = z.object({
          name: z.string(),
          age: z.number(),
        });
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
          required: ['name', 'age'],
          additionalProperties: false,
        });
      });

      it('should handle optional fields correctly', () => {
        const schema = z.object({
          name: z.string(),
          nickname: z.string().optional(),
        });
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'object',
          properties: {
            name: { type: 'string' },
            nickname: { type: 'string' },
          },
          required: ['name'],
          additionalProperties: false,
        });
      });

      it('should handle nested objects', () => {
        const schema = z.object({
          user: z.object({
            name: z.string(),
            email: z.string(),
          }),
        });
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
              required: ['name', 'email'],
              additionalProperties: false,
            },
          },
          required: ['user'],
          additionalProperties: false,
        });
      });
    });

    describe('union schemas', () => {
      it('should convert union of primitives', () => {
        const schema = z.union([z.string(), z.number()]);
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          oneOf: [{ type: 'string' }, { type: 'number' }],
        });
      });
    });

    describe('date schemas', () => {
      it('should convert date schema to string with date-time format', () => {
        const schema = z.date();
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'string',
          format: 'date-time',
        });
      });
    });

    describe('default schemas', () => {
      it('should include default value in output', () => {
        const schema = z.string().default('default-value');
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'string',
          default: 'default-value',
        });
      });

      it('should include default for numbers', () => {
        const schema = z.number().default(42);
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({
          type: 'number',
          default: 42,
        });
      });
    });

    describe('optional schemas', () => {
      it('should unwrap optional and return inner type', () => {
        const schema = z.string().optional();
        const result = convertZodToJsonSchema(schema);
        expect(result).toEqual({ type: 'string' });
      });
    });

    describe('edge cases', () => {
      it('should handle null/undefined input', () => {
        const result = convertZodToJsonSchema(null as any);
        expect(result).toEqual({ type: 'object' });
      });

      it('should handle unknown Zod types by defaulting to string', () => {
        // Create a mock schema with an unknown type
        const mockSchema = {
          _def: { typeName: 'ZodUnknownType' },
        };
        const result = convertZodToJsonSchema(mockSchema as any);
        expect(result).toEqual({ type: 'string' });
      });
    });
  });

  describe('convertObjectToJsonSchema', () => {
    it('should convert object with Zod validators', () => {
      const obj = {
        name: z.string(),
        age: z.number(),
      };
      const result = convertObjectToJsonSchema(obj);
      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
        additionalProperties: false,
      });
    });

    it('should handle optional fields in objects', () => {
      const obj = {
        name: z.string(),
        nickname: z.string().optional(),
      };
      const result = convertObjectToJsonSchema(obj);
      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          nickname: { type: 'string' },
        },
        required: ['name'],
        additionalProperties: false,
      });
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = convertObjectToJsonSchema(obj);
      expect(result).toEqual({
        type: 'object',
        properties: {},
        additionalProperties: false,
      });
    });

    it('should skip non-Zod values', () => {
      const obj = {
        name: z.string(),
        plainValue: 'not-a-schema',
      };
      const result = convertObjectToJsonSchema(obj);
      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
        additionalProperties: false,
      });
    });
  });
});
