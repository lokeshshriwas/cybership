import express, { Application } from 'express';
import { ratesRouter } from './routes/rates.route';
import { errorMiddleware } from './middleware/error.middleware';

export function createApp(): Application {
    const app = express();

    app.use(express.json());
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'cybership-carrier-integration' });
    });

    app.use('/api/v1', ratesRouter);
    app.use(errorMiddleware);

    return app;
}
