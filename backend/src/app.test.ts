import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './app';
import { pool } from './db';

// Tests run against your real Postgres database (whatever DATABASE_URL in
// .env points at), since there's no per-test temp file anymore. Wiping the
// table before each test keeps them isolated from one another - which also
// means running `npm test` clears out any real data you've added by hand.
// Don't run this against a database you care about; point DATABASE_URL at a
// separate test database once you have one.
beforeEach(async () => {
  await pool.query('TRUNCATE TABLE students RESTART IDENTITY');
});

test('creates and lists students through the API', async () => {
  const app = createApp();

  const createResponse = await request(app)
    .post('/students')
    .send({
      firstName: 'Carol',
      lastName: 'Test',
      email: 'carol@example.com',
      studentId: 'S1003',
      program: 'Business Administration',
      year: 1,
      status: 'Graduated',
      enrolledAt: '2026-01-15',
    })
    .expect(201);

  assert.equal(createResponse.body.firstName, 'Carol');
  assert.equal(createResponse.body.email, 'carol@example.com');

  const listResponse = await request(app)
    .get('/students')
    .expect(200);

  assert.equal(listResponse.body.data.length, 1);
  assert.equal(listResponse.body.data[0].firstName, 'Carol');
  assert.equal(listResponse.body.total, 1);
  assert.equal(listResponse.body.page, 1);
  assert.equal(listResponse.body.totalPages, 1);
});

test('persists students between app instances', async () => {
  const appOne = createApp();
  const createResponse = await request(appOne)
    .post('/students')
    .send({
      firstName: 'Hadi',
      lastName: 'Test',
      email: 'hadi@example.com',
      studentId: 'S1001',
      program: 'Computer Science',
      year: 1,
      status: 'Active',
      enrolledAt: '2026-08-15',
    })
    .expect(201);

  assert.equal(createResponse.body.firstName, 'Hadi');

  const appTwo = createApp();
  const listResponse = await request(appTwo)
    .get('/students')
    .expect(200);

  assert.equal(listResponse.body.data.length, 1);
  assert.equal(listResponse.body.data[0].firstName, 'Hadi');
});

test('paginates, searches, and validates query params on GET /students', async () => {
  const app = createApp();

  for (let i = 1; i <= 15; i++) {
    await request(app)
      .post('/students')
      .send({
        firstName: `Student${i}`,
        lastName: 'Test',
        email: `student${i}@example.com`,
        studentId: `S${1000 + i}`,
        program: i % 2 === 0 ? 'Computer Science' : 'Business Administration',
        year: 1,
        status: 'Active',
        enrolledAt: '2026-01-15',
      })
      .expect(201);
  }

  const pageOne = await request(app).get('/students?page=1&limit=10').expect(200);
  assert.equal(pageOne.body.data.length, 10);
  assert.equal(pageOne.body.total, 15);
  assert.equal(pageOne.body.totalPages, 2);

  const pageTwo = await request(app).get('/students?page=2&limit=10').expect(200);
  assert.equal(pageTwo.body.data.length, 5);

  const outOfRange = await request(app).get('/students?page=99&limit=10').expect(200);
  assert.equal(outOfRange.body.data.length, 0);
  assert.equal(outOfRange.body.total, 15);

  const searched = await request(app).get('/students?search=computer').expect(200);
  assert.equal(searched.body.total, 7);

  await request(app).get('/students?page=0').expect(400);
  await request(app).get('/students?page=abc').expect(400);
  await request(app).get('/students?limit=101').expect(400);
});

test('defaults to newest-created first when no sort is specified', async () => {
  const app = createApp();

  for (const firstName of ['First', 'Second', 'Third']) {
    await request(app)
      .post('/students')
      .send({
        firstName,
        lastName: 'Test',
        email: `${firstName.toLowerCase()}@example.com`,
        studentId: `S-${firstName}`,
        program: 'Computer Science',
        year: 1,
        status: 'Active',
        enrolledAt: '2026-01-15',
      })
      .expect(201);
  }

  const response = await request(app).get('/students').expect(200);
  assert.deepEqual(
    response.body.data.map((s: { firstName: string }) => s.firstName),
    ['Third', 'Second', 'First'],
  );
});

