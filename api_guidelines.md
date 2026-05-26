# API Design Guidelines - Malaf Egypt

### 1. Naming Conventions
- **Endpoints:** Use nouns, plural form, and kebab-case.
  - ✅ `/api/v1/legal-cases`
  - ❌ `/api/v1/getLegalCase`
- **Fields:** Use camelCase for JSON fields.
  - ✅ `{ "clientName": "..." }`
  - ❌ `{ "client_name": "..." }`

### 2. HTTP Methods Usage
- `GET`: Retrieve data (Idempotent).
- `POST`: Create new resources or perform complex actions (Non-idempotent).
- `PUT`: Replace a resource entirely (Idempotent).
- `PATCH`: Update specific fields of a resource (Idempotent).
- `DELETE`: Remove a resource (Idempotent).

### 3. Pagination (Standard)
All list endpoints must support cursor-based pagination:
- `limit`: Number of items (max 100).
- `cursor`: The ID or timestamp of the last item in the previous page.
- **Response:**
  ```json
  {
    "data": [],
    "pagination": {
      "nextCursor": "...",
      "hasMore": true
    }
  }
  ```

### 4. Idempotency
For payments and invoices, include an `Idempotency-Key` in the header:
- Valid for 24 hours.
- Returns the same response if the same key is used with the same payload.

### 5. Documentation Flow
1. Update `openapi.yaml` with the proposed changes.
2. Review with the lead engineer.
3. Implement the logic and validation (Zod).
4. Verify with Postman scripts.
