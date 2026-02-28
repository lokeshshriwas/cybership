export const UPS_CARRIER_ID = 'ups' as const;

export const UPS_TOKEN_PATH = '/security/v1/oauth/token';
export const UPS_RATES_PATH = '/api/rating/v2403/Shop';

// Maps UPS service codes to human-readable labels
export const UPS_SERVICE_NAMES: Record<string, string> = {
    '01': 'UPS Next Day Air',
    '02': 'UPS 2nd Day Air',
    '03': 'UPS Ground',
    '07': 'UPS Worldwide Express',
    '08': 'UPS Worldwide Expedited',
    '11': 'UPS Standard',
    '12': 'UPS 3 Day Select',
    '13': 'UPS Next Day Air Saver',
    '14': 'UPS Next Day Air Early',
    '54': 'UPS Worldwide Express Plus',
    '59': 'UPS 2nd Day Air A.M.',
    '65': 'UPS Saver',
    '70': 'UPS Access Point Economy',
};

// Maps UPS service codes to ServiceLevel enum values
export const UPS_SERVICE_LEVEL_MAP: Record<string, string> = {
    '01': 'OVERNIGHT',
    '02': 'TWO_DAY',
    '03': 'GROUND',
    '07': 'EXPRESS',
    '08': 'EXPRESS',
    '11': 'GROUND',
    '12': 'GROUND',
    '13': 'OVERNIGHT',
    '14': 'OVERNIGHT',
    '54': 'EXPRESS',
    '59': 'TWO_DAY',
    '65': 'EXPRESS',
    '70': 'ECONOMY',
};

export const UPS_PACKAGE_TYPE_CODE = '02'; // Customer Supplied Package
export const DEFAULT_CURRENCY = 'USD';
