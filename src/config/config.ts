import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    ups: {
        clientId: process.env.UPS_CLIENT_ID || '',
        clientSecret: process.env.UPS_CLIENT_SECRET || '',
        accountNumber: process.env.UPS_ACCOUNT_NUMBER || '',
        baseUrl: process.env.UPS_BASE_URL || 'https://wwwcie.ups.com',
    },

    fedex: {
        clientId: process.env.FEDEX_CLIENT_ID || '',
        clientSecret: process.env.FEDEX_CLIENT_SECRET || '',
        accountNumber: process.env.FEDEX_ACCOUNT_NUMBER || '',
        baseUrl: process.env.FEDEX_BASE_URL || 'https://apis-sandbox.fedex.com',
    },
} as const;
