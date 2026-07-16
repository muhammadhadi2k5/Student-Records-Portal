import { pool } from './db';
import { studentRepository } from './student-repository';
import { normalizeStudentId } from './validation';
import { STUDENT_STATUSES, type StudentStatus } from './models/student';

// Kept in sync by hand with frontend/.../src/lib/programs.ts - this is a
// one-off backend seeding script, not part of the running app, so it's not
// worth sharing a module across the frontend/backend boundary for it.
const PROGRAMS: string[] = [
  'Accounting', 'Anthropology', 'Applied Mathematics', 'Architecture', 'Biology',
  'Biomedical Engineering', 'Business Administration', 'Chemical Engineering', 'Chemistry',
  'Civil Engineering', 'Comparative Literature', 'Computer Science', 'Criminal Justice',
  'Data Science', 'Economics', 'Education', 'Electrical Engineering', 'Environmental Science',
  'Finance', 'Fine Arts', 'Graphic Design', 'History', 'Information Technology',
  'International Relations', 'Journalism', 'Law', 'Linguistics', 'Marketing',
  'Mechanical Engineering', 'Music', 'Nursing', 'Nutrition and Dietetics', 'Philosophy',
  'Physics', 'Political Science', 'Psychology', 'Public Health', 'Sociology',
  'Software Engineering', 'Theatre and Drama',
];

const FIRST_NAMES = [
  'Amelia', 'Julian', 'Sofia', 'Noah', 'Emma', 'Liam', 'Olivia', 'Ethan', 'Ava', 'Mason',
  'Isabella', 'Lucas', 'Mia', 'Elijah', 'Charlotte', 'James', 'Amara', 'Yusuf', 'Fatima', 'Omar',
  'Layla', 'Zainab', 'Hassan', 'Aisha', 'Bilal', 'Sara', 'Ahmed', 'Maria', 'Carlos', 'Priya',
  'Arjun', 'Wei', 'Mei', 'Chen', 'Kenji', 'Yuki', 'Diego', 'Valentina', 'Nadia', 'Karim',
  'Grace', 'Henry', 'Zoe', 'Daniel', 'Nora', 'Samuel', 'Leila', 'Marcus', 'Ines', 'Felix',
];

const LAST_NAMES = [
  'Bennett', 'Okafor', 'Marchetti', 'Thompson', 'Clarke', 'Ibrahim', 'Khan', 'Rahman', 'Singh', 'Patel',
  'Garcia', 'Martinez', 'Rodriguez', 'Chen', 'Wang', 'Kim', 'Park', 'Nakamura', 'Suzuki', 'Diallo',
  'Mensah', 'Osei', 'Popescu', 'Novak', 'Andersson', 'Johansson', 'Rossi', 'Ferrari', 'Silva', 'Costa',
  'Santos', 'Dubois', 'Lefevre', 'Muller', 'Schmidt', 'Kowalski', 'Nowak', 'Petrov', 'Ivanova', 'Hassan',
  'Farouk', 'Elrafei', 'Ahsan', 'Chowdhury', 'Reyes', 'Cruz', 'Delgado', 'Moreau', 'Laurent', 'Whitfield',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(): string {
  const start = new Date('2020-01-01').getTime();
  const end = new Date('2026-07-01').getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().slice(0, 10);
}

async function main() {
  const existing = await studentRepository.getAll();
  const usedIds = new Set(existing.map((s) => normalizeStudentId(s.studentId)));
  const usedEmails = new Set(existing.map((s) => s.email.toLowerCase()));

  function makeUniqueStudentId(): string {
    let id: string;
    do {
      const year = 2019 + Math.floor(Math.random() * 8); // 2019-2026
      const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
      id = `${year}${suffix}`; // digits only, no dashes
    } while (usedIds.has(id));
    usedIds.add(id);
    return id;
  }

  function makeUniqueEmail(firstName: string, lastName: string): string {
    const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    let email = `${base}@university.com`;
    let suffix = 2;
    while (usedEmails.has(email)) {
      email = `${base}${suffix}@university.com`;
      suffix++;
    }
    usedEmails.add(email);
    return email;
  }

  let totalCreated = 0;
  for (const program of PROGRAMS) {
    const count = Math.floor(Math.random() * 6); // 0-5 inclusive
    for (let i = 0; i < count; i++) {
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);

      await studentRepository.create({
        firstName,
        lastName,
        email: makeUniqueEmail(firstName, lastName),
        studentId: makeUniqueStudentId(),
        program,
        year: 1 + Math.floor(Math.random() * 4), // 1-4
        status: pick(STUDENT_STATUSES) as StudentStatus,
        enrolledAt: randomDate(),
      });
      totalCreated++;
    }
    console.log(`${program}: added ${count}`);
  }

  console.log(`\nTotal students created: ${totalCreated}`);
  await pool.end();
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
