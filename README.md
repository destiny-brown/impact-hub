# Impact Hub

Impact Hub is a full-stack event management platform for coordinating volunteer participation in community events.
It enables event creation, volunteer onboarding, and request management, and incorporates an event-driven architecture using Kafka to process lifecycle events asynchronously.

## Features

- **Event Management:** Create and view community events
- **Volunteer Profiles:** Register and manage volunteer information via API
- **Request System:**
  - Volunteers can apply to events
  - Track request lifecycle (PENDING → APPROVED / REJECTED / WITHDRAWN)
- **Admin Dashboard:** Approve or reject volunteer requests
- **Event Driven Processing:** Kafka integration publishes request lifecycle events

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database:** PostgreSQL
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
│   │   │   ├── events/route.ts
│   │   │   ├── volunteer/route.ts
│   │   │   └── requests/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── events/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── kafka.ts
│       └── prisma.ts
├── package.json
└── prisma.config.ts
```

## Data Model

Prisma models are defined in `prisma/schema.prisma`.

- **Event**
  - Core event details (`title`, `slug`, `description`, `location`, `date`, optional `capacity`)
- **Volunteer**
  - Volunteer profile (`fullName`, `email`, optional phone/location/bio)
- **VolunteerRequest**
  - Join table between volunteer and event, tracking status and approval metadata
  - Status enum: `PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`

## Environment Variables

Create a `.env` file in the repository root with:

```bash
DATABASE_URL="<postgres-connection-string>"
KAFKA_BROKER="HOST:PORT"
KAFKA_USERNAME="your-username"
KAFKA_PASSWORD="your-password"
```

Notes:

- `DATABASE_URL` is required by Prisma and the API routes.
- Kafka credentials are required for request event publishing in `src/lib/kafka.ts`.

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

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## Available Scripts

From the repository root:

- `npm run dev` – Start local development server
- `npm run lint` – Run ESLint
- `npm run build` – Generate Prisma client and create production build
- `npm run start` – Start production server

## API Endpoints

### Events

- `GET /api/events`
  - Returns all events
- `POST /api/events`
  - Creates an event
  - Required body fields: `title`, `description`, `location`, `date`

### Volunteers

- `GET /api/volunteer`
  - Returns all volunteers
- `POST /api/volunteer`
  - Creates a volunteer profile
  - Required body fields: `fullName`, `email`, `phone`, `location`

### Volunteer Requests

- `GET /api/requests`
  - Returns volunteer requests
  - Optional query params: `eventId`, `volunteerId`
- `POST /api/requests`
  - Creates a volunteer request
  - Required body fields: `volunteerId`, `eventId`
- `PATCH /api/requests`
  - Updates request status
  - Required body fields: `id`, `status`
  - Allowed statuses: `PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`
  - Terminal request statuses (`APPROVED`, `REJECTED`, `WITHDRAWN`) are protected from further updates

## UI Routes

- `/` – Home page with navigation links
- `/events` – Event list + create event form + volunteer apply action
- `/dashboard` – Request management view with approve/reject controls

## Kafka Integration

Request lifecycle events are produced to Kafka topic `requests`:

- `REQUEST_CREATED` after a new request is created
- `REQUEST_UPDATED` after a request status update

## Build & Lint Notes

- Build requires a valid `DATABASE_URL`; otherwise API route pre-render checks fail.
- Lint currently reports existing issues in repository source files that are independent of this documentation update.

## CI/CD

This project uses GitHub + Vercel CI/CD:
- Automatically builds on every push
- Automatically deploys to production
- Enables continuous integration and rapid iteration

## Future Improvements

- Add authentication and role-based access control
- Replace hard-coded volunteer ID in UI with real user context
- Add API validation schemas and stronger typing
- Add tests for API and UI flows
