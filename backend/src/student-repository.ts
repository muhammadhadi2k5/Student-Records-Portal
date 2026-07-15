import { pool } from './db';
import type { CreateStudentRecordDTO, StudentRecord } from './models/student';

type StudentRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  student_id: string;
  program: string;
  year: number;
  status: string;
  enrolled_at: string;
};

function mapRow(row: StudentRow): StudentRecord {
  return {
    id: String(row.id),
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    studentId: row.student_id,
    program: row.program,
    year: row.year,
    status: row.status as StudentRecord['status'],
    enrolledAt: row.enrolled_at,
  };
}

async function getAll(): Promise<StudentRecord[]> {
  // ORDER BY id keeps rows in insertion order - Postgres doesn't otherwise
  // guarantee row order for a plain SELECT, and app.ts relies on this order
  // to build its "newest first" default.
  const result = await pool.query<StudentRow>('SELECT * FROM students ORDER BY id ASC');
  return result.rows.map(mapRow);
}

async function findById(id: string): Promise<StudentRecord | undefined> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return undefined;

  const result = await pool.query<StudentRow>('SELECT * FROM students WHERE id = $1', [numericId]);
  return result.rows[0] ? mapRow(result.rows[0]) : undefined;
}

async function create(data: CreateStudentRecordDTO): Promise<StudentRecord> {
  const result = await pool.query<StudentRow>(
    `INSERT INTO students (first_name, last_name, email, student_id, program, year, status, enrolled_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [data.firstName, data.lastName, data.email, data.studentId, data.program, data.year, data.status, data.enrolledAt],
  );
  return mapRow(result.rows[0]);
}

async function updateById(id: string, data: CreateStudentRecordDTO): Promise<StudentRecord | undefined> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return undefined;

  const result = await pool.query<StudentRow>(
    `UPDATE students
     SET first_name = $1, last_name = $2, email = $3, student_id = $4, program = $5, year = $6, status = $7, enrolled_at = $8
     WHERE id = $9
     RETURNING *`,
    [data.firstName, data.lastName, data.email, data.studentId, data.program, data.year, data.status, data.enrolledAt, numericId],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : undefined;
}

async function deleteById(id: string): Promise<boolean> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return false;

  const result = await pool.query('DELETE FROM students WHERE id = $1', [numericId]);
  return (result.rowCount ?? 0) > 0;
}

export const studentRepository = { getAll, findById, create, updateById, deleteById };
