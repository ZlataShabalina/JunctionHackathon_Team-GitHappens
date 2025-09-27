# PowerPulse Backend — Frontend Integration Guide

This document is for the **frontend team**. It explains how to call the backend, what endpoints exist, and the exact data shapes you’ll receive.

**Scope:** No realtime streams. The app manages **Sites**, their **Assets**, and scheduled **Work Orders**. Optional **Notices** provide planned/active maintenance information. Basic **Feedback** and **Service Requests** can be submitted.

---

## Base URL

Local development (default):

```
http://localhost:8000
```

> CORS is enabled for dev. If you hit CORS errors from your frontend, add your dev origin to the backend `.env`:

```env
CORS_ORIGINS=["*"]
```

---

## Data Model (Types)

You can mirror these in your frontend types. Times are **ISO‑8601** strings with timezone (e.g., `2025-06-18T09:41:55.123Z`).

```ts
// Site
export interface Site {
  id: string;             // e.g., "site-001"
  name: string;
  lat: number;
  lon: number;
  address?: string | null;
  meta?: Record<string, unknown> | null;
}

// Asset
export interface Asset {
  id: string;             // your internal/external id (string)
  site_id?: string | null;
  name?: string | null;
  type?: string | null;   // e.g., "transformer", "switchgear", "generator"
  status: string;         // e.g., "operational", "maintenance_due", "fault"
  last_seen_at?: string | null;  // unused for realtime; may be null
  meta?: Record<string, unknown> | null;
}

// Work Order
export interface WorkOrder {
  id: number;
  site_id: string;
  asset_id?: string | null;
  title: string;
  description?: string | null;
  priority: "low" | "normal" | "high";
  scheduled_start?: string | null;   // ISO string
  scheduled_end?: string | null;     // ISO string
  status: "scheduled" | "assigned" | "in_progress" | "on_hold" | "completed" | "canceled";
  assigned_to?: string | null;       // person id/email/name
  created_at: string;
  updated_at: string;
}

// Notice (optional feature)
export interface Notice {
  id: number;
  site_id?: string | null;
  asset_id?: string | null;
  kind: "planned" | "active" | "done";
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
}
```

---

## Endpoints Overview

> **Auth:** None for dev. All endpoints accept/return JSON.  
> **Errors:** `400` bad reference, `404` not found, `422` validation (e.g., wrong types).

### Sites

| Method & Path | Description | Request Body | Response |
|---|---|---|---|
| `POST /sites` | Create a site | `{ id, name, lat, lon, address?, meta? }` | `Site` |
| `GET /sites` | List sites. Optional map filter by bbox | Query: `bbox=minLon,minLat,maxLon,maxLat` | `Site[]` |
| `GET /sites/{site_id}` | Get a site | – | `Site` |
| `PATCH /sites/{site_id}` | Update a site | `{ name?, lat?, lon?, address?, meta? }` | `Site` |
| `GET /sites/{site_id}/assets` | Assets at a site | – | `{ items: Asset[] }` |

#### Examples
```http
GET /sites
-> 200 OK
[
  {"id":"site-001","name":"Downtown Substation","lat":63.1,"lon":21.62,"address":"Main St 1","meta":null},
  {"id":"site-002","name":"Riverside Feeder","lat":63.105,"lon":21.64,"address":"River Rd 12","meta":null}
]
```

```http
GET /sites/site-001/assets
-> 200 OK
{
  "items": [
    {"id":"TF-A1","site_id":"site-001","name":"Transformer A1","type":"transformer","status":"operational","last_seen_at":null,"meta":{"kv":20}},
    {"id":"SG-1","site_id":"site-001","name":"Switchgear 1","type":"switchgear","status":"maintenance_due","last_seen_at":null,"meta":{}}
  ]
}
```

---

### Assets

| Method & Path | Description | Request Body | Response |
|---|---|---|---|
| `POST /assets` | Create an asset (optionally assign to site) | `{ id, site_id?, name?, type?, status?, meta? }` | `Asset` |
| `GET /assets` | List assets | Query: `site_id?`, `status?`, `type?` | `{ items: Asset[] }` |
| `GET /assets/{asset_id}` | Get one | – | `Asset` |
| `PATCH /assets/{asset_id}` | Update an asset (move sites, change status, etc.) | `{ site_id?, name?, type?, status?, meta? }` | `Asset` |

#### Examples
```http
GET /assets?site_id=site-002&status=fault
-> 200 OK
{ "items": [
  {"id":"TF-B1","site_id":"site-002","name":"Transformer B1","type":"transformer","status":"fault","last_seen_at":null,"meta":{"oil_temp":96}}
]}
```

```http
PATCH /assets/TF-B1
Content-Type: application/json

{ "status": "operational" }

-> 200 OK
{ "id":"TF-B1","site_id":"site-002","name":"Transformer B1","type":"transformer","status":"operational","last_seen_at":null,"meta":{"oil_temp":96} }
```

