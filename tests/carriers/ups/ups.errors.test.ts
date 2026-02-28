import nock from 'nock';
import { UpsCarrier } from '../../../src/carriers/ups/ups.carrier';
import { UpsAuth } from '../../../src/carriers/ups/ups.auth';
import { UpsClient } from '../../../src/carriers/ups/ups.client';
import { UpsMapper } from '../../../src/carriers/ups/ups.mapper';
import { UpsValidator } from '../../../src/carriers/ups/ups.validator';
import { CarrierError, ErrorCode } from '../../../src/core/models/error.model';
import { RateRequest } from '../../../src/core/models/shipment.model';

const BASE_URL = 'https://wwwcie.ups.com';

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

function seedToken() {
    nock(BASE_URL)
        .post('/security/v1/oauth/token')
        .reply(200, {
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: '3600',
            issued_at: Date.now().toString(),
            client_id: 'test-id',
            scope: 'public',
        });
}

function makeCarrier(): UpsCarrier {
    const auth = new UpsAuth('test-id', 'test-secret', BASE_URL);
    const client = new UpsClient(auth, BASE_URL);
    return new UpsCarrier(client, new UpsMapper(), new UpsValidator());
}

beforeEach(() => nock.cleanAll());
afterAll(() => nock.restore());

describe('UPS Errors — validation', () => {
    it('throws VALIDATION_ERROR when weight is 0', async () => {
        const carrier = makeCarrier();
        const req: RateRequest = {
            ...validRequest,
            package: { weightLbs: 0, lengthIn: 10, widthIn: 8, heightIn: 6 },
        };

        await expect(carrier.getRates(req)).rejects.toMatchObject({
            code: ErrorCode.VALIDATION_ERROR,
            carrier: 'ups',
        });
    });

    it('throws VALIDATION_ERROR when weight exceeds 150 lbs', async () => {
        const carrier = makeCarrier();
        const req: RateRequest = {
            ...validRequest,
            package: { weightLbs: 200, lengthIn: 10, widthIn: 8, heightIn: 6 },
        };

        await expect(carrier.getRates(req)).rejects.toMatchObject({
            code: ErrorCode.VALIDATION_ERROR,
        });
    });

    it('throws VALIDATION_ERROR when origin.zip is missing', async () => {
        const carrier = makeCarrier();
        const req: RateRequest = {
            ...validRequest,
            origin: { zip: '', country: 'US' },
        };

        await expect(carrier.getRates(req)).rejects.toMatchObject({
            code: ErrorCode.VALIDATION_ERROR,
        });
    });
});

describe('UPS Errors — API failures', () => {
    it('throws CARRIER_ERROR when UPS Rating API returns 500', async () => {
        seedToken();
        nock(BASE_URL)
            .post('/api/rating/v2403/Shop')
            .reply(500, { fault: { faultstring: 'Internal Server Error' } });

        const carrier = makeCarrier();
        await expect(carrier.getRates(validRequest)).rejects.toMatchObject({
            code: ErrorCode.CARRIER_ERROR,
            carrier: 'ups',
        });
    });

    it('throws RATE_LIMIT with retryable:true on 429', async () => {
        seedToken();
        nock(BASE_URL)
            .post('/api/rating/v2403/Shop')
            .reply(429, { message: 'Too many requests' });

        const carrier = makeCarrier();
        await expect(carrier.getRates(validRequest)).rejects.toMatchObject({
            code: ErrorCode.RATE_LIMIT,
            retryable: true,
        });
    });

    it('throws NETWORK_TIMEOUT on connection failure', async () => {
        seedToken();
        nock(BASE_URL)
            .post('/api/rating/v2403/Shop')
            .replyWithError('ECONNREFUSED');

        const carrier = makeCarrier();
        await expect(carrier.getRates(validRequest)).rejects.toMatchObject({
            code: ErrorCode.NETWORK_TIMEOUT,
        });
    });

    it('throws MALFORMED_RESPONSE when response has no RatedShipment', async () => {
        seedToken();
        nock(BASE_URL)
            .post('/api/rating/v2403/Shop')
            .reply(200, {
                RateResponse: {
                    Response: { ResponseStatus: { Code: '1', Description: 'Success' } },
                },
            });

        const carrier = makeCarrier();
        await expect(carrier.getRates(validRequest)).rejects.toMatchObject({
            code: ErrorCode.MALFORMED_RESPONSE,
        });
    });

    it('wraps CarrierError with correct carrier field', async () => {
        const carrier = makeCarrier();
        const req: RateRequest = {
            ...validRequest,
            package: { weightLbs: 0, lengthIn: 10, widthIn: 8, heightIn: 6 },
        };

        try {
            await carrier.getRates(req);
        } catch (err) {
            expect(err).toBeInstanceOf(CarrierError);
            expect((err as CarrierError).carrier).toBe('ups');
        }
    });
});
