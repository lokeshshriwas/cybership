# Cybership — Carrier Integration Service

A TypeScript + Express service that wraps shipping carrier APIs (starting with UPS) to fetch normalised shipping rates.

---

## Design Decisions

### Why a plugin-based architecture?

Every carrier (UPS, FedEx, DHL) lives in its own folder with its own auth, client, mapper, and validator. The rest of the app doesn't know or care which carrier it's talking to it just calls `carrier.getRates()`. This means adding FedEx tomorrow doesn't require touching a single line of UPS code.

### Why separate Mapper, Validator, Client, and Auth?

Each class does one job:

- **Validator** — checks if the request makes sense before we waste an API call
- **Mapper** — translates between our clean domain models and UPS's messy JSON format
- **Client** — makes the actual HTTP call and handles HTTP-level errors
- **Auth** — manages OAuth tokens transparently (cache, refresh, retry)

This makes each piece independently testable and replaceable.

### Why a CarrierRegistry?

Instead of if/else chains, carriers register themselves at startup. The route just does `registry.get("ups")` and gets back whatever implements `ICarrier`. Clean, extensible, zero conditionals.

### Why two layers of validation?

- **Middleware** (`validate.middleware.ts`) — quick HTTP-level check: "did you send origin, destination, and package?" Returns 400 immediately if not. This runs before any carrier code.
- **Carrier validator** (`ups.validator.ts`) — domain-level check: "is weight > 0 and < 150 lbs? Is the zip code valid?" Each carrier can have its own rules.

### Why structured errors?

Every error is a `CarrierError` with a `code`, `message`, `carrier`, and `retryable` flag. The caller always knows what went wrong and whether to retry. No generic messages.

---

## How to Run

### Prerequisites

- Node.js 18+ (using LTS on local machine)
- npm

### Setup

```bash
git clone https://github.com/lokeshshriwas/cybership.git
cd cybership
npm install
cp .env.example .env
```

### Start the server

```bash
npm run dev
```

Server runs on `http://localhost:3000`.

### Run tests

```bash
npm test # runs tests once
npm run test:coverage # runs tests with coverage report
```

### Health check

```bash
curl http://localhost:3000/health
```

Response:

```json
{ "status": "ok", "service": "cybership-carrier-integration" }
```

---

## Demo API Calls

### Correct request

```bash
curl -X POST http://localhost:3000/api/v1/rates \
  -H "Content-Type: application/json" \
  -d '{
    "carrier": "ups",
    "origin": {
      "zip": "40202",
      "country": "US",
      "city": "Louisville",
      "state": "KY"
    },
    "destination": {
      "zip": "10001",
      "country": "US",
      "city": "New York",
      "state": "NY"
    },
    "package": {
      "weightLbs": 5,
      "lengthIn": 10,
      "widthIn": 8,
      "heightIn": 6
    }
  }'
```

Expected response (with live UPS credentials):

```json
{
  "success": true,
  "carrier": "ups",
  "count": 3,
  "quotes": [
    {
      "carrier": "ups",
      "serviceLevel": "GROUND",
      "serviceName": "UPS Ground",
      "price": 12.45,
      "currency": "USD",
      "estimatedDays": 5,
      "guaranteedDelivery": false
    }
  ]
}
```

> **Note:** Without live UPS API credentials, the request will return a `NETWORK_TIMEOUT` or `AUTH_FAILURE` error. The tests use stubbed responses to prove the logic works end-to-end.

### Missing required fields

```bash
curl -X POST http://localhost:3000/api/v1/rates \
  -H "Content-Type: application/json" \
  -d '{
    "origin": { "zip": "40202", "country": "US" }
  }'
```

Response:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required fields: destination, package",
    "retryable": false
  }
}
```

### Invalid package weight

```bash
curl -X POST http://localhost:3000/api/v1/rates \
  -H "Content-Type: application/json" \
  -d '{
    "carrier": "ups",
    "origin": { "zip": "40202", "country": "US" },
    "destination": { "zip": "10001", "country": "US" },
    "package": { "weightLbs": 0, "lengthIn": 10, "widthIn": 8, "heightIn": 6 }
  }'
```

Response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid rate request: package.weightLbs must be positive",
    "carrier": "ups",
    "retryable": false
  }
}
```

### Carrier not found

```bash
curl -X POST http://localhost:3000/api/v1/rates \
  -H "Content-Type: application/json" \
  -d '{
    "carrier": "dhl",
    "origin": { "zip": "40202", "country": "US" },
    "destination": { "zip": "10001", "country": "US" },
    "package": { "weightLbs": 5, "lengthIn": 10, "widthIn": 8, "heightIn": 6 }
  }'
```

Response:

```json
{
  "success": false,
  "error": {
    "code": "CARRIER_ERROR",
    "message": "Carrier 'dhl' is not found",
    "carrier": "dhl",
    "retryable": false
  }
}
```

---

## What I'd Improve Given More Time

1. Smarter error recovery - Right now, if UPS throws a 429 (rate limit) or the network hiccups, the service just flags it as retryable and moves on. I'd add actual automatic retries with exponential backoff so the caller doesn't have to handle that themselves.
2. Proper logging - The service currently has no structured logging, which makes debugging a pain in production. I'd add correlation IDs so you can trace a single request all the way through the pipeline and quickly spot where something went wrong.
3. Shared token cache with Redis - OAuth tokens are cached in memory right now, which works fine for a single server. But if you run multiple instances, each one fetches its own token independently. Moving the cache to Redis means all instances share one token and you make far fewer unnecessary auth calls.
4. Stronger input validation with Zod - I did manual validation in the middleware, but swapping that out for Zod schemas would give you runtime validation and compile-time types from a single source of truth less code to maintain and harder to get out of sync.
5. Rate response caching - Shipping rates don't change minute to minute. Caching identical requests for even 5 minutes would cut down on redundant API calls and speed up response times noticeably.
6. Multi-package shipments - The current implementation handles one package per request. Real-world shipments often have several boxes, so this would be an important gap to close before going live.
7. CI/CD with GitHub Actions - A basic pipeline to run tests, lint, and type-check on every pull request. Catches things before they merge rather than after.
8. Auto-generated API docs - Hook up OpenAPI/Swagger to the route definitions so the docs stay in sync with the code automatically, rather than being something you have to remember to update.
9. Docker setup - A Dockerfile and docker-compose.yml would make local development consistent across machines and simplify deployment considerably.