---

### Work Orders

| Method & Path | Description | Request Body | Response |
|---|---|---|---|
| `POST /workorders` | Create | `{ site_id, asset_id?, title, description?, priority?, scheduled_start?, scheduled_end?, assigned_to? }` | `WorkOrder` |
| `GET /workorders` | List | Query: `site_id?`, `status?`, `assigned_to?` | `{ items: WorkOrder[] }` |
| `GET /workorders/{id}` | Get one | – | `WorkOrder` |
| `PATCH /workorders/{id}` | Update | `{ title?, description?, priority?, scheduled_start?, scheduled_end?, status?, assigned_to? }` | `WorkOrder` |

**Typical status flow**: `scheduled → assigned → in_progress → completed` (or `on_hold`/`canceled`).

#### Examples
```http
POST /workorders
Content-Type: application/json

{
  "site_id": "site-002",
  "asset_id": "TF-B1",
  "title": "Emergency transformer repair",
  "description": "Investigate fault and repair",
  "priority": "high",
  "scheduled_start": "2025-06-18T09:00:00Z",
  "scheduled_end":   "2025-06-18T11:00:00Z",
  "assigned_to": "sara.maint@example.com"
}

-> 200 OK
{
  "id": 7,
  "site_id": "site-002",
  "asset_id": "TF-B1",
  "title": "Emergency transformer repair",
  "description": "Investigate fault and repair",
  "priority": "high",
  "scheduled_start": "2025-06-18T09:00:00Z",
  "scheduled_end":   "2025-06-18T11:00:00Z",
  "status": "scheduled",
  "assigned_to": "sara.maint@example.com",
  "created_at": "2025-06-18T08:51:10.123Z",
  "updated_at": "2025-06-18T08:51:10.123Z"
}
```

```http
PATCH /workorders/7
Content-Type: application/json

{ "status": "in_progress" }

-> 200 OK
{ ... "status":"in_progress", "updated_at":"2025-06-18T09:02:44.001Z" }
```

---

### Notices (Optional – for banners/popups)

| Method & Path | Description | Request Body | Response |
|---|---|---|---|
| `POST /notices` | Create notice | `{ site_id?, asset_id?, kind, title, description?, starts_at?, ends_at? }` | `Notice` |
| `GET /notices` | List | Query: `site_id?`, `asset_id?`, `kind?` | `{ items: Notice[] }` |

Use `GET /notices?site_id=...` to show planned/active work to end-users.

---

### Public (Feedback & Service Requests)

| Method & Path | Description | Request Body | Response |
|---|---|---|---|
| `POST /feedback` | Customer/tech feedback | `{ site_id?, asset_id?, message, contact?, rating? }` | `{ ok: true, id: number }` |
| `POST /service_requests` | Request info/repair | `{ site_id?, asset_id?, category, message, contact? }` | `{ ok: true, id: number }` |

---

## Frontend Flows

### Monitor (Control Room)
1. **Map of sites:** `GET /sites` (optionally `bbox` for visible viewport).
2. **Site detail:** `GET /sites/{id}` and `GET /sites/{id}/assets`.
3. **Filter assets:** `GET /assets?status=maintenance_due` or by `site_id`/`type`.
4. **Work queue per site:** `GET /workorders?site_id={id}`.
5. **Create work order:** `POST /workorders` (when user schedules).
6. **Update asset status:** `PATCH /assets/{id}` (e.g., set `maintenance_due` after inspection).

### Maintenance (Technician)
1. **My work list:** `GET /workorders?assigned_to={myEmail}`.
2. **Advance status:** `PATCH /workorders/{id}` → `in_progress` → `completed`.
3. **Reschedule or reassign:** `PATCH /workorders/{id}` with `scheduled_start/end` or `assigned_to`.
4. **Post-work update:** `PATCH /assets/{id}` (e.g., `operational`).
5. **Leave feedback:** `POST /feedback` (optional proof-of-work note).

---

## Pagination & Sorting

Not implemented (MVP). List endpoints currently return all matches. If you need paging/sorting for UI tables, propose shape like `?limit=&offset=&sort=created_at:desc` and we’ll add it.

---

## Status & Type Dictionaries

There’s no hard-coded dictionary on the backend; the frontend can use these **recommended** values for UX consistency:

- **Asset.status:** `operational`, `maintenance_due`, `maintenance`, `fault`, `standby`
- **Asset.type:** `transformer`, `switchgear`, `generator`, `mobile_sub`, `meter`, `other`
- **WorkOrder.status:** `scheduled`, `assigned`, `in_progress`, `on_hold`, `completed`, `canceled`
- **WorkOrder.priority:** `low`, `normal`, `high`
- **Notice.kind:** `planned`, `active`, `done`

---
