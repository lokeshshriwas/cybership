import { ICarrier } from '../../core/interfaces/carrier.interface';
import { RateRequest } from '../../core/models/shipment.model';
import { RateQuote } from '../../core/models/rate.model';
import { ErrorCode, CarrierError } from '../../core/models/error.model';
import { UpsClient } from './ups.client';
import { UpsMapper } from './ups.mapper';
import { UpsValidator } from './ups.validator';
import { UPS_CARRIER_ID } from './ups.constants';

/**
 * Top-level UPS carrier facade — the only UPS file the registry touches.
 * Orchestrates: validate → map → API call → map response.
 */
export class UpsCarrier implements ICarrier {
    readonly carrierId = UPS_CARRIER_ID;

    constructor(
        private readonly client: UpsClient,
        private readonly mapper: UpsMapper,
        private readonly validator: UpsValidator,
    ) { }

    async getRates(request: RateRequest): Promise<RateQuote[]> {
        // 1. Validate domain model
        this.validator.validate(request);

        // 2. Map to UPS API payload
        const upsPayload = this.mapper.toRateRequest(request);

        // 3. Call UPS API
        const upsResponse = await this.client.fetchRates(upsPayload);

        // 4. Validate presence of rated shipments
        if (!upsResponse.RateResponse?.RatedShipment) {
            throw new CarrierError(
                ErrorCode.MALFORMED_RESPONSE,
                'UPS returned no rate quotes for the given shipment',
                UPS_CARRIER_ID,
                false,
            );
        }

        // 5. Map response back to domain model
        return this.mapper.fromRateResponse(upsResponse);
    }
}
