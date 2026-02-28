import { RateRequest } from '../../core/models/shipment.model';
import { RateQuote } from '../../core/models/rate.model';
import { UpsRateRequest, UpsRatedShipment, UpsRateResponse } from './ups.types';
import { config } from '../../config/config';
import {
    UPS_CARRIER_ID,
    UPS_PACKAGE_TYPE_CODE,
    UPS_SERVICE_NAMES,
    UPS_SERVICE_LEVEL_MAP,
    DEFAULT_CURRENCY,
} from './ups.constants';

export class UpsMapper {
    toRateRequest(request: RateRequest): UpsRateRequest {
        const pkg = request.package;
        return {
            RateRequest: {
                Request: {
                    RequestOption: 'Shop',
                    TransactionReference: { CustomerContext: 'cybership-rate-query' },
                },
                Shipment: {
                    Shipper: {
                        Name: 'Cybership Shipper',
                        ShipperNumber: config.ups.accountNumber,
                        Address: {
                            AddressLine: [],
                            City: request.origin.city ?? '',
                            StateProvinceCode: request.origin.state ?? '',
                            PostalCode: request.origin.zip,
                            CountryCode: request.origin.country,
                        },
                    },
                    ShipTo: {
                        Name: 'Cybership Recipient',
                        Address: {
                            AddressLine: [],
                            City: request.destination.city ?? '',
                            StateProvinceCode: request.destination.state ?? '',
                            PostalCode: request.destination.zip,
                            CountryCode: request.destination.country,
                        },
                    },
                    ShipFrom: {
                        Name: 'Cybership Shipper',
                        Address: {
                            AddressLine: [],
                            City: request.origin.city ?? '',
                            StateProvinceCode: request.origin.state ?? '',
                            PostalCode: request.origin.zip,
                            CountryCode: request.origin.country,
                        },
                    },
                    Package: [
                        {
                            PackagingType: { Code: UPS_PACKAGE_TYPE_CODE },
                            Dimensions: {
                                UnitOfMeasurement: { Code: 'IN' },
                                Length: pkg.lengthIn.toString(),
                                Width: pkg.widthIn.toString(),
                                Height: pkg.heightIn.toString(),
                            },
                            PackageWeight: {
                                UnitOfMeasurement: { Code: 'LBS' },
                                Weight: pkg.weightLbs.toString(),
                            },
                        },
                    ],
                    ShipmentRatingOptions: { NegotiatedRatesIndicator: '1' },
                },
            },
        };
    }

    fromRateResponse(response: UpsRateResponse): RateQuote[] {
        const raw = response.RateResponse.RatedShipment;
        const shipments: UpsRatedShipment[] = Array.isArray(raw) ? raw : [raw];

        return shipments.map((s) => {
            const serviceCode = s.Service.Code;
            const serviceName = UPS_SERVICE_NAMES[serviceCode] ?? `UPS Service ${serviceCode}`;
            const daysStr = s.GuaranteedDelivery?.BusinessDaysInTransit;
            const days = daysStr ? parseInt(daysStr, 10) : -1;
            const guaranteed = !!(s.GuaranteedDelivery?.BusinessDaysInTransit);

            return {
                carrier: UPS_CARRIER_ID,
                serviceLevel: UPS_SERVICE_LEVEL_MAP[serviceCode] ?? 'GROUND',
                serviceName,
                price: parseFloat(s.TotalCharges.MonetaryValue),
                currency: s.TotalCharges.CurrencyCode || DEFAULT_CURRENCY,
                estimatedDays: isNaN(days) ? -1 : days,
                guaranteedDelivery: guaranteed,
            };
        });
    }
}
