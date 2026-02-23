# Hinge Clone — Dating Web App

## Project Overview

Build a full-featured Hinge clone as a web application. The app should replicate Hinge's core UX philosophy: "Designed to be deleted" — meaningful connections over endless swiping. This is a production-quality MVP, not a toy project.

---

## Tech Stack

| Layer            | Technology                                                  |
| ---------------- | ----------------------------------------------------------- |
| **Monorepo**     | Turborepo                                                   |
| **Frontend**     | Next.js 14+ (App Router), TypeScript, Tailwind CSS          |
| **UI**           | shadcn/ui + Radix primitives, Framer Motion for animations  |
| **Backend**      | Node.js, Express or tRPC (type-safe API)                    |
| **Database**     | PostgreSQL with Prisma ORM + PostGIS for geolocation        |
| **Real-time**    | Socket.io for chat and notifications                        |
| **Auth**         | NextAuth.js (OAuth: Google, Apple + phone/email)            |
| **File Storage** | Local uploads (dev) / S3-compatible (prod)                  |
| **Cache**        | Redis (sessions, rate limiting, online status)              |
| **Queue**        | BullMQ (image processing, notifications, matching engine)   |
| **Testing**      | Vitest (unit), Playwright (E2E), Supertest (API)            |
| **Validation**   | Zod (shared schemas between frontend and backend)           |
| **Containerization** | Docker + Docker Compose for local dev                   |

---

## Project Structure

```
hinge-clone/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App Router pages
│   │   │   ├── (auth)/         # Login, signup, onboarding
│   │   │   ├── (main)/         # Authenticated app shell
│   │   │   │   ├── discover/   # Discovery feed
│   │   │   │   ├── likes/      # Likes received/sent
│   │   │   │   ├── matches/    # Match list + chat
│   │   │   │   └── profile/    # Profile view/edit
│   │   │   └── layout.tsx
│   │   ├── components/         # App-specific components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Client utilities
│   │   └── styles/
│   └── api/                    # Backend API server
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── services/       # Business logic
│       │   ├── middleware/      # Auth, rate-limit, validation
│       │   ├── jobs/           # Background job processors
│       │   ├── socket/         # WebSocket event handlers
│       │   └── utils/
│       ├── prisma/
│       │   ├── schema.prisma   # Database schema
│       │   ├── migrations/
│       │   └── seed.ts         # Seed data for development
│       └── tests/
├── packages/
│   ├── shared/                 # Shared types, Zod schemas, constants
│   ├── ui/                     # Shared UI component library
│   └── config/                 # Shared ESLint, TS, Tailwind configs
├── docker-compose.yml
├── turbo.json
├── package.json
└── CLAUDE.md
```

---

## Core Features (Priority Order)

