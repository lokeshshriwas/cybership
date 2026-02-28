export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_REQUEST = 'INVALID_REQUEST',
    AUTH_FAILURE = 'AUTH_FAILURE',
    RATE_LIMIT = 'RATE_LIMIT',
    NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
    MALFORMED_RESPONSE = 'MALFORMED_RESPONSE',
    CARRIER_ERROR = 'CARRIER_ERROR',
    UNKNOWN = 'UNKNOWN',
}

export class CarrierError extends Error {
    constructor(
        public readonly code: ErrorCode,
        message: string,
        public readonly carrier: string,
        public readonly retryable: boolean = false,
        public readonly originalError?: unknown,
    ) {
        super(message);
        this.name = 'CarrierError';
        Object.setPrototypeOf(this, CarrierError.prototype);
    }
}
