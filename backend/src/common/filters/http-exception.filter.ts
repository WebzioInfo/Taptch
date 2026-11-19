import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { randomBytes } from 'crypto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const referenceId = `ref_${randomBytes(4).toString('hex')}`;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj.message as string) || exception.message;
        code = (obj.error as string) || 'HTTP_ERROR';
        details = obj;
      }
    } else if (exception instanceof Error) {
      const err = exception as Error & {
        code?: string;
        detail?: string;
        table_name?: string;
        column_name?: string;
        schema_name?: string;
        cause?: any;
      };

      const cause = err.cause || {};
      const pgCode = cause.code || err.code || 'UNKNOWN_CODE';
      const pgDetail = cause.detail || err.detail;
      const pgTable = cause.table_name || cause.table || err.table_name;
      const pgColumn = cause.column_name || cause.column || err.column_name;
      const pgMessage = cause.message || err.message;

      this.logger.error(
        `[DATABASE/UNHANDLED ERROR] [${referenceId}] ${request.method} ${request.url}\n` +
        `  Message: ${err.message}\n` +
        `  Cause Message: ${pgMessage}\n` +
        `  PG Code: ${pgCode}\n` +
        `  PG Detail: ${pgDetail || 'N/A'}\n` +
        `  Table: ${pgTable || 'N/A'}\n` +
        `  Column: ${pgColumn || 'N/A'}\n` +
        `  Stack: ${err.stack}`
      );

      // Safe production response: never leak internal SQL, table, or column names to client
      message = 'Something went wrong. Please try again.';
      code = 'INTERNAL_ERROR';
      details = process.env.NODE_ENV !== 'production' ? { errorMessage: err.message, pgCode } : null;
    } else {
      this.logger.error(`[UNHANDLED NON-ERROR EXCEPTION] [${referenceId}] ${request.method} ${request.url}: ${JSON.stringify(exception)}`);
      message = 'Something went wrong. Please try again.';
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
        referenceId,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