### Phase 1 — Foundation
1. **Auth & Onboarding**
   - Phone number / email / Google OAuth signup
   - Multi-step onboarding: name, birthday, gender, photos (min 6), location, prompts
   - Profile completion enforcement (can't use app until profile is complete)

2. **Profile System**
   - 6 photo slots (reorderable via drag-and-drop)
   - 3 profile prompts selected from a prompt library (e.g., "A shower thought I recently had", "My simple pleasures", "I geek out on")
   - Basic info: job title, company, school, location, height, hometown
   - Identity badges: religion, politics, drinking, smoking, drugs, etc.
   - Voice prompts (audio recording + playback)

3. **Discovery Feed**
   - Card-based feed showing one profile at a time (NOT Tinder-style horizontal swiping)
   - Hinge-style vertical scroll through a profile's content
   - Like: tap the heart on a specific photo or prompt (with optional comment)
   - Skip: X button to pass
   - "Most Compatible" daily suggestion at the top
   - Infinite scroll with smart preloading

4. **Preferences & Filters**
   - Age range (slider)
   - Distance radius (slider, miles/km)
   - Height range
   - Ethnicity, religion, politics, drinking, smoking, family plans
   - Dealbreakers toggle (hard filter vs. preference)

### Phase 2 — Matching & Communication
5. **Likes System**
   - "Likes You" screen: see who liked you and what they liked
   - Like back = match, skip = remove
   - Roses: premium "super likes" (limited daily, highlighted in feed)
   - Standouts: curated top profiles shown separately

6. **Matching Engine**
   - Match occurs when both users like each other
   - Match notification (in-app + push)
   - "We Met" feature: after chatting, ask if they met in person and how it went
   - Compatibility scoring algorithm (shared interests, prompt similarity)

7. **Real-time Chat**
   - 1-on-1 messaging with matches
   - Text messages with emoji support
   - Photo/GIF sharing in chat
   - Read receipts and typing indicators
   - Message reactions (like a specific message)
   - Video call integration (WebRTC)
   - Chat can only start after matching (no cold messages)

### Phase 3 — Safety & Polish
8. **Safety & Moderation**
   - Report user (with categories: inappropriate photos, harassment, spam, etc.)
   - Block user (removes match, hides from discovery)
   - Photo moderation (flag NSFW content)
   - Rate limiting on likes/messages to prevent spam
   - Unmatch with confirmation dialog
   - "Your Turn" indicators in chat

9. **Notifications**
   - In-app notification center
   - Browser push notifications (with user permission)
   - Notification types: new like, new match, new message, daily picks
   - Notification preferences (granular on/off)

10. **Profile Enhancements**
    - Profile review before going live
    - "Pause" profile (hide from discovery without deleting)
    - Verification badge (selfie verification flow)
    - Profile insights (how many likes this week, etc.)

---

## Database Schema (Key Models)

```
User
  - id, email, phone, passwordHash
  - firstName, lastName, birthday, gender, genderPreference
  - bio, jobTitle, company, school, hometown
  - height, religion, politics, drinking, smoking, drugs, familyPlans
  - latitude, longitude (PostGIS GEOGRAPHY point)
  - isVerified, isActive, isPaused, profileComplete
  - createdAt, updatedAt, lastActiveAt

Photo
  - id, userId, url, position (1-6), isVerification
  - createdAt

Prompt
  - id, userId, promptTemplateId, answer, position (1-3)
  - voiceUrl (nullable, for voice prompts)

PromptTemplate
  - id, category, text (e.g., "Two truths and a lie")

Preference
  - id, userId
  - ageMin, ageMax, distanceMax
  - heightMin, heightMax
  - all identity filters + isDealbreaker per filter

Like
  - id, fromUserId, toUserId
  - targetType (PHOTO | PROMPT), targetId
  - comment (optional message with like)
  - isRose (boolean)
  - status (PENDING | MATCHED | SKIPPED | EXPIRED)
  - createdAt

Match
  - id, user1Id, user2Id
  - matchedAt
  - isActive
  - weMet (nullable: YES | NO | null)
  - weMetFeedback (text)

Message
  - id, matchId, senderId
  - content, type (TEXT | IMAGE | GIF | SYSTEM)
  - readAt, createdAt

Reaction
  - id, messageId, userId, emoji

Report
  - id, reporterId, reportedUserId
  - category, description
  - status (PENDING | REVIEWED | ACTIONED | DISMISSED)

Block
  - id, blockerId, blockedUserId, createdAt

Notification
  - id, userId, type, title, body
  - referenceType, referenceId
  - isRead, createdAt
```

---

## UI/UX Requirements

- **Mobile-first responsive design** (375px base, scales up)
- Hinge's signature purple/dark theme with soft gradients
- Smooth animations: card transitions, like animations, match celebration
- Bottom tab navigation: Discover | Likes | Matches | Profile
- Skeleton loading states for all content
- Empty states with illustrations
- Toast notifications for actions
- Pull-to-refresh on feed
- Haptic-style feedback on interactions (CSS animations)
- Accessibility: ARIA labels, keyboard navigation, screen reader support

---

## API Design

Use tRPC or REST with the following endpoint groups:

```
Auth:     POST /auth/signup, /auth/login, /auth/verify, /auth/refresh
Users:    GET/PATCH /users/me, GET /users/:id (public profile)
Photos:   POST/DELETE /users/me/photos, PATCH /users/me/photos/reorder
Prompts:  GET /prompts/templates, POST/PATCH/DELETE /users/me/prompts
Discover: GET /discover/feed, GET /discover/standouts, GET /discover/most-compatible
Likes:    POST /likes, GET /likes/received, PATCH /likes/:id/respond
Matches:  GET /matches, DELETE /matches/:id, POST /matches/:id/we-met
Messages: GET /matches/:id/messages, POST /matches/:id/messages
Chat WS:  /socket (join room, send message, typing, read receipt)
Reports:  POST /reports
Blocks:   POST /blocks, DELETE /blocks/:id
Notifs:   GET /notifications, PATCH /notifications/read
Settings: GET/PATCH /settings/preferences, /settings/notifications
```

---

## Non-Functional Requirements

- **Performance**: First Contentful Paint < 1.5s, API responses < 200ms
- **Security**: OWASP Top 10 compliance, input sanitization, SQL injection prevention
- **Privacy**: Never expose exact coordinates; round to ~1km. Encrypt PII at rest.
- **Rate Limiting**: 10 likes/hour, 50 messages/hour, 5 reports/day
- **Test Coverage**: Minimum 80% for business logic, E2E for all critical flows
- **Error Handling**: Graceful degradation, retry logic, user-friendly error messages
- **Logging**: Structured JSON logs, request tracing with correlation IDs

---

## Development Seed Data

Generate realistic seed data:
- 50+ fake user profiles with varied demographics
- Profile photos (use placeholder services like picsum.photos or UI Faces)
- Realistic prompt answers
- Pre-existing likes, matches, and message threads for testing
- Various user states (new, active, paused, incomplete profile)

---

## Multi-Agent Workflow

This project uses a 3-agent iterative workflow. Each cycle produces a more stable, secure, and polished application.

### Agent 1: IMPLEMENTER
**Role**: Build features according to the spec above.

Instructions:
- Work through features in phase order (Phase 1 → 2 → 3)
- Write clean, typed, well-structured code
- Follow the project structure exactly
- Create database migrations for every schema change
- Include inline JSDoc comments for complex business logic only
- After completing each feature, create a brief summary of what was built and any known limitations
- Run `npm run build` and `npm run lint` before handing off — code must compile cleanly
- Commit after each completed feature with a descriptive message

### Agent 2: REVIEWER & TESTER
**Role**: Review code quality and write/run tests.

Instructions:
- Review ALL code written by Agent 1 for:
  - Type safety (no `any`, proper generics, exhaustive switches)
  - Error handling (are edge cases covered?)
  - Performance (N+1 queries, unnecessary re-renders, missing indexes)
  - Code duplication (DRY violations)
  - API contract consistency (request/response shapes match frontend expectations)
  - Naming conventions and code organization
- Write tests:
  - Unit tests for all service-layer functions (matching algorithm, preference filtering, etc.)
  - Integration tests for all API endpoints (happy path + error cases)
  - E2E tests for critical user flows: signup → onboarding → discover → like → match → chat
- Run the full test suite and report results
- File specific issues as TODO comments in code with `// TODO(reviewer):` prefix
- If tests fail or critical issues found, send back to Agent 1 with specific fix instructions

### Agent 3: QA & SECURITY AUDITOR
**Role**: Abuse testing, security audit, and edge case validation.

Instructions:
- **Security Audit**:
  - Test for XSS in all user inputs (prompts, chat messages, profile fields)
  - Test for SQL injection via API parameters
  - Test for IDOR (can user A access user B's private data?)
  - Test for authentication bypass (expired tokens, missing auth headers)
  - Test for rate limit bypass
  - Verify file upload restrictions (type, size, malicious files)
  - Check for sensitive data exposure in API responses (password hashes, exact coordinates, etc.)
  - Verify CORS configuration
  - Check for missing CSRF protection

- **Abuse Scenarios**:
  - Can a user like themselves?
  - Can a user send messages to someone they haven't matched with?
  - Can a blocked user still see the blocker's profile?
  - Can a user create duplicate accounts?
  - What happens with extremely long input strings?
  - What happens with Unicode edge cases (RTL text, zero-width chars, emoji)?
  - Can a user bypass the 6-photo minimum?
  - Can a user manipulate their location to appear anywhere?
  - What happens if a user deletes their account mid-conversation?

- **Edge Cases**:
  - Empty discovery feed (no more users to show)
  - User at the edge of distance radius
  - Simultaneous likes (race condition → double match?)
  - Sending a message to an unmatched user (match was removed)
  - Profile with minimum vs maximum content
  - Slow network / offline behavior
  - Concurrent sessions (same user, multiple tabs)

- Output a security report with severity levels: CRITICAL / HIGH / MEDIUM / LOW
- All CRITICAL and HIGH issues must be resolved before the next cycle

### Iteration Cycle

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ IMPLEMENTER │────▶│ REVIEWER & TESTER │────▶│ QA & SECURITY AUDIT │
│  (Agent 1)  │     │    (Agent 2)      │     │     (Agent 3)       │
└─────────────┘     └──────────────────┘     └─────────────────────┘
       ▲                                              │
       │           Fix issues & iterate               │
       └──────────────────────────────────────────────┘
```

**Cycle 1**: Build Phase 1 features → Review → QA → Fix issues
**Cycle 2**: Build Phase 2 features → Review → QA → Fix issues
**Cycle 3**: Build Phase 3 features → Review → QA → Fix issues
**Cycle 4**: Final integration testing, polish, performance optimization

**Exit Criteria** (app is "done" when):
- [ ] All Phase 1-3 features implemented and working
- [ ] Test suite passes with ≥80% coverage on business logic
- [ ] Zero CRITICAL or HIGH security issues
- [ ] All E2E flows pass (signup → match → chat)
- [ ] Lighthouse mobile score ≥ 90 (Performance, Accessibility)
- [ ] App runs cleanly with `docker-compose up`
- [ ] Seed data loads and app is immediately usable for demo

---

## Getting Started

```bash
# Install dependencies
npm install

# Start infrastructure (Postgres, Redis)
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Start development servers
npm run dev
```

---

## Commands

```bash
npm run dev          # Start all apps in development mode
npm run build        # Build all apps
npm run lint         # Lint all packages
npm run test         # Run all tests
npm run test:e2e     # Run Playwright E2E tests
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```
