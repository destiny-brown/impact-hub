# Impact Hub

Impact Hub is a full-stack event management platform for coordinating volunteer participation in community events.
It enables event creation, volunteer onboarding, request lifecycle management, admin moderation, and event-driven activity processing via Kafka.

## Features

- **Role-Based Access:** Separate admin and volunteer authentication flows
- **Event Management:** Admins create and manage community events
- **Volunteer Profiles:** Volunteers register and manage profile-linked accounts
- **Request System:**
  - Volunteers can apply to events
  - Duplicate applications are blocked
  - Capacity checks are enforced when applying and approving
  - Request lifecycle: `PENDING -> APPROVED / REJECTED / WITHDRAWN`
- **Admin Dashboard:** Review and approve/reject volunteer requests
- **Public Live Activity Feed:** Sanitized request updates shown on homepage
- **Event Driven Processing:** Kafka integration publishes request lifecycle events

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Validation:** Zod
- **Messaging:** Kafka (via `kafkajs`)
- **Styling:** Tailwind CSS v4 + global CSS

## Repository Structure

```text
impact-hub/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── me/route.ts
│   │   │   │   └── register/route.ts
│   │   │   ├── activity/route.ts
│   │   │   ├── events/route.ts
│   │   │   ├── volunteer/route.ts
│   │   │   └── requests/route.ts
│   │   ├── admin/login/page.tsx
│   │   ├── volunteer/login/page.tsx
│   │   ├── volunteer/register/page.tsx
│   │   ├── activity-feed.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── events/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── activity.ts
│       ├── auth.ts
│       ├── consumer.ts
│       ├── kafka.ts
│       └── prisma.ts
├── package.json
└── prisma.config.ts
```

## Data Model Summary

Prisma models are defined in `prisma/schema.prisma`.

- **Event**
  - Core event details (`title`, `slug`, `description`, `location`, `date`, optional `capacity`)
- **Volunteer**
  - Volunteer profile (`fullName`, `email`, optional phone/location/bio)
  - Optional one-to-one link to `User`
- **User**
  - Auth account (`email`, `passwordHash`, `fullName`, `role`)
  - Roles: `ADMIN`, `VOLUNTEER`
- **VolunteerRequest**
  - Join table between volunteer and event, tracking status and approval metadata
  - Status enum: `PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`
  - Unique pair constraint on `(volunteerId, eventId)` to prevent duplicate applications

## Current Profile Structure

- **Volunteer account**
  - Login identity from `User` (role = `VOLUNTEER`)
  - Linked profile data in `Volunteer`
  - Can browse events and submit one request per event
- **Admin account**
  - Login identity from `User` (role = `ADMIN`)
  - Can create events and moderate requests

## Testing Accounts

Use these accounts for quick testing in development/demo environments.

### Volunteer

- **Name:** Alice Tan
- **Email:** alice@test.com
- **Password:** DemoVolunteer123!

### Admin

- **ADMIN_EMAIL:** admin@impacthub.local
- **ADMIN_PASSWORD:** ChangeMe123!
- **ADMIN_NAME:** Charity Admin

Admin fallback note:
- If no admin exists, the app can auto-create one from the `ADMIN_*` environment variables when admin login is attempted.

## Environment Variables

Create a `.env` file in the repository root with:

```bash
DATABASE_URL="<postgres-connection-string>"
AUTH_SECRET="<long-random-secret>"
KAFKA_BROKER="HOST:PORT"
KAFKA_USERNAME="your-username"
KAFKA_PASSWORD="your-password"
ADMIN_EMAIL="admin@impacthub.local"
ADMIN_PASSWORD="ChangeMe123!"
ADMIN_NAME="Charity Admin"
```

Notes:

- `DATABASE_URL` is required by Prisma and the API routes.
- `AUTH_SECRET` is used to sign session cookies.
- Kafka credentials are required for request event publishing in `src/lib/kafka.ts`.
- `ADMIN_*` values are used for initial/default admin provisioning.

## Getting Started

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Configure environment variables in `.env`.

3. Generate Prisma client:

   ```bash
   npx prisma generate
   ```

4. Push Prisma schema updates to database:

   ```bash
   npx prisma db push
   ```

5. (Supabase) Enable RLS hardening:

   Run `prisma/rls.sql` in Supabase SQL Editor.

6. Run the development server:

   ```bash
   npm run dev
   ```

7. Open `http://localhost:3000`.

## Available Scripts

From the repository root:

- `npm run dev` – Start local development server
- `npm run lint` – Run ESLint
- `npm run build` – Generate Prisma client and create production build
- `npm run start` – Start production server
- `npm run kafka:consumer` – Run local Kafka consumer for analytics/event logs

## API Endpoints

### Authentication

- `POST /api/auth/login`
  - Login for admin or volunteer
- `POST /api/auth/register`
  - Register volunteer account + linked volunteer profile
- `POST /api/auth/logout`
  - Clear session cookie
- `GET /api/auth/me`
  - Return current session user

### Events

- `GET /api/events`
  - Returns all events
- `POST /api/events`
  - Creates an event (admin only)
  - Validated with Zod

### Volunteers

- `GET /api/volunteer`
  - Returns all volunteers (admin only)
- `POST /api/volunteer`
  - Creates a volunteer profile (admin only)

### Volunteer Requests

- `GET /api/requests`
  - Returns requests scoped by role
  - Volunteers only see their own requests
- `POST /api/requests`
  - Creates a volunteer request (volunteer only)
  - Blocks duplicates per volunteer/event
  - Enforces event capacity
  - Validated with Zod
- `PATCH /api/requests`
  - Updates request status (admin only)
  - Enforces capacity at approval time
  - Validated with Zod

### Public Activity

- `GET /api/activity`
  - Returns sanitized request lifecycle activity for public live feed

## UI Routes

- `/` – Public landing page + live activity feed
- `/volunteer/register` – Volunteer registration
- `/volunteer/login` – Volunteer login
- `/events` – Volunteer event list + apply action
- `/admin/login` – Admin login
- `/dashboard` – Admin event/request management

## Kafka Integration

Request lifecycle events are produced to Kafka topic `requests` and consumed for analytics/logging:

- `REQUEST_CREATED` after a new request is created
- `REQUEST_UPDATED` after a request status update

## Build, Deploy, and Security Notes

- Build requires a valid `DATABASE_URL`; otherwise API route pre-render checks fail.
- Prisma `db push` updates schema but does not configure Supabase RLS.
- Run `prisma/rls.sql` for Supabase/PostgREST table hardening.

## CI/CD

This project uses GitHub + Vercel CI/CD:
- Automatically builds on every push
- Automatically deploys to production
- Enables continuous integration and rapid iteration

## AI Usage Note

This project was developed with AI-assisted coding support using VS Code Copilot.

## Future Improvements

- Add durable event storage for activity feed instead of in-memory cache
- Add automated tests for API and critical auth/request flows
- Add admin tools to reset demo accounts and seed test data
