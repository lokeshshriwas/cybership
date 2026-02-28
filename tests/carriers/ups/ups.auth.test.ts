import nock from 'nock';
import { UpsAuth } from '../../../src/carriers/ups/ups.auth';
import { CarrierError, ErrorCode } from '../../../src/core/models/error.model';

const BASE_URL = 'https://wwwcie.ups.com';

describe('UpsAuth', () => {
    let auth: UpsAuth;

    beforeEach(() => {
        nock.cleanAll();
        auth = new UpsAuth('client-id', 'client-secret', BASE_URL);
        auth.clearCache();
    });

    afterAll(() => nock.restore());

    it('fetches and caches a token on first call', async () => {
        const scope = nock(BASE_URL)
            .post('/security/v1/oauth/token')
            .reply(200, {
                access_token: 'token-abc',
                token_type: 'Bearer',
                expires_in: '3600',
                issued_at: Date.now().toString(),
                client_id: 'client-id',
                scope: 'public',
            });

        const token = await auth.getAccessToken();
        expect(token).toBe('token-abc');
        expect(scope.isDone()).toBe(true);

        // Second call should use the cache
        const tokenAgain = await auth.getAccessToken();
        expect(tokenAgain).toBe('token-abc');
        expect(nock.pendingMocks()).toHaveLength(0);
    });

    it('re-fetches after clearCache()', async () => {
        nock(BASE_URL)
            .post('/security/v1/oauth/token')
            .times(2)
            .reply(200, {
                access_token: 'fresh-token',
                token_type: 'Bearer',
                expires_in: '3600',
                issued_at: Date.now().toString(),
                client_id: 'client-id',
                scope: 'public',
            });

        await auth.getAccessToken();
        auth.clearCache();
        const token = await auth.getAccessToken();
        expect(token).toBe('fresh-token');
    });

    it('throws CarrierError AUTH_FAILURE when UPS returns 401', async () => {
        nock(BASE_URL)
            .post('/security/v1/oauth/token')
            .reply(401, { fault: { faultstring: 'Invalid credentials' } });

        await expect(auth.getAccessToken()).rejects.toMatchObject({
            code: ErrorCode.AUTH_FAILURE,
            carrier: 'ups',
        });
    });

    it('throws CarrierError AUTH_FAILURE on network error', async () => {
        nock(BASE_URL)
            .post('/security/v1/oauth/token')
            .replyWithError('ECONNREFUSED');

        await expect(auth.getAccessToken()).rejects.toBeInstanceOf(CarrierError);
    });
});
