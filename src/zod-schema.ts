import { z } from "zod";

/**
 * Check if a Zod schema is optional or has a default value.
 */
export function isOptional(zodSchema: z.ZodTypeAny): boolean {
    return (
        zodSchema._def.typeName === "ZodOptional" ||
        zodSchema._def.typeName === "ZodDefault"
    );
}

/**
 * Convert a Zod object with validators to JSON Schema (legacy helper)
 */
export function convertObjectToJsonSchema(obj: Record<string, any>): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        if (value && (value as any)._def) {
            properties[key] = convertZodToJsonSchema(value as any);
            if (!isOptional(value as any)) {
                required.push(key);
            }
        }
    }

    return {
        type: "object",
        properties,
        ...(required.length > 0 && { required }),
        additionalProperties: false,
    };
}

/**
 * Convert Zod schema to JSON Schema format (extended)
 */
export function convertZodToJsonSchema(zodSchema: z.ZodTypeAny): any {
    if (!zodSchema || !zodSchema._def) return { type: "object" };

    switch (zodSchema._def.typeName) {
        case "ZodObject": {
            const properties: Record<string, any> = {};
            const required: string[] = [];
            const shape = (zodSchema as z.ZodObject<any>)._def.shape();
            for (const [key, value] of Object.entries(shape)) {
                properties[key] = convertZodToJsonSchema(value as any);
                if (!isOptional(value as any)) required.push(key);
            }
            return {
                type: "object",
                properties,
                ...(required.length > 0 && { required }),
                additionalProperties: false,
            };
        }
        case "ZodString": {
            const stringSchema: any = { type: "string" };
            if (zodSchema._def.description)
                stringSchema.description = zodSchema._def.description;
            if (zodSchema._def.checks) {
                (zodSchema._def.checks as any[]).forEach((check) => {
                    if (check.kind === "min") stringSchema.minLength = check.value;
                    if (check.kind === "max") stringSchema.maxLength = check.value;
                });
            }
            return stringSchema;
        }
        case "ZodNumber":
            return {
                type: "number",
                ...(zodSchema._def.description && {
                    description: zodSchema._def.description,
                }),
            };
        case "ZodBoolean":
            return {
                type: "boolean",
                ...(zodSchema._def.description && {
                    description: zodSchema._def.description,
                }),
            };
        case "ZodEnum":
            return {
                type: "string",
                enum: (zodSchema as any)._def.values,
                ...(zodSchema._def.description && {
                    description: zodSchema._def.description,
                }),
            };
        case "ZodArray": {
            // @ts-ignore innerType exists
            const itemsSchema = convertZodToJsonSchema(zodSchema._def.type);
            return {
                type: "array",
                items: itemsSchema,
            };
        }
        case "ZodUnion": {
            const options = (zodSchema as any)._def.options as z.ZodTypeAny[];
            return {
                oneOf: options.map((opt) => convertZodToJsonSchema(opt)),
            };
        }
        case "ZodDate":
            return { type: "string", format: "date-time" };
        case "ZodDefault": {
            // @ts-ignore defaultValue exists
            const base = convertZodToJsonSchema(zodSchema._def.innerType);
            return {
                ...base,
                // @ts-ignore defaultValue exists
                default: zodSchema._def.defaultValue(),
            };
        }
        case "ZodOptional":
            return convertZodToJsonSchema(zodSchema._def.innerType);
        default:
            return { type: "string" };
    }
} 