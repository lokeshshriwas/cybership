import axios from 'axios';
import { UpsTokenResponse } from './ups.types';
import { ErrorCode, CarrierError } from '../../core/models/error.model';
import { UPS_CARRIER_ID, UPS_TOKEN_PATH } from './ups.constants';

interface CachedToken {
    accessToken: string;
    expiresAt: number; // Unix ms
}

// Handles UPS OAuth 2.0 Client Credentials flow.
// Tokens are cached in memory and refreshed 60 s before expiry.
export class UpsAuth {
    private cache: CachedToken | null = null;

    constructor(
        private readonly clientId: string,
        private readonly clientSecret: string,
        private readonly baseUrl: string,
    ) { }

    async getAccessToken(): Promise<string> {
        if (this.cache && Date.now() < this.cache.expiresAt) {
            return this.cache.accessToken;
        }
        return this.fetchNewToken();
    }

    private async fetchNewToken(): Promise<string> {
        try {
            const credentials = Buffer.from(
                `${this.clientId}:${this.clientSecret}`,
            ).toString('base64');

            const response = await axios.post<UpsTokenResponse>(
                `${this.baseUrl}${UPS_TOKEN_PATH}`,
                'grant_type=client_credentials',
                {
                    headers: {
                        Authorization: `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-merchant-id': this.clientId,
                    },
                },
            );

            const { access_token, expires_in } = response.data;
            const ttlMs = (parseInt(expires_in, 10) - 60) * 1000; // 60 s buffer

            this.cache = {
                accessToken: access_token,
                expiresAt: Date.now() + ttlMs,
            };

            return access_token;
        } catch (err) {
            throw new CarrierError(
                ErrorCode.AUTH_FAILURE,
                'UPS authentication failed',
                UPS_CARRIER_ID,
                false,
                err,
            );
        }
    }

    /** Clears the token cache (useful in tests) */
    clearCache(): void {
        this.cache = null;
    }
}
