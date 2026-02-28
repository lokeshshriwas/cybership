import { Router, Request, Response, NextFunction } from 'express';
import { registry } from '../../core/registry/carrier.registry';
import { validateRateRequestMiddleware } from '../middleware/validate.middleware';
import { RateRequest } from '../../core/models/shipment.model';

export const ratesRouter = Router();

ratesRouter.post(
    '/rates',
    validateRateRequestMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // UPS by default
            const { carrier: carrierName = 'ups', ...rateRequest } = req.body;

            // Get the carrier service from registry
            const carrierService = registry.get(carrierName);

            // Call the service
            const quotes = await carrierService.getRates(rateRequest as RateRequest);

            res.status(200).json({
                success: true,
                carrier: carrierName,
                count: quotes.length,
                quotes,
            });
        } catch (error) {
            next(error);
        }
    },
);
