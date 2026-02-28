import { RateRequest } from '../../core/models/shipment.model';
import { ErrorCode, CarrierError } from '../../core/models/error.model';
import { UPS_CARRIER_ID } from './ups.constants';

// Validates a RateRequest before it is sent to UPS.
// Throws a CarrierError(VALIDATION_ERROR) on first failure found.

export class UpsValidator {
    validate(request: RateRequest): void {
        const pkg = request.package;

        if (!pkg) {
            this.fail('package is required');
        }

        if (pkg.weightLbs <= 0) {
            this.fail('package.weightLbs must be positive');
        }
        if (pkg.lengthIn <= 0 || pkg.widthIn <= 0 || pkg.heightIn <= 0) {
            this.fail('package dimensions (lengthIn, widthIn, heightIn) must all be > 0');
        }
        if (pkg.weightLbs > 150) {
            this.fail(`package.weightLbs ${pkg.weightLbs} exceeds UPS max of 150 lbs`);
        }

        this.validateAddress('origin', request.origin.zip, request.origin.country);
        this.validateAddress('destination', request.destination.zip, request.destination.country);
    }

    private validateAddress(field: string, zip: string, country: string): void {
        if (!zip || zip.trim() === '') {
            this.fail(`${field}.zip is required`);
        }
        if (!country || country.length !== 2) {
            this.fail(`${field}.country must be a 2-letter ISO code`);
        }
    }

    private fail(message: string): never {
        throw new CarrierError(
            ErrorCode.VALIDATION_ERROR,
            `Invalid rate request: ${message}`,
            UPS_CARRIER_ID,
            false,
        );
    }
}
