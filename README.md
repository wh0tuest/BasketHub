# BasketHub

BasketHub is a full-stack web application for managing basketball teams, players and tournaments.

The project was developed as a university software engineering project. It provides a REST API built with **Node.js and Express**, a local **SQLite** database, **JWT-based authentication and role-based authorization**, and a browser interface.

## Features

- User registration and login
- Password hashing with `bcrypt`
- JWT authentication
- Role-based access control (`user` / `admin`)
- Team and player management
- Tournament management
- Tournament applications with `pending`, `accepted` and `rejected` statuses
- Admin approval and rejection of applications
- SQLite relational database
- REST API
- Database initialization and demo-data seeding

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 5 | REST API and web server |
| SQLite 3 | Relational database |
| sqlite3 | Node.js SQLite driver |
| JWT | Authentication |
| bcrypt | Password hashing |
| HTML / CSS / JavaScript | Frontend |
| Git | Version control |

## Project Structure

```text
BasketHub/
├── app.js
├── package.json
├── package-lock.json
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   ├── teams.js
│   ├── players.js
│   ├── tournaments.js
│   └── applications.js
├── db/
│   ├── database.js
│   ├── init.js
│   ├── init.sql
│   ├── seed.sql
│   └── setup.js
└── public/
    ├── index.html
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── tournament.html
    ├── app.js
    └── style.css
```

## Requirements

- **Node.js 18+**
- **npm**
- Windows, macOS or Linux

No separate database server is required. SQLite runs locally as a file-based database.

## Installation

```bash
git clone https://github.com/wh0tuest/BasketHub.git
cd BasketHub
npm install
npm run setup
```

`npm run setup` creates `db/database.db` from the schema and loads demo data.

## Configuration

The application requires a JWT signing secret.

### macOS / Linux

```bash
export JWT_SECRET="replace-with-a-long-random-secret"
npm start
```

### Windows PowerShell

```powershell
$env:JWT_SECRET="replace-with-a-long-random-secret"
npm start
```

Never commit real secrets, `.env` files or local database files to GitHub.

## Running

```bash
npm start
```

Open:

```text
http://localhost:3000
```

The Express server serves both the frontend and REST API.

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@baskethub.local` | `password` |
| User | `user@baskethub.local` | `password` |

These accounts are for local demonstration only.

## API Overview

### Authentication

```http
POST /auth/register
POST /auth/login
```

### Teams

```http
GET    /teams
GET    /teams/:id
POST   /teams
PUT    /teams/:id
DELETE /teams/:id
```

### Players

```http
GET    /players
POST   /players
PUT    /players/:id
DELETE /players/:id
```

### Tournaments

```http
GET    /tournaments
GET    /tournaments/:id
POST   /tournaments
PUT    /tournaments/:id
DELETE /tournaments/:id
POST   /tournaments/:id/teams
```

### Applications

```http
POST   /applications
GET    /applications
PUT    /applications/:id
```

Protected endpoints require:

```http
Authorization: Bearer <token>
```

## Authorization

- **User** — manages their own team and players and submits tournament applications.
- **Admin** — manages tournaments and reviews applications.

JWT middleware verifies the authenticated user's identity and role before granting access to protected resources.

## Database Model

The main entities are `users`, `teams`, `players`, `tournaments` and `applications`.

- A user can own one team.
- A team can contain multiple players.
- A team can submit applications to multiple tournaments.
- A tournament can receive applications from multiple teams.
- Foreign keys and unique constraints enforce data integrity.

## Recreating the Database

The database file is intentionally ignored by Git.

macOS / Linux:

```bash
rm -f db/database.db
npm run setup
```

Windows PowerShell:

```powershell
Remove-Item db/database.db -ErrorAction SilentlyContinue
npm run setup
```

## License

This project was created for educational purposes.
