# TypeScript Practice API

This project is a small student management backend built with TypeScript and Express.

## What it does

- Creates students
- Lists all students
- Gets one student by ID
- Updates a student
- Deletes a student

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
4. Open the API in your browser or Postman:
   - GET http://localhost:3000/students

## Example request

Create a student with POST to http://localhost:3000/students:

```json
{
  "name": "Hadi",
  "age": 20,
  "email": "hadi@example.com"
}
```
