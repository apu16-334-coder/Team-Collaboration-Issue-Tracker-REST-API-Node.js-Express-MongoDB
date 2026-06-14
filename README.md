# Team Collaboration & Issue Tracker API

A RESTful backend API for managing teams, projects, and issues — built with Node.js, Express, and MongoDB. Supports role-based access control, JWT authentication, and cascading data integrity logic.

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
- [Design Decisions](#design-decisions)
- [Postman Collection](#postman-collectio)
- [Sample Requests & Responses](#sample-requests--responses)

---

## Features

- JWT-based authentication with password change invalidation
- Role-based access control (admin / team_lead / member)
- Full CRUD for users, teams, projects, issues, and comments
- Cascading soft-delete logic (write-time, not query-time)
- Advanced query support: filtering, searching, sorting, pagination
- Constant-time login to prevent user enumeration attacks
- Security hardening: Helmet, CORS, rate limiting, JSON body size limit
- Centralized error handling with custom `AppError` class

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Database | MongoDB (Mongoose v9) |
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
│   └── apiFeatures.js         # Filter, search, sort, paginate
└── app.js
server.js
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

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

DATABASE=mongodb://<username>:<password>@@ac-stfxknv-shard-00-02.6c0zmig.mongodb.net:27017,ac-stfxknv-shard-00-00.6c0zmig.mongodb.net:27017,ac-stfxknv-shard-00-01.6c0zmig.mongodb:27017/TeamCollaborationIssueTrackerDB?ssl=true&authSource=admin&retryWrites=true&w=majority

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

All routes except `/auth/signup` and `/auth/login` require a Bearer token:

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
| PATCH | `/users/me` | Logged in | Update own profile |
| GET | `/users/:id` | Admin, Team Lead | Get user by ID |
| PATCH | `/users/:id` | Admin | Update user by ID |
| DELETE | `/users/:id` | Admin | Deactivate user by ID |
| PATCH | `/users/:id/reactivate` | Admin | Reactivate a deactivated user |
| PATCH | `/users/:id/change-role` | Admin | Change user role |
| PATCH | `/users/:id/reset-password` | Admin | Reset a user's password |

---

### Teams

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/teams` | Admin | Create a new team |
| GET | `/teams` | Admin | Get all teams (filter, search, sort, paginate) |
| GET | `/teams/my` | Team Lead | Get own teams (filter, search, sort, paginate) |
| GET | `/teams/:id` | Admin, Team Lead, Member | Get team by ID |
| PATCH | `/teams/:id` | Admin | Update team |
| DELETE | `/teams/:id` | Admin | Deactivate team |
| PATCH | `/teams/:id/reactivate` | Admin | Reactivate team |
| POST | `/teams/:id/members` | Admin | Add members to team |
| DELETE | `/teams/:id/members/:userId` | Admin | Remove member from team |
| GET | `/teams/:id/projects` | Admin, Team Lead, Member | Get projects of a team (filter, search, sort, paginate) |

---

### Projects

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/projects` | Team Lead | Create a new project |
| GET | `/projects` | Admin | Get all projects (filter, search, sort, paginate) |
| GET | `/projects/:id` | Admin, Team Lead, Member | Get project by ID |
| PATCH | `/projects/:id` | Admin, Team Lead | Update project |
| DELETE | `/projects/:id` | Admin | Archive or cancel project |
| GET | `/projects/:id/issues` | Admin, Team Lead, Member | Get issues of a project (filter, search, sort, paginate) |

> `DELETE /projects/:id` archives a completed project. Add `?force=true` to cancel an incomplete project.

---

### Issues

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/issues` | Team Lead, Member | Create a new issue |
| GET | `/issues` | Admin | Get all issues (filter, search, sort, paginate) |
| GET | `/issues/:id` | Admin, Team Lead, Member | Get issue by ID |
| PATCH | `/issues/:id` | Team Lead, Member | Update issue |
| DELETE | `/issues/:id` | Team Lead | Cancel issue |

**Update permissions by role:**
- **Team Lead** — can update all fields
- **Member (creator)** — can update title, description, status, priority, type, project
- **Member (assignee)** — can update status only

---

### Comments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/issues/:id/comments` | Team Lead, Member | Add a comment to an issue |
| GET | `/issues/:id/comments` | Admin, Team Lead, Member | Get comments of an issue (filter, search, sort, paginate) |
| PATCH | `/issues/:id/comments/:commentId` | Author only | Edit own comment |
| DELETE | `/issues/:id/comments/:commentId` | Author, Team Lead, Admin | Delete a comment |

---

## Role & Permission Model

| Role | Description |
|---|---|
| `admin` | Full access. Manages users, teams, and all data. |
| `team_lead` | Manages own teams and projects. Creates and assigns issues. |
| `member` | Works within assigned teams. Creates and updates own issues. |

**Key rules:**
- A `team_lead` can only act within their own teams
- A `member` can only create issues in their team's projects
- A `member` can only assign issues to themselves
- A `member` who is the assignee of an issue can only update its status

---

## Design Decisions

**Soft deletes over hard deletes**
Users and teams are deactivated (`isActive: false`) rather than deleted. This preserves historical data and audit trails.

**Status-based soft deletes for projects and issues**
Projects move to `cancelled` or `archived`. Issues move to `cancelled`. This avoids boolean flags and makes status a single source of truth.

**Write-time cascade**
When a team is deactivated, its projects are put on hold. When a member is removed, their issue assignments are cleared immediately — rather than filtering at query time. This keeps queries simple and data always consistent.

**Constant-time login**
Even when a user is not found, the login handler runs `bcrypt.compare()` against a dummy hash. This prevents timing attacks that could reveal whether an email exists in the system.

**Mass assignment protection**
All controllers use a `filterBody()` utility that whitelists allowed fields before any database write, preventing clients from injecting unexpected fields.

**Centralized error handling**
All async errors are caught by a `catchAsync` wrapper and forwarded to a single global error handler, which normalizes Mongoose validation errors, cast errors, and duplicate key errors into consistent API responses.

## Postman Collection

A ready-to-use Postman collection is included to test all endpoints.

**Location:** `postman/Team-Collaboration-Issue-Tracker-API.postman_collection.json`

### How to use

1. Open Postman
2. Click **Import** → **File**
3. Select the JSON file from the `postman/` folder
4. Set the `baseUrl` variable to either(optional):
   - `http://localhost:3000/api/v1` (local)
   - `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1` (deployed)
5. Run `/auth/login` first to get a token, then set it as the `token` variable for authenticated routes(optional)

## Sample Requests & Responses

### Signup

**POST** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/auth/signup`

Request:
\`\`\`json
{
    "name": "Arif Hossain",
    "email": "arif@gmail.com",
    "password": "456321arif"
}
\`\`\`

Response:
\`\`\`json
{
    "success": true,
    "message": "Account created successfully. Please log in."
}
\`\`\`

**POST** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/auth/signup`

Request:
\`\`\`json
{
    "name": "Arif Hossain",
    "email": "arif@gmail.com",
    "password": "456321arif"
}
\`\`\`

Response:
\`\`\`json
{
    "success": true,
    "message": "Account created successfully. Please log in."
}
\`\`\`

### Login

**POST** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/auth/login`

Request:
\`\`\`json
{
    "email": "arif@gmail.com",
    "password": "456321arif"
}
\`\`\`

Response:
\`\`\`json
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
\`\`\`

### Unauthorized Access

**GET** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/users`(no token)

Response:
\`\`\`json
{
    "success": false,
    "message": "You are not logged in. Please log in"
}
\`\`\`

### Created a Issue

**POST** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/issues`

Request:
\`\`\`json
{
    "title": "Add dark mode to listPage",
    "project": "6a1499ad0943788d17021c9b",
    "assignedTo": "6a2ec9956391f8304fc628f5"
}
\`\`\`

Response:
\`\`\`json
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
\`\`\`

### Get a Issue

**GET** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/issues/6a2ecf1f6391f8304fc628fb`

Response:
\`\`\`json
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
\`\`\`

### Update a Issue

**PATCH** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/issues/6a2ecf1f6391f8304fc628fb`

Request:
\`\`\`json
{
    "title": "Add dark mode to listPage block"
}
\`\`\`

Response:
\`\`\`json
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
\`\`\`

### DELETE a Issue

**GET** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/issues/6a2ecf1f6391f8304fc628fb`

Response:
\`\`\`json
{
    "success": false,
    "message": "You do not have permission to perform this action"
}
\`\`\`

### Get all Issues of a Project (pagination, search, sort, filter)

**GET** `https://team-collaboration-issue-tracker-rest.onrender.com/api/v1/projects/6a1499ad0943788d17021c9b/issues?status=open&sort=-updatedAt&search=add`

Response:
\`\`\`json
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
\`\`\`