import 'dotenv/config';
import { createApp } from './api/server';
import { registry } from './core/registry/carrier.registry';
import { UpsAuth } from './carriers/ups/ups.auth';
import { UpsClient } from './carriers/ups/ups.client';
import { UpsMapper } from './carriers/ups/ups.mapper';
import { UpsValidator } from './carriers/ups/ups.validator';
import { UpsCarrier } from './carriers/ups/ups.carrier';
import { FedExCarrier } from './carriers/fedex/fedex.carrier';

const upsAuth = new UpsAuth(
    process.env.UPS_CLIENT_ID ?? '',
    process.env.UPS_CLIENT_SECRET ?? '',
    process.env.UPS_BASE_URL ?? 'https://wwwcie.ups.com',
);

// initializing registry with carriers
registry.register(new UpsCarrier(new UpsClient(upsAuth, process.env.UPS_BASE_URL ?? 'https://wwwcie.ups.com'), new UpsMapper(), new UpsValidator()));
registry.register(new FedExCarrier());

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
    console.log(`Cybership carrier integration running on port ${PORT}`);
});
