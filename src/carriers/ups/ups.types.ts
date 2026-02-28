//  UPS OAuth token response
export interface UpsTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: string; // seconds as string
    issued_at: string;
    client_id: string;
    scope: string;
}

//  UPS Rate Request types
export interface UpsAddress {
    AddressLine?: string[];
    City: string;
    StateProvinceCode: string;
    PostalCode: string;
    CountryCode: string;
}

export interface UpsShipper {
    Name: string;
    ShipperNumber: string;
    Address: UpsAddress;
}

export interface UpsShipTo {
    Name: string;
    Address: UpsAddress;
}

export interface UpsShipFrom {
    Name: string;
    Address: UpsAddress;
}

export interface UpsPackagingType {
    Code: string;
}

export interface UpsDimensions {
    UnitOfMeasurement: { Code: string };
    Length: string;
    Width: string;
    Height: string;
}

export interface UpsPackageWeight {
    UnitOfMeasurement: { Code: string };
    Weight: string;
}

export interface UpsPackage {
    PackagingType: UpsPackagingType;
    Dimensions: UpsDimensions;
    PackageWeight: UpsPackageWeight;
}

export interface UpsShipment {
    Shipper: UpsShipper;
    ShipTo: UpsShipTo;
    ShipFrom: UpsShipFrom;
    Package: UpsPackage[];
    ShipmentRatingOptions?: { NegotiatedRatesIndicator: string };
}

export interface UpsRateRequest {
    RateRequest: {
        Request: {
            RequestOption: string;
            TransactionReference: { CustomerContext: string };
        };
        Shipment: UpsShipment;
    };
}


//  UPS Rate Response types
export interface UpsMonetaryValue {
    CurrencyCode: string;
    MonetaryValue: string;
}

export interface UpsRatedShipment {
    Service: { Code: string };
    TotalCharges: UpsMonetaryValue;
    GuaranteedDelivery?: { BusinessDaysInTransit: string };
    TimeInTransit?: { ServiceSummary?: { EstimatedArrival?: { BusinessDaysInTransit?: string } } };
}

export interface UpsRateResponse {
    RateResponse: {
        Response: { ResponseStatus: { Code: string; Description: string } };
        RatedShipment: UpsRatedShipment | UpsRatedShipment[];
    };
}
