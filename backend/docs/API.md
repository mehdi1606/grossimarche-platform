# Grossimarché API

Base path `/api/v1` · Auth `Authorization: Bearer <access_token>` · Roles `CLIENT`,
`STORE_MANAGER`, `ADMIN`. Every error uses the uniform `ApiError` shape with an
`ErrorCode` and a `traceId`. The full machine-readable contract is `openapi.json`
(generated from the running app — see below); this file is the human summary.

## Auth (public)
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/otp/request` | Send a 6-digit code (`SMS` \| `EMAIL`) |
| POST | `/auth/otp/verify` | Verify → tokens; create account on first login |
| POST | `/auth/refresh` | Rotate refresh token → new pair |
| POST | `/auth/logout` | Revoke refresh token + denylist access token |

## Profile & addresses (user)
`GET/PATCH /me` · `DELETE /me` (erasure) · `GET /me/export` · `POST /me/contact/{request,verify}` ·
`GET/POST /me/addresses` · `PATCH/DELETE /me/addresses/{id}`

## Catalogue (public read)
`GET /categories` · `GET /products` (filters `categoryId,q,minPrice,maxPrice,inStock,sort,page,size`) ·
`GET /products/{idOrSlug}` (includes `attributes`, `averageRating`, `reviewCount`) ·
`GET /products/{id}/reviews` · `POST /products/{id}/reviews` (auth; moderated before it shows)

## Cart & orders (user)
`GET /cart` · `PUT /cart/items/{productId}` · `DELETE /cart` · `POST /cart/merge` ·
`POST /orders` (header `Idempotency-Key`) · `GET /orders` · `GET /orders/{id}` · `GET /orders/{id}/invoice`

## Coupons
`POST /coupons/validate` — check a code against the caller's current cart (200 with
`valid:true|false`, no order created). Pass `couponCode` in `POST /orders` to apply it;
the discount is re-validated and snapshotted server-side, and freed if the order is cancelled.

## Loyalty & stores
`GET /loyalty` · `GET /loyalty/transactions` · `GET /stores?lat=&lng=`

## Payments (gateway)
`POST /payments/cmi/callback` — signed webhook, idempotent, stores zero card data.

## Admin (`/admin/**`, ADMIN or STORE_MANAGER)
Categories, products (CRUD, `/stock`, `/tiers`, `/attributes`, `/image`, `/import`), stores,
orders (`/status`, `/cancel`), loyalty `/{userId}/adjust`, coupons (CRUD),
reviews (list, `/{id}/approve`, delete). Also `dashboard` (`/summary`, `/sales`,
`/best-sellers`, `/recent-orders`), `customers` (list/search, `/{id}`, `/{id}/status`),
and `staff` (CRUD; ADMIN only — accounts sign in by OTP, no passwords).

## WebSocket
`/ws` (STOMP, SockJS). Topics: `/topic/orders/{orderId}` (own order), `/topic/admin/orders`
(staff). CONNECT authenticates with the bearer JWT; SUBSCRIBE is authorized per topic.

## Exporting `openapi.json`
```bash
docker compose up -d
SERVER_PORT=8081 ./mvnw spring-boot:run &   # local profile
curl -s http://localhost:8081/v3/api-docs > ../openapi.json
```
