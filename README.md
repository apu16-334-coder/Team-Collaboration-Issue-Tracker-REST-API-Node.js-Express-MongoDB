# Team Collaboration & Issue Tracker API

A RESTful backend API for managing teams, projects, and issues — built with Node.js, Express, and MongoDB. Supports role-based access control, JWT authentication, atomic multi-document transactions, and cascading data integrity logic.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
  - [Auth](#auth)
  - [Users](#users)
  - [Teams](#teams)
  - [Projects](#projects)
  - [Issues](#issues)
  - [Comments](#comments)
- [Role & Permission Model](#role--permission-model)
- [Business Logic & Authorization — Deep Dive](#business-logic--authorization--deep-dive)
  - [Users](#users-1)
  - [Teams](#teams-1)
  - [Projects](#projects-1)
  - [Issues](#issues-1)
  - [Comments](#comments-1)
- [Data Integrity: Multi-Document Transactions](#data-integrity-multi-document-transactions)
- [Soft-Delete & Status Lifecycle Summary](#soft-delete--status-lifecycle-summary)
- [Design Decisions](#design-decisions)
- [Behavioral Notes & Edge Cases](#behavioral-notes--edge-cases)
- [Postman Collection](#postman-collection)
- [Sample Requests & Responses](#sample-requests--responses)

---

## Features

- JWT-based authentication with password-change invalidation
- Role-based access control (`admin` / `team_lead` / `member`)
- Full CRUD for users, teams, projects, issues, and comments
- **Atomic multi-document writes** — operations that touch more than one collection (deactivating a user, changing a role, deactivating a team, removing a team member) run inside a MongoDB/Mongoose session/transaction, so a failure partway through rolls back everything instead of leaving the database half-updated
- Cascading soft-delete logic (write-time, not query-time)
- Advanced query support: filtering, searching, sorting, pagination
- Constant-time login to prevent user-enumeration attacks
- Security hardening: Helmet, CORS, rate limiting, JSON body size limit
- Centralized error handling with a custom `AppError` class, including a transaction-safe error path (`abortAndNext`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Database | MongoDB (Mongoose v9), including multi-document ACID transactions via `mongoose.startSession()` |
| Authentication | JSON Web Token (jsonwebtoken) |
| Password Hashing | bcrypt |
| Security | Helmet, CORS, express-rate-limit |

---

## Project Structure

```
src/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── team.controller.js
│   ├── project.controller.js
│   ├── issue.controller.js
│   └── comment.controller.js
├── middlewares/
│   ├── auth.middleware.js     # protect + restrictTo
│   └── error.middleware.js    # global error handler
├── models/
│   ├── user.model.js
│   ├── team.model.js
│   ├── project.model.js
│   ├── issue.model.js
│   └── comment.model.js
├── routes/
│   ├── auth.route.js
│   ├── user.route.js
│   ├── team.route.js
│   ├── project.route.js
│   ├── issue.route.js
│   └── comment.route.js
├── utils/
│   ├── AppError.js            # Custom error class
│   ├── catchAsync.js          # Async error wrapper
│   ├── filterBody.js          # Mass assignment protection
│   ├── apiFeatures.js         # Filter, search, sort, paginate
│   └── abortAndNext.js        # Transaction-safe early-return error helper
└── app.js
server.js
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB) — **must support replica-set transactions** (Atlas clusters do by default; a bare standalone `mongod` does not)

### Installation

```bash
# Clone the repository
git clone https://github.com/apu16-334-coder/Team-Collaboration-Issue-Tracker-REST-API-Node.js-Express-MongoDB
cd Team-Collaboration-Issue-Tracker-REST-API-Node.js-Express-MongoDB

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your values (see Environment Variables section)

# Start development server
npm run dev

# Start production server
npm start
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000

DATABASE=your_mongodb_connection_string

DATABASE_PASSWORD=your_mongodb_password

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d
```

---

## API Overview

### Base URL

```
http://localhost:3000/api/v1
```

All routes except `/auth/signup`, `/auth/login`, and `/auth/logout` require a Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

---

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Register a new user |
| POST | `/auth/login` | Public | Login and receive JWT |
| POST | `/auth/logout` | Public | Logout (clear token client-side) |
| PATCH | `/auth/change-password` | Logged in | Change own password |

---

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/users` | Admin | Create a new user |
| GET | `/users` | Admin | Get all users (filter, search, sort, paginate) |
| GET | `/users/me` | Logged in | Get own profile |
| PATCH | `/users/me` | Logged in | Update own profile (name, email) |
| GET | `/users/:id` | Admin, Team Lead | Get user by ID (Team Lead limited to own team's members) |
| PATCH | `/users/:id` | Admin | Update another user's name/email |
| DELETE | `/users/:id` | Admin | Deactivate user by ID (transactional cascade) |
| PATCH | `/users/:id/reactivate` | Admin | Reactivate a deactivated user |
| PATCH | `/users/:id/change-role` | Admin | Change user role (transactional cascade) |
| PATCH | `/users/:id/reset-password` | Admin | Reset a user's password |

---

### Teams

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/teams` | Admin | Create a new team |
| GET | `/teams` | Admin | Get all teams (filter, search, sort, paginate) |
| GET | `/teams/my` | Team Lead | Get own active teams (filter, search, sort, paginate) |
| GET | `/teams/:id` | Admin, Team Lead (own), Member (own) | Get team by ID |
| PATCH | `/teams/:id` | Admin | Update team |
| DELETE | `/teams/:id` | Admin | Deactivate team (transactional cascade) |
| PATCH | `/teams/:id/reactivate` | Admin | Reactivate team |
| POST | `/teams/:id/members` | Admin | Add members to team |
| DELETE | `/teams/:id/members/:userId` | Admin | Remove member from team (transactional cascade) |
| GET | `/teams/:id/projects` | Admin, Team Lead (own), Member (own) | Get projects of a team (filter, search, sort, paginate) |

---

### Projects

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/projects` | Team Lead | Create a new project (only for own team) |
| GET | `/projects` | Admin | Get all projects (filter, search, sort, paginate) |
| GET | `/projects/:id` | Admin, Team Lead (own), Member (own) | Get project by ID |
| PATCH | `/projects/:id` | Admin, Team Lead (own) | Update project |
| DELETE | `/projects/:id` | Admin | Archive or cancel project |
| GET | `/projects/:id/issues` | Admin, Team Lead (own), Member (own) | Get issues of a project (filter, search, sort, paginate) |

> `DELETE /projects/:id` archives a **completed** project. Add `?force=true` to cancel an **incomplete** project. An incomplete project cannot be deleted without `?force=true`.

---

### Issues

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/issues` | Team Lead, Member | Create a new issue |
| GET | `/issues` | Admin | Get all issues (filter, search, sort, paginate) |
| GET | `/issues/:id` | Admin, Team Lead (own), Member (own) | Get issue by ID |
| PATCH | `/issues/:id` | Team Lead (own), Member (assignee only) | Update issue — **Admin cannot use this route** |
| DELETE | `/issues/:id` | Team Lead (own) | Cancel issue — **Admin and Member cannot use this route** |

**Update permissions by role (see the [deep-dive](#issues-1) below for the exact rule):**
- **Team Lead** — can update all fields, for issues under their own team's projects only
- **Member** — must **first** be the issue's current assignee, or the request is rejected outright:
  - **Not the current assignee** (regardless of whether they created the issue) → `403`, no fields allowed at all
  - **Current assignee AND the creator** → field set: `title, description, status, priority, type, project` except change `assignedTo`
  - **Current assignee but NOT the creator** → `status` only

---

### Comments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/issues/:id/comments` | Team Lead, Member | Add a comment to an issue — **Admin cannot use this route** |
| GET | `/issues/:id/comments` | Admin, Team Lead, Member | Get comments of an issue |
| PATCH | `/issues/:id/comments/:commentId` | Author only | Edit own comment — **Admin cannot use this route** |
| DELETE | `/issues/:id/comments/:commentId` | Author only | Delete a comment — **Admin cannot use this route, and a Team Lead who did not write the comment cannot delete it either** |

> **Update and Delete role:** If a member or team-lead wrote a comment, only that member or team-lead can update and delete it **author-only, regardless of role**(admin is blocked from this route entirely).

---

## Role & Permission Model

| Role | Description |
|---|---|
| `admin` | Full access to user, team, and project management. Cannot create/update issues or comments, and cannot delete issues or comments — those actions belong to team leads and members inside their own teams. |
| `team_lead` | Manages their own teams. Create and update projects under them. Creates and updates issues within their own team's projects. Can delete (cancel) issues in their own projects. Cannot delete another person's comment unless they wrote it themselves. |
| `member` | Works only within the teams they belong to. Can create issues in their team's projects and assign issues only to themselves. Can only update an issue while they are its current assignee. |

**Key rules:**
- A `team_lead` can only act within the teams where they are set as `teamLead`
- A `member` can only create issues in a project belonging to a team they are a member of
- A `member` can only assign an issue to themselves at creation time
- Whoever the issue is currently assigned to (`assignedTo`) is the one with update rights as a `member`
- Comment authorship is fixed at creation and is the sole basis for edit/delete rights — role does not grant an override

---

## Business Logic & Authorization — Deep Dive

This section walks through exactly what each controller checks, in the order it checks it, so the rules above aren't just a summary — they're traceable back to the code.

### Users

**`createUser`** (admin) — `filterBody` whitelists `name, email, password, role, isActive`; everything else in the request body is silently dropped before the write.

**`getAllUsers`** (admin) — supports filter/search (`name`, `email`)/sort/pagination via `ApiFeatures`.

**`getMe` / `updateMe`** (any logged-in user) — `updateMe` only allows `name` and `email`; it cannot be used to change role, password, or active status.

**`getUser`** (admin, team_lead) —
- Admin can fetch **any** user, active or not.
- Team Lead can only fetch a user if that user is currently active **and** is listed in the `members` array of a team where the requesting team_lead is `teamLead`. Otherwise `403`.

**`updateUser`** (admin) —
- An admin **cannot** update their own profile through this route (`403` — they're told to use `/users/me` instead). This is a deliberate guard so admin self-edits always go through the same profile endpoint as everyone else.
- Target user must exist and be active.
- Only `name` and `email` can be changed here.

**`deleteUser`** (admin, **transactional**) — deactivates a user (`isActive = false`), never a hard delete. See [Data Integrity](#data-integrity-multi-document-transactions) for the full cascade.
- Admin cannot deactivate themselves.
- Target must exist and currently be active.
- If the target's role is `team_lead`: every team where they are `teamLead` has that field set to `null` (the team keeps running, just without a lead).
- If the target's role is `member`: they are pulled out of every team's `members` array they belong to, and unassigned (`assignedTo = null`) from any of their **non-cancelled issues** that live inside **non-cancelled/non-archived projects** of those teams.

**`changeUserRole`** (admin, **transactional**) —
- Admin cannot change their own role.
- `role` is required in the body.
- Target must exist, be active, and the new role must differ from the current one.
- Runs the **exact same cascade** as `deleteUser` (based on the role the user is *leaving*), then sets the new role. This means switching someone away from `team_lead` orphans their teams, and switching someone away from `member` strips their team memberships and open issue assignments — even though the user account itself stays active.

**`resetUserPassword`** (admin) — admin cannot reset their own password here; target must exist and be active.

**`userReactivate`** (admin) — flips `isActive` back to `true`. Does **not** restore any team memberships, lead assignments, or issue assignments that were cleared during deactivation — those cascades are one-way.

---

### Teams

**`createTeam`** (admin) — `teamLead` is **required**, not optional. The referenced user must exist, must currently hold the `team_lead` role, and must be active. Team `title` is globally unique (schema-level `unique: true`).

**`getAllTeams`** (admin) — filter/search (`title`, `description`)/sort/paginate, populates `teamLead` and `members`.

**`getMyTeams`** (team_lead) — only returns the caller's **own, active** teams.

**`getTeam`** (admin, team_lead, member) —
- An inactive team returns `404` to anyone who isn't an admin.
- Team Lead must be the `teamLead` of that specific team, else `403`.
- Member must appear in that team's `members` array, else `403`.

**`updateTeam`** (admin) — team must be active. Allowed fields: `title`, `description`, `teamLead`. A replacement `teamLead` is validated exactly like in `createTeam` (must exist, be role `team_lead`, be active).

**`deleteTeam`** (admin, **transactional**) — deactivates the team (`isActive = false`); does not touch users directly. Cascades onto that team's projects:
- Projects currently `planning` or `active` → moved to `on_hold` **and their `team` reference is set to `null`** (fully detached from the deactivated team).
- Projects currently `completed` → moved to `archived` (their `team` reference is **kept**, unlike the case above).
- Projects already `cancelled` or `archived` are left untouched.

**`teamReactivate`** (admin) — flips `isActive` back to `true`. Does not restore any project links that were nulled out by `deleteTeam`.

**`addTeamMembers`** (admin) — team must be active. Body accepts a single ID or an array of IDs. Validation runs in this order and **collects every failure into one combined error message** rather than stopping at the first problem:
1. Malformed ObjectId strings
2. IDs that don't correspond to an existing, active user
3. IDs that exist but belong to a user whose role is **not** exactly `member` (an admin or team_lead cannot be added as a team member this way)

If all validations pass, member IDs are added with `$addToSet`, so re-adding an existing member is a harmless no-op — no duplicates.

**`removeTeamMember`** (admin, **transactional**) — team must be active, and the target user must currently be listed in `members` (else `404`). Before removing them from the team, any of their **non-cancelled issues** inside that team's **non-cancelled/non-archived projects** are unassigned (`assignedTo = null`). Note this is scoped to the one team being modified — issue assignments tied to the member's *other* teams are untouched.

**`getTeamProjects`** (admin, team_lead, member) — same visibility rules as `getTeam`. What differs by role is which project statuses come back: admin sees everything, team_lead/member never see `cancelled` or `archived` projects for a team they belong to.

---

### Projects

**`createProject`** (team_lead only) — `team` is required and must be an active team. A team_lead can only create a project **for their own team** (`team.teamLead === req.user.id`); otherwise `400`. `createdBy` is auto-set to the caller.

**`getAllProjects`** (admin) — filter/search (`title`, `description`)/sort/paginate.

**`getProject`** (admin, team_lead, member) —
- Non-admins get `404` (not `403`) for a project that is `archived` or `cancelled` — the project effectively disappears from view rather than announcing it exists but is off-limits.
- Team Lead must own the project's team; Member must belong to the project's team.

**`updateProject`** (admin, team_lead) —
- Same `archived`/`cancelled` handling as above, except an **admin** viewing an archived/cancelled project gets a `400` explaining the project is already in that state (since admins are allowed to know it exists), while a non-admin still gets `404`.
- Team Lead is restricted to their own team's project, and can only change `title`, `description`, `status`.
- Admin can additionally change `team` and `dueDate`.
- If `status` is included, it must be one of `planning`, `active`, `on_hold`, `completed` — `archived` and `cancelled` **cannot be set directly through this endpoint**; those only happen via `deleteProject`.
- If `team` is being reassigned, the new team must be active.

**`deleteProject`** (admin) — this is a **status transition**, not a document deletion:
- Already `archived` or `cancelled` → `400` (nothing to do).
- Status is `completed` → moves to `archived` regardless of the `force` query.
- Status is anything else (incomplete) and `?force=true` is **not** supplied → `400`, blocking accidental cancellation of unfinished work.
- Status is incomplete and `?force=true` **is** supplied → moves to `cancelled`.

**`getProjectIssues`** (admin, team_lead, member) — same project-visibility gating as `getProject`. Query scope differs: admin and team_lead see issues of every status; a member never sees `cancelled` issues.

---

### Issues

**`createIssue`** (team_lead, member) —
- `project` is required and must not belong to an `archived`/`cancelled` project.
- Team Lead can only file issues against their own team's project.
- Member can only file issues against a project belonging to a team they're a member of.
- If `assignedTo` is supplied:
  - A **member** can only assign the issue to **themselves** — assigning to anyone else is `400`.
  - Regardless of role, the assignee must appear in the project's team `members` array. (Note: the team's `teamLead` is a separate field from `members` — see [Behavioral Notes](#behavioral-notes--edge-cases) for what this means in practice.)
- `createdBy` is auto-set to the caller.

**`getAllIssues`** (admin only).

**`getIssue`** (admin, team_lead, member) — non-admins get `404` if the parent project is `archived`/`cancelled`; a member additionally gets `404` if the issue itself is `cancelled`. Team Lead/Member visibility otherwise follows team ownership/membership, same pattern as projects.

**`updateIssue`** (team_lead, member — **admin cannot call this route at all**, blocked at the router level):
1. Parent project `archived`/`cancelled` → `404` for everyone.
2. Issue itself `cancelled` → member gets `404` (hidden); team_lead gets `400` (told explicitly it's cancelled).
3. Team Lead must own the project's team, else `403`.
4. **Member gate:** if the caller is a member and is **not** the current `assignedTo`, they get `403` immediately — this check happens *before* any field-level logic, so a member who created the issue but is no longer (or never was) the assignee cannot update it at all, not even the title.
5. Field selection: team_lead → all fields (`title`, `description`, `status`, `priority`, `type`, `project`, `assignedTo`). For a member, having passed step 4 only proves they're the current assignee — one more check decides the field set:
   - assignee **and** creator → full field set: `title, description, status, priority, type, project`
   - assignee **but not** creator → `status` only

   (A member who is the creator but not the assignee never reaches this step at all — they were already stopped at step 4.)
6. If `project` is being changed, the new project is validated the same way as in `createIssue` (must be open, caller must belong to that project's team, and if `assignedTo` is also present it must be a member of the *new* project's team).
7. If only `assignedTo` is changing (no `project` change), it's checked against the *current* project's team members.
8. If `status` is being set: team_lead can set it to any of `open, in_progress, done, in_review, closed`; a member can only set it to `open, in_progress, done`.

This is a deliberate design, not an oversight: a member's right to touch an issue tracks **current assignment**, not authorship. Since a member can only ever land on `assignedTo` by self-assigning at creation or being assigned later by a team lead, once an issue moves on from them (or was never assigned to them), they have no further claim to it — the team lead becomes the one responsible for further edits.

**`deleteIssue`** (team_lead only — **admin and member cannot call this route**) — this is a soft cancel, not a hard delete:
- Parent project `archived`/`cancelled` → `404`.
- Issue already `cancelled` → `400`.
- Team Lead must own the project's team.
- Sets `status = cancelled`. The issue document and its comments remain in the database.

---

### Comments

**`createComments`** (team_lead, member — **admin cannot call this route**) —
- `author` is auto-set to the caller, `issue` is taken from the URL param.
- Same project/issue-status gating as `updateIssue`: parent project `archived`/`cancelled` → `404`; issue `cancelled` → member gets `404`, team_lead gets `400`.
- Team Lead must own the issue's project's team; Member must belong to it.

**`getIssueComments`** (admin, team_lead, member — open to all three) —
- Admin bypasses the archived/cancelled-project hiding that applies to everyone else.
- A member is still blocked (`404`) from viewing comments on a `cancelled` issue.
- Team Lead/Member team-membership checks otherwise apply.
- Supports filter/search (`text`)/sort/paginate.

**`updateComment`** (author only — **admin cannot call this route**) —
- Same cancelled-issue / archived-project gating as above (checked against the caller's role, not the comment author's role).
- **Only the comment's own author** may edit it, regardless of whether the caller is a team_lead or member. There is no team-lead override.
- Only the `text` field can change; `isEdited` is automatically set to `true`.

**`deleteComment`** (author only — **admin cannot call this route**) — **this is the behavior that changed.**
- Same cancelled-issue / archived-project gating.
- Previously: the comment's author *or* the team lead of the project could delete it.
- **Now: only `comment.author.toString() === req.user.id` can delete it.** A team lead who did not write the comment gets `403`, even for a comment left by a member on their own team's issue. Role no longer grants any override — authorship is the only key that matters.
- This is a **hard delete** (`Comments.findByIdAndDelete`) — unlike every other resource in this API, comments are not soft-deleted; deleting one removes the document permanently.

---

## Data Integrity: Multi-Document Transactions

Four operations write to more than one collection in a single request. All four now run inside a MongoDB session so the writes succeed or fail together — the *new* addition to this project.

| Controller function | Collections touched | Why it needs a transaction |
|---|---|---|
| `user.controller.js` → `deleteUser` | `Team`, `Issue`, `User` | Orphaning a lead's teams, unassigning a member's issues, and deactivating the user must all happen or none should — otherwise you could end up with a user shown as deactivated while their old issue assignments still point at them. |
| `user.controller.js` → `changeUserRole` | `Team`, `Issue`, `User` | Same reasoning as `deleteUser`, since the cascade runs before the role field is actually written. |
| `team.controller.js` → `deleteTeam` | `Project`, `Team` | A team shouldn't end up deactivated while its projects still think they belong to it (or vice versa). |
| `team.controller.js` → `removeTeamMember` | `Issue`, `Team` | An issue shouldn't be left assigned to someone who's simultaneously being pulled off the team in the same request. |

**Pattern used in each of the four controllers:**

```js
const session = await mongoose.startSession();
try {
    session.startTransaction();

    // ...validation reads and cascading writes, each passed { session } ...

    await session.commitTransaction();
    res.status(...).json/send(...);
} catch (err) {
    await session.abortTransaction();
    next(err);
} finally {
    await session.endSession();
}
```

**`abortAndNext(session, next, error)`** — a small utility added specifically to keep this pattern clean:

```js
const abortAndNext = async (session, next, error) => {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
}
```

Inside the `try` block, ordinary validation failures (user not found, team already inactive, and so on) are **guard clauses that `return` early** — but a transaction that's been started can't just be abandoned; it has to be explicitly aborted or it's left dangling. `abortAndNext` bundles "abort the transaction, end the session, forward the error to Express" into one call, so every early-return guard clause inside a transactional controller looks like:

```js
if (!user) return abortAndNext(session, next, new AppError(404, 'User is not found'));
```

instead of repeating the abort/end/next sequence at every guard clause. The `catch` block at the bottom of the function still exists separately to handle *unexpected* runtime errors (e.g., a write that throws mid-transaction) using the same abort → end → forward sequence.

---

## Soft-Delete & Status Lifecycle Summary

Nothing except comments is ever hard-deleted from this API.

| Entity | Trigger | Resulting state | Cascade |
|---|---|---|---|
| User | `DELETE /users/:id` | `isActive: false` | If `team_lead`: leads teams → `teamLead: null`. If `member`: removed from teams' `members[]`; unassigned from open issues in active projects of those teams. |
| User (role change) | `PATCH /users/:id/change-role` | `role` updated | Same cascade as above, based on the role being left. |
| Team | `DELETE /teams/:id` | `isActive: false` | `planning`/`active` projects → `on_hold` + `team: null`. `completed` projects → `archived` (team link kept). |
| Team member | `DELETE /teams/:id/members/:userId` | pulled from `members[]` | Unassigned from open issues in that team's active projects. |
| Project | `DELETE /projects/:id` | status change only | `completed` → `archived`. Incomplete + `?force=true` → `cancelled`. Incomplete without `force` → blocked. |
| Issue | `DELETE /issues/:id` | `status: cancelled` | None — comments on the issue remain but become read/write-locked per the rules above. |
| Comment | `DELETE /issues/:id/comments/:commentId` | **document removed** | Hard delete — the only exception to the soft-delete pattern in this API. |

---

## Design Decisions

**Soft deletes over hard deletes**
Users and teams are deactivated (`isActive: false`) rather than deleted. This preserves historical data and audit trails.

**Status-based soft deletes for projects and issues**
Projects move to `cancelled` or `archived`. Issues move to `cancelled`. This avoids boolean flags and makes status a single source of truth.

**Write-time cascade**
When a team is deactivated, its projects are put on hold. When a member is removed, their issue assignments are cleared immediately — rather than filtering at query time. This keeps queries simple and data always consistent.

**Transactions for cross-collection cascades**
Any cascade that writes to more than one collection (see [Data Integrity](#data-integrity-multi-document-transactions)) runs inside a Mongoose session, so a mid-cascade failure can't leave the database in a half-updated state.

**Ownership follows current assignment, not authorship, for issue updates**
A member's right to edit an issue is tied to whether they are currently `assignedTo` that issue — not whether they created it. See the [Issues deep-dive](#issues-1) for the full reasoning.

**Authorship-only comment permissions**
Comment edit and delete rights belong exclusively to the comment's author. No role, including team lead or admin, can act on someone else's comment.

**Constant-time login**
Even when a user is not found, the login handler runs `bcrypt.compare()` against a dummy hash. This prevents timing attacks that could reveal whether an email exists in the system.

**Mass assignment protection**
All controllers use a `filterBody()` utility that whitelists allowed fields before any database write, preventing clients from injecting unexpected fields.

**Centralized error handling**
All async errors are caught by a `catchAsync` wrapper and forwarded to a single global error handler, which normalizes Mongoose validation errors, cast errors, and duplicate key errors into consistent API responses. Transactional controllers use the same error handler via `abortAndNext` or their own `catch` block.

---

## Behavioral Notes & Edge Cases

A few rules in this API are easy to misread from the endpoint table alone. These are documented here explicitly so they're never mistaken for bugs:

- **Admin cannot touch issues or comments directly.** Admin has no route for creating, updating, or deleting an issue, and no route for creating, updating, or deleting a comment. Admin's role in this system is user/team/project administration; issue and comment ownership belongs entirely to team leads and members.
- **A member must currently be the assignee to update an issue at all**, even for fields they'd otherwise be allowed to touch as the creator. See the [Issues deep-dive](#issues-1).
- **Team leads are excluded from a team's `members` array** (`members` is documented in the schema as "excludes lead"). Because issue-assignment validation checks `project.team.members`, this means a team lead cannot assign an issue to themselves through the normal assignment flow — assignment is effectively scoped to the team's members, not its lead.
- **Reactivating a user or team does not restore prior relationships.** `userReactivate` and `teamReactivate` only flip `isActive` back to `true`; team memberships, lead assignments, and issue assignments that were cleared during deactivation are not automatically restored.
- **Comments are the one hard-delete in the whole API.** Every other resource is soft-deleted via a status field or `isActive` flag; a deleted comment is actually removed from the database.

---

## Postman Collection

A ready-to-use Postman collection is included to test all endpoints.

**Location:** `postman/Team-Collaboration-Issue-Tracker-API.postman_collection.json`

### How to use

1. Open Postman
2. Click **Import** → **File**
3. Select the JSON file from the `postman/` folder
4. Set the `baseUrl` variable to either (optional):
   - `http://localhost:3000/api/v1` (local)
   - `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1` (deployed)
5. Run `/auth/login` first to get a token, then set it as the `token` variable for authenticated routes (optional)

## Sample Requests & Responses

### Signup

**POST** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/auth/signup`

Request:
```json
{
    "name": "Arif Hossain",
    "email": "arif@gmail.com",
    "password": "456321arif"
}
```

Response: 201 Created
```json
{
    "success": true,
    "message": "Account created successfully. Please log in."
}
```

### Login

**POST** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/auth/login`

Request:
```json
{
    "email": "arif@gmail.com",
    "password": "456321arif"
}
```

Response: 200 OK
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMmVjOTk1NjM5MWY4MzA0ZmM2MjhmNSIsImlhdCI6MTc4MTQ1MTQ4OSwiZXhwIjoxNzgxNTM3ODg5fQ.tBJiM5f_AwMn81sEXb7xM_V-7rdx2fQrlR6BBhVNyr4",
    "data": {
        "id": "6a2ec9956391f8304fc628f5",
        "name": "Arif Hossain",
        "email": "arif@gmail.com",
        "role": "member"
    }
}
```

### Unauthorized Access

**GET** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/users` (no token)

Response: 401 Unauthorized
```json
{
    "success": false,
    "message": "You are not logged in. Please log in"
}
```

### Create an Issue

**POST** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/issues`

Request:
```json
{
    "title": "Add dark mode to listPage",
    "project": "6a1499ad0943788d17021c9b",
    "assignedTo": "6a2ec9956391f8304fc628f5"
}
```

Response: 201 Created
```json
{
    "success": true,
    "data": {
        "title": "Add dark mode to listPage",
        "status": "open",
        "priority": "medium",
        "type": "task",
        "project": "6a1499ad0943788d17021c9b",
        "assignedTo": "6a2ec9956391f8304fc628f5",
        "createdBy": "6a2ec9956391f8304fc628f5",
        "createdAt": "2026-06-14T15:56:15.038Z",
        "updatedAt": "2026-06-14T15:56:15.038Z",
        "id": "6a2ecf1f6391f8304fc628fb"
    }
}
```

### Get an Issue

**GET** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/issues/6a2ecf1f6391f8304fc628fb`

Response: 200 OK
```json
{
    "success": true,
    "data": {
        "title": "Add dark mode to listPage",
        "status": "open",
        "priority": "medium",
        "type": "task",
        "project": {
            "title": "Project N",
            "status": "active",
            "team": {
                "title": "Team A",
                "teamLead": "69f38373c0b0fe7c632763ac",
                "members": [
                    "69f0cd881483dbd1a4a8f9af",
                    "69f0cd9c1483dbd1a4a8f9b1",
                    "6a2ec9956391f8304fc628f5"
                ],
                "id": "6a11e95c4fdb38d4d97791cb"
            },
            "id": "6a1499ad0943788d17021c9b"
        },
        "assignedTo": {
            "name": "Arif Hossain",
            "email": "arif@gmail.com",
            "isActive": true,
            "id": "6a2ec9956391f8304fc628f5"
        },
        "createdBy": {
            "name": "Arif Hossain",
            "email": "arif@gmail.com",
            "isActive": true,
            "id": "6a2ec9956391f8304fc628f5"
        },
        "createdAt": "2026-06-14T15:56:15.038Z",
        "updatedAt": "2026-06-14T15:56:15.038Z",
        "id": "6a2ecf1f6391f8304fc628fb"
    }
}
```

### Update an Issue

**PATCH** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/issues/6a2ecf1f6391f8304fc628fb`

Request:
```json
{
    "title": "Add dark mode to listPage block"
}
```

Response: 200 OK
```json
{
    "success": true,
    "data": {
        "title": "Add dark mode to listPage block",
        "status": "open",
        "priority": "medium",
        "type": "task",
        "project": {
            "title": "Project N",
            "team": "6a11e95c4fdb38d4d97791cb",
            "id": "6a1499ad0943788d17021c9b"
        },
        "assignedTo": {
            "name": "Arif Hossain",
            "email": "arif@gmail.com",
            "isActive": true,
            "id": "6a2ec9956391f8304fc628f5"
        },
        "createdBy": "6a2ec9956391f8304fc628f5",
        "createdAt": "2026-06-14T15:56:15.038Z",
        "updatedAt": "2026-06-14T17:11:07.416Z",
        "id": "6a2ecf1f6391f8304fc628fb"
    }
}
```

### Delete an Issue (as an unauthorized role)

**DELETE** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/issues/6a2ecf1f6391f8304fc628fb`

Response: 204 No Content
```json
{
    "success": false,
    "message": "You do not have permission to perform this action"
}
```

### Delete a Comment You Didn't Author

**DELETE** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/issues/6a2ecf1f6391f8304fc628fb/comments/6a3a1f1f6391f8304fc6291a`

Response (caller is a team lead, but not the comment's author): 403 Forbidden
```json
{
    "success": false,
    "message": "Only author of the comment can delete"
}
```

### Get all Issues of a Project (pagination, search, sort, filter)

**GET** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/projects/6a1499ad0943788d17021c9b/issues?status=open&sort=-updatedAt&search=add`

Response:
```json
{
    "success": true,
    "results": 2,
    "total": 2,
    "page": 1,
    "limit": 10,
    "data": [
        {
            "title": "Add dark mode to listPage block",
            "status": "open",
            "priority": "medium",
            "type": "task",
            "project": {
                "title": "Project N",
                "id": "6a1499ad0943788d17021c9b"
            },
            "assignedTo": {
                "name": "Arif Hossain",
                "email": "arif@gmail.com",
                "isActive": true,
                "id": "6a2ec9956391f8304fc628f5"
            },
            "createdBy": "6a2ec9956391f8304fc628f5",
            "createdAt": "2026-06-14T15:56:15.038Z",
            "updatedAt": "2026-06-14T17:11:07.416Z",
            "id": "6a2ecf1f6391f8304fc628fb"
        },
        {
            "title": "Add animation to homepage",
            "status": "open",
            "priority": "medium",
            "type": "feature",
            "project": {
                "title": "Project N",
                "id": "6a1499ad0943788d17021c9b"
            },
            "assignedTo": {
                "name": "Rahat",
                "email": "rahat@gmail.com",
                "isActive": true,
                "id": "69f0cd9c1483dbd1a4a8f9b1"
            },
            "createdBy": "69f0cd881483dbd1a4a8f9af",
            "createdAt": "2026-05-29T17:27:19.883Z",
            "updatedAt": "2026-06-10T14:06:35.673Z",
            "id": "6a19cc77b6c546b275f6f3b2"
        }
    ]
}
```
