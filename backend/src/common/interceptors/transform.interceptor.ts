import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // If data is already an envelope, return directly
        if (data && typeof data === 'object' && ('success' in data || 'error' in data)) {
          return data;
        }

        // Redirects or raw responses
        if (res.headersSent) {
          return data;
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}

