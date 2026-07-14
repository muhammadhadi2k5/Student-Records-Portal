# Student Records API

A small student management backend built with TypeScript and Express. This is the backend half of the AI Campus Assistant project — see the [root README](../README.md) for overall project status and how to run it alongside the frontend.

## What it does

- Creates students
- Lists all students
- Gets one student by ID
- Updates a student
- Deletes a student
- Persists student data to `data/students.json`

## Project structure

- `src/server.ts` - HTTP server entrypoint
- `src/app.ts` - Express app and route handlers
- `src/repository.ts` - file-backed repository storage
- `src/models/student.ts` - student model definitions
- `src/validation.ts` - input validation logic
- `src/index.ts` - an earlier CLI-based student manager, superseded by the REST API; kept for history, not used by anything
- `data/students.json` - persisted student data

## How to run

1. Open a terminal in this folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
4. Use the API at:
   - `http://localhost:3000/students`

## API endpoints

- `GET /students` - list students, paginated (see below)
- `GET /students/:id` - get student by ID
- `POST /students` - create a new student
- `PUT /students/:id` - update a student
- `DELETE /students/:id` - delete a student

### GET /students query params

| Param    | Default | Notes                                                    |
|----------|---------|-----------------------------------------------------------|
| `page`   | `1`     | Positive integer. Out-of-range pages return an empty `data` array (not an error). |
| `limit`  | `10`    | Positive integer, max `100`.                              |
| `search` | -       | Case-insensitive match across first name, last name, email, student ID, and program. |

Invalid `page`/`limit` (non-integers, or out of the allowed range) return `400`.

Response shape:
```json
{
  "data": [ /* StudentRecord[] for this page */ ],
  "page": 1,
  "limit": 10,
  "total": 15,
  "totalPages": 2
}
```

### Student ID uniqueness

`POST /students` and `PUT /students/:id` reject a `studentId` that already belongs to another student. The comparison ignores everything except digits, so `"2024-1001"`, `"2024 1001"`, and `"S2024/1001"` are all treated as the same ID. Returns `400` with `{ "error": "A student with this Student ID already exists." }`.

## Example POST request

From PowerShell, use valid JSON like this (all fields are required, and `status` must be one of `Active`, `On Leave`, `Graduated`, `Withdrawn`):

```powershell
$body = '{"firstName":"Ada","lastName":"Lovelace","email":"ada@example.com","studentId":"2024-1001","program":"Computer Science","year":2,"status":"Active","enrolledAt":"2024-09-01"}'
curl.exe -i -X POST http://localhost:3000/students -H "Content-Type: application/json" -d $body
```
or use Postman to post JSON

## Persistence

The app writes student records to `data/students.json` (relative to this folder), so new students persist across server restarts.

## Run tests

From this `backend` folder:

```bash
npm run typecheck
npm test
```


