# Auth System Specification

OTP-via-email authentication for a React SPA + Node.js API. No passwords, no OAuth.
Stateless JWT access tokens, rotating opaque refresh tokens, server-side session tracking.

---

## Table of Contents

1. [Data Models](#data-models)
2. [Token Design](#token-design)
3. [API Endpoints](#api-endpoints)
   - [Register](#register)
   - [Login](#login)
   - [Token Refresh](#token-refresh)
   - [Logout](#logout)
   - [Session Management](#session-management)
   - [Email Change](#email-change)
4. [OTP Security](#otp-security)
5. [Magic Link Pattern](#magic-link-pattern)
6. [Rate Limiting](#rate-limiting)
7. [Open Questions](#open-questions)

---

## Data Models

### User

| Field           | Type      | Notes                          |
|-----------------|-----------|--------------------------------|
| `id`            | uuid      | Primary key                    |
| `email`         | string    | Unique, lowercased             |
| `name`          | string    | Display name                   |
| `emailVerified` | bool      | Set `true` on first OTP confirm |
| `createdAt`     | timestamp |                                |
| `updatedAt`     | timestamp |                                |

### Session

One row per active session (device/login).

| Field              | Type      | Notes                                  |
|--------------------|-----------|----------------------------------------|
| `id`               | uuid      | Primary key                            |
| `userId`           | uuid      | FK → users                             |
| `refreshTokenHash` | string    | SHA-256 of the raw refresh token       |
| `expiresAt`        | timestamp | Absolute expiry (30 days from creation) |
| `createdAt`        | timestamp |                                        |
| `userAgent`        | string    | Optional, for session list display     |
| `ipAddress`        | string    | Optional                               |

### Verification

Shared table for all pending OTPs.

| Field        | Type      | Notes                                           |
|--------------|-----------|-------------------------------------------------|
| `id`         | uuid      |                                                 |
| `identifier` | string    | Scoped key, e.g. `login-otp-user@example.com`  |
| `value`      | string    | `{hashedOtp}:{attemptCount}` or `{hashedOtp}:{attemptCount}:{extraData}` |
| `expiresAt`  | timestamp |                                                 |

**Identifier naming convention:**

| Operation                | Identifier                          |
|--------------------------|-------------------------------------|
| Register OTP             | `register-otp-{email}`              |
| Login OTP                | `login-otp-{email}`                 |
| Email change confirm     | `email-change-confirm-{userId}`     |
| Email change verify      | `email-change-verify-{userId}`      |

---

## Token Design

### Access Token (JWT)

- **Algorithm:** HS256
- **TTL:** 15 minutes
- **Claims:** `sub` (userId), `email`, `name`, `iat`, `exp`
- **Stateless** — server verifies signature only, no DB lookup per request
- Cannot be revoked mid-lifetime; short TTL limits the risk window

### Refresh Token

- **Format:** cryptographically random opaque string (32 bytes, base64url encoded)
- **Storage:** hashed (SHA-256) in the `sessions` table — raw token never persisted
- **TTL:** 30 days absolute (not sliding)
- **Single-use (rotation):** every `/auth/refresh` invalidates the old token and issues a new one
- **Revocation:** deleting the session row immediately blocks further refreshes

---

## API Endpoints

All authenticated endpoints require `Authorization: Bearer {accessToken}`.

### Register

#### Step 1 — Request

```
POST /auth/register
Body: { email, name }
```

- Validate email format and name non-empty
- If email already registered → `409 Conflict`
- Generate OTP, store under `register-otp-{email}`, expires in 5 minutes
- Send email with OTP code + magic link (see [Magic Link Pattern](#magic-link-pattern))
- Response: `202 Accepted` (no body)

#### Step 2 — Confirm

```
POST /auth/register/confirm
Body: { email, otp }
```

- Perform atomic OTP check (see [OTP Security](#otp-security))
- Create user with `emailVerified: true`
- Create session row, generate refresh token, issue tokens
- Response `200 OK`:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

---

### Login

#### Step 1 — Request

```
POST /auth/login
Body: { email }
```

- If email not found → `404 Not Found`
- Generate OTP, store under `login-otp-{email}`, expires in 5 minutes
- Send email with OTP code + magic link
- Response: `202 Accepted` (no body)

#### Step 2 — Confirm

```
POST /auth/login/confirm
Body: { email, otp }
```

- Perform atomic OTP check
- Create session row, issue tokens
- Response `200 OK`:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

---

### Token Refresh

```
POST /auth/refresh
Body: { refreshToken }
```

- Hash the incoming token, look up session by hash
- If not found → `401 Unauthorized`
- If `expiresAt` < now → delete row, return `401 Unauthorized`
- Delete the old session row
- Create a new session row with a fresh refresh token
- Issue a new access token
- Response `200 OK`:

```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

> **Reuse detection:** if the same refresh token is submitted twice (e.g. a lost response),
> the second call finds no row and returns `401`. The client must re-authenticate via OTP.
> Log this event as a potential token theft signal.

---

### Logout

#### Single session

```
POST /auth/logout
Authorization: Bearer {accessToken}
Body: { refreshToken }
```

- Verify JWT signature (do **not** reject on expiry — still allow logout of expired tokens)
- Hash the refresh token, delete the matching session row
- Response: `204 No Content`

#### All sessions

```
DELETE /auth/sessions
Authorization: Bearer {accessToken}
```

- Delete all session rows for the authenticated user
- Response: `204 No Content`

---

### Session Management

#### List sessions

```
GET /auth/sessions
Authorization: Bearer {accessToken}
```

Response `200 OK`:

```json
[
  {
    "id": "...",
    "createdAt": "...",
    "expiresAt": "...",
    "userAgent": "...",
    "ipAddress": "...",
    "isCurrent": true
  }
]
```

`isCurrent` is `true` for the session whose refresh token was last used by this client.

#### Revoke a specific session

```
DELETE /auth/sessions/:id
Authorization: Bearer {accessToken}
```

- Must belong to the authenticated user
- Response: `204 No Content`

---

### Email Change

Requires an active (non-expired) access token for step 1.
Steps 2 and 3 can be unauthenticated (user may be in a different browser after clicking the link).

#### Step 1 — Request *(authenticated)*

```
POST /auth/email-change/request
Authorization: Bearer {accessToken}
Body: { newEmail }
```

- Validate new email format
- If `newEmail` == current email → `400 Bad Request`
- If `newEmail` already registered → `409 Conflict`
- Generate OTP, store under `email-change-confirm-{userId}` with `newEmail` in the value:
  `{hashedOtp}:{attempts}:{newEmail}`
- Send OTP to **current (old) email** with magic link targeting `/email-change/confirm`
- Response: `202 Accepted` (no body)

#### Step 2 — Confirm old email

```
POST /auth/email-change/confirm
Body: { userId, otp }
```

- Look up `email-change-confirm-{userId}`, perform atomic OTP check
- Extract `newEmail` from the stored value
- Generate a new OTP, store under `email-change-verify-{userId}` with `newEmail` in the value
- Send OTP to **new email** with magic link targeting `/email-change/verify`
- Response: `202 Accepted` (no body)
- Email is **not** updated yet

#### Step 3 — Verify new email

```
POST /auth/email-change/verify
Body: { userId, otp }
```

- Look up `email-change-verify-{userId}`, perform atomic OTP check, extract `newEmail`
- Update `users.email = newEmail`, `users.updatedAt = now()`
- Delete **all** session rows for this user (email changed — force re-authentication)
- Response `200 OK`:

```json
{ "message": "Email updated. Please log in again." }
```

The client must clear all stored tokens and redirect to login.

---

## OTP Security

| Property      | Value                                      |
|---------------|--------------------------------------------|
| Length        | 6 digits                                   |
| TTL           | 5 minutes                                  |
| Max attempts  | 3 (OTP permanently deleted after 3 fails)  |
| Storage       | SHA-256 hashed                             |
| Comparison    | Constant-time                              |

### Atomic Verification Pattern

Prevents race conditions and attempt-count bypass:

1. Load the verification row by identifier
2. If not found → return `OTP_NOT_FOUND`
3. If `expiresAt` < now → delete row, return `OTP_EXPIRED`
4. If attempt count ≥ 3 → delete row, return `OTP_MAX_ATTEMPTS`
5. **Delete the row immediately** (before verifying)
6. Hash the provided OTP and compare (constant-time)
7. If wrong → re-insert with `attemptCount + 1` and the **original** `expiresAt`; return `OTP_INVALID`
8. If correct → proceed with the action

---

## Magic Link Pattern

Every OTP email contains both a plain code and a magic link for one-click confirmation.

**Link format:**

```
{appUrl}/{route}#{otp}&{other-params}
```

Example (login):
```
https://app.example.com/login/confirm#otp=123456&email=user@example.com
```

The OTP is placed in the **URL fragment** (after `#`), not the query string.
Fragments are never sent to servers — they do not appear in backend access logs,
proxy logs, or `Referer` headers.

**Frontend behavior on the magic link route:**

1. Read `window.location.hash` and parse params
2. Pre-fill the OTP input field
3. Auto-submit the confirm/verify API call
4. Clear the hash from the URL with `history.replaceState`

---

## Rate Limiting

Two axes apply independently: per email/userId and per IP.

| Endpoint                         | Per-email/userId | Per-IP    |
|----------------------------------|------------------|-----------|
| `POST /auth/register`            | 3 / 60 s         | 10 / 60 s |
| `POST /auth/register/confirm`    | *(OTP lockout)*  | 10 / 60 s |
| `POST /auth/login`               | 3 / 60 s         | 10 / 60 s |
| `POST /auth/login/confirm`       | *(OTP lockout)*  | 10 / 60 s |
| `POST /auth/refresh`             | —                | 20 / 60 s |
| `POST /auth/logout`              | —                | 20 / 60 s |
| `GET /auth/sessions`             | —                | 20 / 60 s |
| `DELETE /auth/sessions/:id`      | —                | 10 / 60 s |
| `DELETE /auth/sessions`          | —                | 5 / 60 s  |
| `POST /auth/email-change/request`| 3 / 60 s         | 10 / 60 s |
| `POST /auth/email-change/confirm`| *(OTP lockout)*  | 10 / 60 s |
| `POST /auth/email-change/verify` | *(OTP lockout)*  | 10 / 60 s |

*OTP lockout* = the 3-attempt maximum in the atomic verification pattern.
The per-IP limit adds defense-in-depth against distributed brute force across many identifiers.

---

## Open Questions

- **Email enumeration on login:** returning `404` when an email is not found lets anyone
  probe your user list. A generic "if this email is registered, you'll receive a code"
  response is the standard mitigation — revisit if the app becomes public-facing.

- **Refresh token sliding vs. absolute expiry:** currently 30-day absolute. Sliding expiry
  (extend `expiresAt` on each successful refresh) would keep active users logged in
  indefinitely but requires an additional DB write per refresh.

- **Access token revocation:** currently impossible mid-lifetime. If instant revocation is
  ever needed (e.g. banning a user), options include a short-TTL blocklist (Redis) or
  switching to opaque access tokens with a DB lookup per request.

- **Email change cancellation:** no cancel endpoint. Pending OTPs will expire naturally
  after 5 minutes. An explicit `DELETE /auth/email-change` endpoint is a straightforward
  addition if needed.

- **Register with existing email UX:** currently returns `409 Conflict`, which leaks
  whether an email is registered. Intentional for simplicity; the tradeoff is documented
  here for future reference.
