# Auth API (Basic Auth)

Base URL: `/api/auth/`

Users are stored in Django's auth_user table (hashed passwords). After login/signup the client sends Basic auth on subsequent requests.

---

## 1. Signup

**Endpoint:** `POST /api/auth/signup/`

**Request:**
```json
{
  "username": "naveen",
  "password": "StrongPassword@123"
}
```

**Validation:** Username unique, min 2 chars; password min 8 chars + Django validators.

**Success `201 Created`:**
```json
{ "username": "naveen" }
```

**Error `400 Bad Request`:** Validation errors (e.g. username taken, weak password).

---

## 2. Login

**Endpoint:** `POST /api/auth/login/`

**Request:**
```json
{
  "username": "naveen",
  "password": "StrongPassword@123"
}
```

**Success `200 OK`:**
```json
{ "username": "naveen" }
```

**Failure `401 Unauthorized`:**
```json
{ "detail": "Invalid username or password" }
```

---

## 3. Using Basic auth on protected endpoints

After login/signup, send credentials as HTTP Basic:

```
Authorization: Basic <base64(username:password)>
```

Example:
```bash
curl -u naveen:StrongPassword@123 http://localhost:8000/api/datasets/
```
