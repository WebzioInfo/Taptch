import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ActorContext } from '../types';

export const CurrentActor = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ActorContext | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.actor || null;
  },
);

