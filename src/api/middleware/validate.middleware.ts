import { Request, Response, NextFunction } from 'express';

export function validateRateRequestMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const body = req.body;

    if (!body || typeof body !== 'object') {
        res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_REQUEST',
                message: 'Request body is required and must be JSON',
                retryable: false,
            },
        });
        return;
    }

    const missingFields: string[] = [];
    if (!body.origin) missingFields.push('origin');
    if (!body.destination) missingFields.push('destination');
    if (!body.package) missingFields.push('package');

    if (missingFields.length > 0) {
        res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_REQUEST',
                message: `Missing required fields: ${missingFields.join(', ')}`,
                retryable: false,
            },
        });
        return;
    }

    if (!body.origin.zip || !body.origin.country) {
        res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_REQUEST',
                message: 'origin must include zip and country',
                retryable: false,
            },
        });
        return;
    }

    if (!body.destination.zip || !body.destination.country) {
        res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_REQUEST',
                message: 'destination must include zip and country',
                retryable: false,
            },
        });
        return;
    }

    if (
        body.package.weightLbs === undefined ||
        body.package.lengthIn === undefined ||
        body.package.widthIn === undefined ||
        body.package.heightIn === undefined
    ) {
        res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_REQUEST',
                message: 'package must include weightLbs, lengthIn, widthIn, heightIn',
                retryable: false,
            },
        });
        return;
    }

    next();
}
