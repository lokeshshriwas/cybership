//  Import from here — never from individual carrier files.

export type { ICarrier } from './core/interfaces/carrier.interface';
export type { RateRequest, Address, Package, ServiceLevel } from './core/models/shipment.model';
export type { RateQuote } from './core/models/rate.model';
export { CarrierError, ErrorCode } from './core/models/error.model';
export { registry, carrierRegistry, CarrierRegistry } from './core/registry/carrier.registry';

export { UpsCarrier } from './carriers/ups/ups.carrier';
export { UpsAuth } from './carriers/ups/ups.auth';
export { UpsClient } from './carriers/ups/ups.client';
export { UpsMapper } from './carriers/ups/ups.mapper';
export { UpsValidator } from './carriers/ups/ups.validator';

export { FedExCarrier } from './carriers/fedex/fedex.carrier';
