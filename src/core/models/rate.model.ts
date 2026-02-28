import { ServiceLevel } from './shipment.model';

export interface RateQuote {
    carrier: string;
    serviceLevel: ServiceLevel | string;
    serviceName: string;
    price: number;
    currency: string;
    estimatedDays: number;
    guaranteedDelivery: boolean;
}
