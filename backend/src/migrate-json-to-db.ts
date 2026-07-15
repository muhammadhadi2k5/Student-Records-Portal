import fs from 'node:fs';
import path from 'node:path';
import { pool } from './db';
import { studentRepository } from './student-repository';
import type { StudentRecord } from './models/student';

async function main() {
  const dataFilePath = path.resolve(__dirname, '..', 'data', 'students.json');
  const raw = fs.readFileSync(dataFilePath, 'utf8');
  const students: StudentRecord[] = JSON.parse(raw);

  console.log(`Found ${students.length} students in ${dataFilePath}`);

  await pool.query('TRUNCATE TABLE students RESTART IDENTITY');
  console.log('Cleared the students table before importing.');

  let imported = 0;
  for (const student of students) {
    // The old string id (e.g. "mr93qdjisvxx") is dropped here - Postgres
    // assigns a fresh integer id for each row on insert.
    await studentRepository.create({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      studentId: student.studentId,
      program: student.program,
      year: student.year,
      status: student.status,
      enrolledAt: student.enrolledAt,
    });
    imported++;
  }

  console.log(`Imported ${imported} students into Postgres.`);
  await pool.end();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
