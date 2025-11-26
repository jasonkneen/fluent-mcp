import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { isOptional, convertObjectToJsonSchema, convertZodToJsonSchema } from './zod-schema.js';

describe('isOptional', () => {
  it('should return true for ZodOptional types', () => {
    const optionalString = z.string().optional();
    expect(isOptional(optionalString)).toBe(true);
  });

  it('should return true for ZodDefault types', () => {
    const defaultString = z.string().default('hello');
    expect(isOptional(defaultString)).toBe(true);
  });

  it('should return false for required types', () => {
    const requiredString = z.string();
    expect(isOptional(requiredString)).toBe(false);
  });

  it('should return false for ZodNumber', () => {
    const requiredNumber = z.number();
    expect(isOptional(requiredNumber)).toBe(false);
  });

  it('should return false for ZodBoolean', () => {
    const requiredBoolean = z.boolean();
    expect(isOptional(requiredBoolean)).toBe(false);
  });

  it('should return false for ZodObject', () => {
    const obj = z.object({ name: z.string() });
    expect(isOptional(obj)).toBe(false);
  });
});

describe('convertZodToJsonSchema', () => {
  describe('ZodString', () => {
    it('should convert basic string schema', () => {
      const schema = z.string();
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'string' });
    });

    it('should include description when provided', () => {
      const schema = z.string().describe('A user name');
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'string', description: 'A user name' });
    });

    it('should include minLength constraint', () => {
      const schema = z.string().min(3);
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'string', minLength: 3 });
    });

    it('should include maxLength constraint', () => {
      const schema = z.string().max(10);
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'string', maxLength: 10 });
    });

    it('should include both min and max constraints', () => {
      const schema = z.string().min(3).max(10);
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'string', minLength: 3, maxLength: 10 });
    });

    it('should include description with constraints', () => {
      const schema = z.string().min(3).describe('A short name');
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'string',
        description: 'A short name',
        minLength: 3
      });
    });
  });

  describe('ZodNumber', () => {
    it('should convert basic number schema', () => {
      const schema = z.number();
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'number' });
    });

    it('should include description when provided', () => {
      const schema = z.number().describe('User age');
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'number', description: 'User age' });
    });
  });

  describe('ZodBoolean', () => {
    it('should convert basic boolean schema', () => {
      const schema = z.boolean();
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'boolean' });
    });

    it('should include description when provided', () => {
      const schema = z.boolean().describe('Is active flag');
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'boolean', description: 'Is active flag' });
    });
  });

  describe('ZodEnum', () => {
    it('should convert enum schema', () => {
      const schema = z.enum(['red', 'green', 'blue']);
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'string',
        enum: ['red', 'green', 'blue']
      });
    });

    it('should include description when provided', () => {
      const schema = z.enum(['small', 'medium', 'large']).describe('Size selection');
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'string',
        enum: ['small', 'medium', 'large'],
        description: 'Size selection'
      });
    });
  });

  describe('ZodArray', () => {
    it('should convert array of strings', () => {
      const schema = z.array(z.string());
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'array',
        items: { type: 'string' }
      });
    });

    it('should convert array of numbers', () => {
      const schema = z.array(z.number());
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'array',
        items: { type: 'number' }
      });
    });

    it('should convert array of objects', () => {
      const schema = z.array(z.object({ id: z.number() }));
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'number' } },
          required: ['id'],
          additionalProperties: false
        }
      });
    });
  });

  describe('ZodObject', () => {
    it('should convert simple object schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      });
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name', 'age'],
        additionalProperties: false
      });
    });

    it('should handle optional properties', () => {
      const schema = z.object({
        name: z.string(),
        nickname: z.string().optional()
      });
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          nickname: { type: 'string' }
        },
        required: ['name'],
        additionalProperties: false
      });
    });

    it('should handle default properties', () => {
      const schema = z.object({
        name: z.string(),
        role: z.string().default('user')
      });
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string', default: 'user' }
        },
        required: ['name'],
        additionalProperties: false
      });
    });

    it('should handle nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string()
        })
      });
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' }
            },
            required: ['name', 'email'],
            additionalProperties: false
          }
        },
        required: ['user'],
        additionalProperties: false
      });
    });

    it('should handle empty object schema', () => {
      const schema = z.object({});
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'object',
        properties: {},
        additionalProperties: false
      });
    });
  });

  describe('ZodUnion', () => {
    it('should convert union of primitives', () => {
      const schema = z.union([z.string(), z.number()]);
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        oneOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      });
    });

    it('should convert union of multiple types', () => {
      const schema = z.union([z.string(), z.number(), z.boolean()]);
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        oneOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' }
        ]
      });
    });
  });

  describe('ZodDate', () => {
    it('should convert date schema to string with date-time format', () => {
      const schema = z.date();
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'string', format: 'date-time' });
    });
  });

  describe('ZodDefault', () => {
    it('should include default value for string', () => {
      const schema = z.string().default('hello');
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'string', default: 'hello' });
    });

    it('should include default value for number', () => {
      const schema = z.number().default(42);
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'number', default: 42 });
    });

    it('should include default value for boolean', () => {
      const schema = z.boolean().default(true);
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'boolean', default: true });
    });
  });

  describe('ZodOptional', () => {
    it('should unwrap optional string', () => {
      const schema = z.string().optional();
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'string' });
    });

    it('should unwrap optional number', () => {
      const schema = z.number().optional();
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({ type: 'number' });
    });

    it('should unwrap optional object', () => {
      const schema = z.object({ name: z.string() }).optional();
      const result = convertZodToJsonSchema(schema);
      expect(result).toEqual({
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
        additionalProperties: false
      });
    });
  });

  describe('edge cases', () => {
    it('should return object type for null input', () => {
      const result = convertZodToJsonSchema(null as any);
      expect(result).toEqual({ type: 'object' });
    });

    it('should return object type for undefined input', () => {
      const result = convertZodToJsonSchema(undefined as any);
      expect(result).toEqual({ type: 'object' });
    });

    it('should return object type for object without _def', () => {
      const result = convertZodToJsonSchema({} as any);
      expect(result).toEqual({ type: 'object' });
    });

    it('should return string type for unknown Zod types', () => {
      const unknownSchema = { _def: { typeName: 'ZodUnknown' } } as any;
      const result = convertZodToJsonSchema(unknownSchema);
      expect(result).toEqual({ type: 'string' });
    });
  });
});

