import axios, { AxiosInstance } from 'axios';
import { UpsAuth } from './ups.auth';
import { UpsRateRequest, UpsRateResponse } from './ups.types';
import { ErrorCode, CarrierError } from '../../core/models/error.model';
import { UPS_CARRIER_ID, UPS_RATES_PATH } from './ups.constants';

// Low level HTTP client for the UPS Rating API. Only responsible for serialisation & deserialisation and token injection.

export class UpsClient {
    private readonly http: AxiosInstance;

    constructor(
        private readonly auth: UpsAuth,
        baseUrl: string,
    ) {
        this.http = axios.create({ baseURL: baseUrl });
    }

    async fetchRates(payload: UpsRateRequest): Promise<UpsRateResponse> {
        const token = await this.auth.getAccessToken();

        try {
            const response = await this.http.post<UpsRateResponse>(
                UPS_RATES_PATH,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        transId: `cybership-${Date.now()}`,
                        transactionSrc: 'cybership',
                    },
                },
            );
            return response.data;
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const msg = err.response?.data
                    ? JSON.stringify(err.response.data)
                    : err.message;

                if (status === 401 || status === 403) {
                    throw new CarrierError(ErrorCode.AUTH_FAILURE, `UPS auth error: ${msg}`, UPS_CARRIER_ID, false, err);
                }
                if (status === 429) {
                    throw new CarrierError(ErrorCode.RATE_LIMIT, `UPS rate limit exceeded`, UPS_CARRIER_ID, true, err);
                }
                if (!err.response) {
                    throw new CarrierError(ErrorCode.NETWORK_TIMEOUT, `UPS network error: ${err.message}`, UPS_CARRIER_ID, true, err);
                }
                throw new CarrierError(ErrorCode.CARRIER_ERROR, `UPS API error (${status}): ${msg}`, UPS_CARRIER_ID, false, err);
            }
            throw new CarrierError(ErrorCode.NETWORK_TIMEOUT, 'UPS network error', UPS_CARRIER_ID, true, err);
        }
    }
}
