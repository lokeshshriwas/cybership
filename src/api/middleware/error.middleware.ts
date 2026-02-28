import { Request, Response, NextFunction } from 'express';
import { CarrierError, ErrorCode } from '../../core/models/error.model';

// Map ErrorCode to HTTP status code
const ERROR_CODE_TO_HTTP_STATUS: Record<ErrorCode, number> = {
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.INVALID_REQUEST]: 400,
    [ErrorCode.AUTH_FAILURE]: 401,
    [ErrorCode.RATE_LIMIT]: 429,
    [ErrorCode.NETWORK_TIMEOUT]: 504,
    [ErrorCode.MALFORMED_RESPONSE]: 502,
    [ErrorCode.CARRIER_ERROR]: 502,
    [ErrorCode.UNKNOWN]: 500,
};

export function errorMiddleware(
    error: unknown,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
): void {

    // Handle our structured CarrierError
    if (error instanceof CarrierError) {
        const httpStatus = ERROR_CODE_TO_HTTP_STATUS[error.code] ?? 500;
        res.status(httpStatus).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                carrier: error.carrier,
                retryable: error.retryable,
            },
        });
        return;
    }

    // Handle carrier not found from registry.get()
    if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
            success: false,
            error: {
                code: 'CARRIER_NOT_FOUND',
                message: error.message,
                retryable: false,
            },
        });
        return;
    }

    // Fallback for any unexpected error — never expose internals
    console.error('Unexpected error:', error);
    res.status(500).json({
        success: false,
        error: {
            code: ErrorCode.UNKNOWN,
            message: 'An unexpected error occurred',
            retryable: false,
        },
    });
}
