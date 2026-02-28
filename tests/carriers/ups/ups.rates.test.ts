import nock from 'nock';
import { UpsCarrier } from '../../../src/carriers/ups/ups.carrier';
import { UpsAuth } from '../../../src/carriers/ups/ups.auth';
import { UpsClient } from '../../../src/carriers/ups/ups.client';
import { UpsMapper } from '../../../src/carriers/ups/ups.mapper';
import { UpsValidator } from '../../../src/carriers/ups/ups.validator';
import { RateRequest } from '../../../src/core/models/shipment.model';

const BASE_URL = 'https://wwwcie.ups.com';
const TOKEN = 'mock-access-token';

const validRequest: RateRequest = {
    origin: {
        zip: '40202',
        country: 'US',
        city: 'Louisville',
        state: 'KY',
    },
    destination: {
        zip: '10001',
        country: 'US',
        city: 'New York',
        state: 'NY',
    },
    package: { weightLbs: 5, lengthIn: 10, widthIn: 8, heightIn: 6 },
};

function makeCarrier(): UpsCarrier {
    const auth = new UpsAuth('test-id', 'test-secret', BASE_URL);
    const client = new UpsClient(auth, BASE_URL);
    const mapper = new UpsMapper();
    const validator = new UpsValidator();
    return new UpsCarrier(client, mapper, validator);
}

beforeEach(() => {
    nock.cleanAll();
    nock(BASE_URL)
        .post('/security/v1/oauth/token')
        .reply(200, {
            access_token: TOKEN,
            token_type: 'Bearer',
            expires_in: '3600',
            issued_at: Date.now().toString(),
            client_id: 'test-id',
            scope: 'public',
        });
});

afterAll(() => nock.restore());

describe('UPS Rates — happy path', () => {
    it('returns mapped RateQuote[] for valid shipment', async () => {
        nock(BASE_URL)
            .post('/api/rating/v2403/Shop')
            .reply(200, {
                RateResponse: {
                    Response: { ResponseStatus: { Code: '1', Description: 'Success' } },
                    RatedShipment: [
                        {
                            Service: { Code: '03' },
                            TotalCharges: { CurrencyCode: 'USD', MonetaryValue: '12.50' },
                            GuaranteedDelivery: { BusinessDaysInTransit: '5' },
                        },
                        {
                            Service: { Code: '02' },
                            TotalCharges: { CurrencyCode: 'USD', MonetaryValue: '24.00' },
                            GuaranteedDelivery: { BusinessDaysInTransit: '2' },
                        },
                    ],
                },
            });

        const carrier = makeCarrier();
        const quotes = await carrier.getRates(validRequest);

        expect(quotes).toHaveLength(2);
        expect(quotes[0]).toMatchObject({
            carrier: 'ups',
            serviceLevel: 'GROUND',
            serviceName: 'UPS Ground',
            price: 12.5,
            currency: 'USD',
            estimatedDays: 5,
            guaranteedDelivery: true,
        });
        expect(quotes[1]).toMatchObject({
            serviceLevel: 'TWO_DAY',
            serviceName: 'UPS 2nd Day Air',
            price: 24,
        });
    });

    it('handles a single RatedShipment object (not array)', async () => {
        nock(BASE_URL)
            .post('/api/rating/v2403/Shop')
            .reply(200, {
                RateResponse: {
                    Response: { ResponseStatus: { Code: '1', Description: 'Success' } },
                    RatedShipment: {
                        Service: { Code: '01' },
                        TotalCharges: { CurrencyCode: 'USD', MonetaryValue: '55.00' },
                    },
                },
            });

        const carrier = makeCarrier();
        const quotes = await carrier.getRates(validRequest);
        expect(quotes).toHaveLength(1);
        expect(quotes[0].serviceLevel).toBe('OVERNIGHT');
    });
});
