export type ServiceLevel =
    | 'GROUND'
    | 'EXPRESS'
    | 'OVERNIGHT'
    | 'TWO_DAY'
    | 'ECONOMY';

export interface Address {
    zip: string;
    country: string;
    city?: string;
    state?: string;
}

export interface Package {
    weightLbs: number;
    lengthIn: number;
    widthIn: number;
    heightIn: number;
}

// The canonical rate request — used by the HTTP layer, the registry,
// and every carrier implementation.
export interface RateRequest {
    origin: Address;
    destination: Address;
    package: Package;
    carrier?: string;
    serviceLevel?: ServiceLevel;
}
