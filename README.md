# Student Records Portal

A student records management system, built during a software development internship at Highnoon Laboratories LTD. The project was scoped as a 16-week capstone (compressed to a 6-week execution plan) meant to grow from a basic CRUD API into a full AI-powered campus assistant — this repo reflects the point at which development was stopped.

## Project status

**Stopped partway through the planned scope.** What's actually implemented and working:

- A TypeScript/Express REST API for student records (create, list, get by ID, update, delete)
- Input validation with clear 400 error responses
- File-backed persistence (JSON file, not a real database)
- A React/TanStack Start frontend (student directory, view/edit/delete/add student, search)
- A test suite (`node:test` + supertest) covering the API's core behavior

**Planned but not implemented:** authentication, a real database (still a JSON file, not SQL/ERD-backed), the AI chatbot / prompt engineering / conversation memory / document RAG / voice assistant features, Socket.IO realtime updates, caching/performance work, Docker deployment, and OpenAPI documentation.
## Tech stack

- **Backend:** Node.js, TypeScript (strict mode), Express, file-based persistence
- **Frontend:** React, TanStack Start/Router, Vite, Tailwind CSS
- **Tooling:** ESLint, Prettier, `node:test` + supertest, Postman (for manual API testing)

## Project structure

```
AI-Assistant/
├── backend/                        Express + TypeScript API
│   ├── src/
│   │   ├── server.ts                Entry point (starts the HTTP server)
│   │   ├── app.ts                   Express app, routes, request handling
│   │   ├── repository.ts            Generic file-backed data layer
│   │   ├── validation.ts            Input validation
│   │   ├── models/student.ts        Types/DTOs
│   │   ├── index.ts                 Superseded CLI student manager (kept for history, unused)
│   │   └── app.test.ts              API tests
│   ├── data/students.json           Persisted student records
│   └── docs/                        Requirements doc, code review notes
├── frontend/student-records-portal-main/   React/TanStack frontend
└── package.json                     Root convenience script to run both at once
```

## How to run it

You'll need Node.js and npm installed.

**1. Install dependencies** (three separate installs — backend, frontend, and the root dev-runner):
```bash
npm install
npm install --prefix backend
npm install --prefix frontend/student-records-portal-main
```

**2. Start both the backend and frontend together**, from the repo root:
```bash
npm run dev
```
This runs the backend (`http://localhost:3000`) and frontend (`http://localhost:8080`) concurrently, with labeled output. Open `http://localhost:8080` in a browser.

If you'd rather run them separately, in two terminals:
```bash
npm run dev --prefix backend
npm run dev --prefix frontend/student-records-portal-main
```

**3. Run the backend test suite:**
```bash
npm test --prefix backend
```

## API reference

Base URL: `http://localhost:3000`

| Method | Path             | Description              |
|--------|------------------|--------------------------|
| GET    | `/students`      | List all students        |
| GET    | `/students/:id`  | Get one student by ID    |
| POST   | `/students`      | Create a student         |
| PUT    | `/students/:id`  | Update a student         |
| DELETE | `/students/:id`  | Delete a student         |

Student shape (`POST`/`PUT` body — `id` is server-generated, don't send it):
```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "studentId": "2024-1001",
  "program": "Computer Science",
  "year": 2,
  "status": "Active",
  "enrolledAt": "2024-09-01"
}
```
`status` must be one of `"Active"`, `"On Leave"`, `"Graduated"`, `"Withdrawn"`.
