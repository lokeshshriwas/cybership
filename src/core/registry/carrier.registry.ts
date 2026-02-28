import { ICarrier } from '../interfaces/carrier.interface';
import { ErrorCode, CarrierError } from '../models/error.model';

/**
 * Central registry that maps carrier IDs to their implementations.
 * Carriers are registered at startup in app.ts; the route layer queries the registry.
 */
export class CarrierRegistry {
    private readonly carriers = new Map<string, ICarrier>();

    register(carrier: ICarrier): void {
        if (this.carriers.has(carrier.carrierId)) {
            throw new Error(`Carrier "${carrier.carrierId}" is already registered.`);
        }
        this.carriers.set(carrier.carrierId, carrier);
    }

    get(carrierId: string): ICarrier {
        const carrier = this.carriers.get(carrierId);
        if (!carrier) {
            throw new CarrierError(
                ErrorCode.CARRIER_ERROR,
                `Carrier '${carrierId}' is not found`,
                carrierId,
                false,
            );
        }
        return carrier;
    }

    getAll(): ICarrier[] {
        return Array.from(this.carriers.values());
    }

    has(carrierId: string): boolean {
        return this.carriers.has(carrierId);
    }
}

/** Singleton registry shared across the application */
export const carrierRegistry = new CarrierRegistry();

/** Alias used by the route layer (per spec) */
export const registry = carrierRegistry;
