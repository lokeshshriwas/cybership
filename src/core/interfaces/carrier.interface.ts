import { RateRequest } from '../models/shipment.model';
import { RateQuote } from '../models/rate.model';


//   Every carrier implementation must satisfy this contract.
//   Express / HTTP knows nothing about this interface.

export interface ICarrier {
    // Unique carrier code used in the registry
    readonly carrierId: string;

    // Fetch rate quotes from the carrier API
    getRates(request: RateRequest): Promise<RateQuote[]>;
}
