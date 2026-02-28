import { ICarrier } from '../../core/interfaces/carrier.interface';
import { RateRequest } from '../../core/models/shipment.model';
import { RateQuote } from '../../core/models/rate.model';
import { ErrorCode, CarrierError } from '../../core/models/error.model';

// FedEx carrier stub — throws a clear not-yet-implemented error.
// Replace getRates body with a real FedEx implementation.

export class FedExCarrier implements ICarrier {
    readonly carrierId = 'fedex';

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getRates(_request: RateRequest): Promise<RateQuote[]> {
        throw new CarrierError(
            ErrorCode.CARRIER_ERROR,
            'FedEx carrier integration is not yet implemented',
            this.carrierId,
            false,
        );
    }
}
