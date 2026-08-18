# SmartSociety API Contract

This document outlines the expected shape of the backend API endpoints.
The front end's service layer is structured to match these contracts so
swapping from mock data to the real API is a drop-in change.

## Base URL
`/api/v1`

## Auth

### POST /auth/login
Request: `{ username, password }`
Response: `{ token, user: { id, username, role, name, phone, flatId } }`

## Residents

### GET /residents
Returns array of residents with flat info.

### POST /residents
Body: `{ name, phone, email, flatId, tenant, username, password }`

### DELETE /residents/:id

### PATCH /residents/:id
Body: partial resident fields (profile update)

## Billing

### GET /bills?flatId=...
Returns bills for a flat (or all bills for admin).

### POST /bills
Body: `{ flatId, breakdown: { water, security, repairs, other } }`

### PATCH /bills/:id/pay
Marks bill as paid.

## Visitors

### GET /visitors?flatId=...
Returns visitor passes for a flat.

### POST /visitors
Body: `{ flatId, name, phone, vehicleNumber, purpose, validFrom, validTo }`

### GET /visitors/verify?code=...
Returns visitor pass matching the code, or 404.

## Gate Logs

### GET /gate-logs
Returns all gate log entries.

### POST /gate-logs
Body: `{ name, phone, vehicleNumber, flatId, type }`

### PATCH /gate-logs/:id/checkout
### PATCH /gate-logs/:id/overstay

## Complaints

### GET /complaints?residentId=...
### POST /complaints
Body: `{ residentId, flatId, category, description, photo }`
### PATCH /complaints/:id/assign
Body: `{ staffId }`
### PATCH /complaints/:id/status
Body: `{ status, note }`

## Amenities

### GET /amenities
### GET /bookings?residentId=...
### POST /bookings
Body: `{ amenityId, flatId, residentId, date, slot }`
### PATCH /bookings/:id/cancel

## Notices

### GET /notices
### POST /notices
### DELETE /notices/:id

## Polls

### GET /polls
### POST /polls/:id/vote
Body: `{ optionId, userId }`
