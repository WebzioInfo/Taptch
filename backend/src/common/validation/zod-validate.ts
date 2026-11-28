import { BadRequestException } from '@nestjs/common';
import type { z } from 'zod';

/**
 * Validates an incoming payload against a Zod schema and throws a NestJS BadRequestException
 * with field-level details on failure.
 */
export function parseWithZod<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
  label = 'Request payload',
): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException({
      message: `${label} validation failed.`,
      details: result.error.flatten().fieldErrors,
    });
  }
  return result.data;
}