test('sorts and filters students on GET /students', async () => {
  const app = createApp();

  const seedData = [
    { firstName: 'Charlie', lastName: 'Zephyr', program: 'Computer Science', year: 3, status: 'Active' },
    { firstName: 'Alice', lastName: 'Adams', program: 'Business Administration', year: 1, status: 'Graduated' },
    { firstName: 'Bob', lastName: 'Mills', program: 'Computer Science', year: 2, status: 'On Leave' },
  ];

  for (const s of seedData) {
    await request(app)
      .post('/students')
      .send({
        firstName: s.firstName,
        lastName: s.lastName,
        email: `${s.firstName.toLowerCase()}@example.com`,
        studentId: `S-${s.firstName}`,
        program: s.program,
        year: s.year,
        status: s.status,
        enrolledAt: '2026-01-15',
      })
      .expect(201);
  }

  const sortedAsc = await request(app).get('/students?sortBy=lastName&sortOrder=asc').expect(200);
  assert.deepEqual(
    sortedAsc.body.data.map((s: { lastName: string }) => s.lastName),
    ['Adams', 'Mills', 'Zephyr'],
  );

  const sortedDesc = await request(app).get('/students?sortBy=year&sortOrder=desc').expect(200);
  assert.deepEqual(
    sortedDesc.body.data.map((s: { year: number }) => s.year),
    [3, 2, 1],
  );

  const byStatus = await request(app).get('/students?status=Active').expect(200);
  assert.equal(byStatus.body.total, 1);
  assert.equal(byStatus.body.data[0].firstName, 'Charlie');

  const byProgram = await request(app).get('/students?program=Computer Science').expect(200);
  assert.equal(byProgram.body.total, 2);

  const byYear = await request(app).get('/students?year=1').expect(200);
  assert.equal(byYear.body.total, 1);
  assert.equal(byYear.body.data[0].firstName, 'Alice');

  const combined = await request(app).get('/students?program=Computer Science&sortBy=lastName&sortOrder=desc').expect(200);
  assert.deepEqual(
    combined.body.data.map((s: { lastName: string }) => s.lastName),
    ['Zephyr', 'Mills'],
  );

  await request(app).get('/students?sortBy=nonsense').expect(400);
  await request(app).get('/students?sortBy=year&sortOrder=sideways').expect(400);
  await request(app).get('/students?year=0').expect(400);
});

test('rejects a duplicate Student ID that differs only by formatting, but allows updating a record unchanged', async () => {
  const app = createApp();

  const original = await request(app)
    .post('/students')
    .send({
      firstName: 'Dana',
      lastName: 'Scully',
      email: 'dana@example.com',
      studentId: '2024-1001',
      program: 'Biology',
      year: 2,
      status: 'Active',
      enrolledAt: '2026-01-15',
    })
    .expect(201);

  // Same digits, different punctuation/spacing -> should be rejected as a duplicate.
  const duplicateResponse = await request(app)
    .post('/students')
    .send({
      firstName: 'Fox',
      lastName: 'Mulder',
      email: 'fox@example.com',
      studentId: '2024 1001',
      program: 'Biology',
      year: 2,
      status: 'Active',
      enrolledAt: '2026-01-15',
    })
    .expect(400);
  assert.match(duplicateResponse.body.error, /already exists/i);

  // A genuinely different ID is fine.
  await request(app)
    .post('/students')
    .send({
      firstName: 'Fox',
      lastName: 'Mulder',
      email: 'fox@example.com',
      studentId: '2024-1002',
      program: 'Biology',
      year: 2,
      status: 'Active',
      enrolledAt: '2026-01-15',
    })
    .expect(201);

  // Updating Dana's own record without changing the ID must not trip the duplicate check.
  await request(app)
    .put(`/students/${original.body.id}`)
    .send({
      firstName: 'Dana',
      lastName: 'Scully',
      email: 'dana@example.com',
      studentId: '2024-1001',
      program: 'Biology',
      year: 3,
      status: 'Active',
      enrolledAt: '2026-01-15',
    })
    .expect(200);

  // But updating Dana's record to steal Fox's ID must be rejected.
  const stolenIdResponse = await request(app)
    .put(`/students/${original.body.id}`)
    .send({
      firstName: 'Dana',
      lastName: 'Scully',
      email: 'dana@example.com',
      studentId: '2024-1002',
      program: 'Biology',
      year: 3,
      status: 'Active',
      enrolledAt: '2026-01-15',
    })
    .expect(400);
  assert.match(stolenIdResponse.body.error, /already exists/i);
});