describe('convertObjectToJsonSchema', () => {
  it('should convert object with Zod validators', () => {
    const obj = {
      name: z.string(),
      age: z.number()
    };
    const result = convertObjectToJsonSchema(obj);
    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name', 'age'],
      additionalProperties: false
    });
  });

  it('should handle optional fields in object', () => {
    const obj = {
      name: z.string(),
      nickname: z.string().optional()
    };
    const result = convertObjectToJsonSchema(obj);
    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        nickname: { type: 'string' }
      },
      required: ['name'],
      additionalProperties: false
    });
  });

  it('should handle default fields in object', () => {
    const obj = {
      name: z.string(),
      role: z.string().default('user')
    };
    const result = convertObjectToJsonSchema(obj);
    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        role: { type: 'string', default: 'user' }
      },
      required: ['name'],
      additionalProperties: false
    });
  });

  it('should skip non-Zod values in object', () => {
    const obj = {
      name: z.string(),
      plainValue: 'just a string',
      anotherPlain: 123
    };
    const result = convertObjectToJsonSchema(obj);
    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' }
      },
      required: ['name'],
      additionalProperties: false
    });
  });

  it('should handle empty object', () => {
    const obj = {};
    const result = convertObjectToJsonSchema(obj);
    expect(result).toEqual({
      type: 'object',
      properties: {},
      additionalProperties: false
    });
  });

  it('should handle complex nested structures', () => {
    const obj = {
      user: z.object({
        profile: z.object({
          name: z.string(),
          bio: z.string().optional()
        })
      }),
      tags: z.array(z.string())
    };
    const result = convertObjectToJsonSchema(obj);
    expect(result).toEqual({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            profile: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                bio: { type: 'string' }
              },
              required: ['name'],
              additionalProperties: false
            }
          },
          required: ['profile'],
          additionalProperties: false
        },
        tags: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['user', 'tags'],
      additionalProperties: false
    });
  });

  it('should handle all optional fields', () => {
    const obj = {
      name: z.string().optional(),
      age: z.number().optional()
    };
    const result = convertObjectToJsonSchema(obj);
    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      additionalProperties: false
    });
  });
});
