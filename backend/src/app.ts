import cors from 'cors';
import express, { type ErrorRequestHandler, type Request, type Response } from 'express';
import { studentRepository } from './student-repository';
import { type CreateStudentRecordDTO, type StudentStatus, STUDENT_STATUSES } from './models/student';
import {
  normalizeStudentId,
  validatePagination,
  validateSort,
  validateStudentRecordInput,
  validateYearFilter,
} from './validation';

function isCreateStudentPayload(body: unknown): body is CreateStudentRecordDTO {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const candidate = body as Record<string, unknown>;

  return (
    typeof candidate.firstName === 'string' &&
    typeof candidate.lastName === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.studentId === 'string' &&
    typeof candidate.program === 'string' &&
    typeof candidate.year === 'number' &&
    typeof candidate.status === 'string' &&
    typeof candidate.enrolledAt === 'string' &&
    STUDENT_STATUSES.includes(candidate.status as StudentStatus)
  );
}

export function createApp() {
  const app = express();
  const studentRepo = studentRepository;

  app.use(cors());
  app.use(express.json());

  app.get('/students', async (req: Request, res: Response) => {
    try {
      const rawPage = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
      const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
      const rawSearch = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;
      const rawSortBy = Array.isArray(req.query.sortBy) ? req.query.sortBy[0] : req.query.sortBy;
      const rawSortOrder = Array.isArray(req.query.sortOrder) ? req.query.sortOrder[0] : req.query.sortOrder;
      const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
      const rawProgram = Array.isArray(req.query.program) ? req.query.program[0] : req.query.program;
      const rawYear = Array.isArray(req.query.year) ? req.query.year[0] : req.query.year;

      const { page, limit } = validatePagination(rawPage, rawLimit);
      const { sortBy, sortOrder } = validateSort(rawSortBy, rawSortOrder);
      const yearFilter = validateYearFilter(rawYear);
      const search = typeof rawSearch === 'string' ? rawSearch.trim().toLowerCase() : '';
      const statusFilter =
        typeof rawStatus === 'string' && STUDENT_STATUSES.includes(rawStatus as StudentStatus)
          ? (rawStatus as StudentStatus)
          : undefined;
      const programFilter = typeof rawProgram === 'string' && rawProgram.trim() ? rawProgram.trim().toLowerCase() : undefined;

      const allStudents = await studentRepo.getAll();

      let filtered = search
        ? allStudents.filter((s) =>
            [s.firstName, s.lastName, s.email, s.studentId, s.program]
              .join(' ')
              .toLowerCase()
              .includes(search),
          )
        : allStudents;

      if (statusFilter) {
        filtered = filtered.filter((s) => s.status === statusFilter);
      }
      if (programFilter) {
        filtered = filtered.filter((s) => s.program.toLowerCase() === programFilter);
      }
      if (yearFilter !== undefined) {
        filtered = filtered.filter((s) => s.year === yearFilter);
      }

      if (sortBy) {
        const direction = sortOrder === 'desc' ? -1 : 1;
        filtered = [...filtered].sort((a, b) => {
          const left = a[sortBy];
          const right = b[sortBy];
          if (typeof left === 'number' && typeof right === 'number') {
            return (left - right) * direction;
          }
          return String(left).localeCompare(String(right)) * direction;
        });
      } else {
        // No explicit sort: default to newest-created first (records are stored oldest-first).
        filtered = [...filtered].reverse();
      }

      const total = filtered.length;
      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return res.status(200).json({ data, page, limit, total, totalPages });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid pagination parameters.';
      return res.status(400).json({ error: message });
    }
  });

  app.post('/students', async (req: Request, res: Response) => {
    try {
      if (!isCreateStudentPayload(req.body)) {
        return res.status(400).json({ error: 'Request body is missing required student fields.' });
      }

      const payload = req.body;
      validateStudentRecordInput(
        payload.firstName.trim(),
        payload.lastName.trim(),
        payload.email.trim(),
        payload.studentId.trim(),
        payload.program.trim(),
        payload.year,
        payload.status,
        payload.enrolledAt,
      );

      const normalizedId = normalizeStudentId(payload.studentId.trim());
      const existingStudents = await studentRepo.getAll();
      const isDuplicate =
        normalizedId.length > 0 &&
        existingStudents.some((existing) => normalizeStudentId(existing.studentId) === normalizedId);

      if (isDuplicate) {
        return res.status(400).json({ error: 'A student with this Student ID already exists.' });
      }

      const savedStudent = await studentRepo.create({
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim(),
        studentId: payload.studentId.trim(),
        program: payload.program.trim(),
        year: payload.year,
        status: payload.status,
        enrolledAt: payload.enrolledAt,
      });

      return res.status(201).json(savedStudent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid student data.';
      return res.status(400).json({ error: message });
    }
  });

  app.get('/students/:id', async (req: Request, res: Response) => {
    const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const student = await studentRepo.findById(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    return res.status(200).json(student);
  });

  app.put('/students/:id', async (req: Request, res: Response) => {
    try {
      if (!isCreateStudentPayload(req.body)) {
        return res.status(400).json({ error: 'Request body is missing required student fields.' });
      }

      const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = req.body;

      validateStudentRecordInput(
        payload.firstName.trim(),
        payload.lastName.trim(),
        payload.email.trim(),
        payload.studentId.trim(),
        payload.program.trim(),
        payload.year,
        payload.status,
        payload.enrolledAt,
      );

      const normalizedId = normalizeStudentId(payload.studentId.trim());
      const existingStudents = await studentRepo.getAll();
      const isDuplicate =
        normalizedId.length > 0 &&
        existingStudents.some(
          (existing) => existing.id !== studentId && normalizeStudentId(existing.studentId) === normalizedId,
        );

      if (isDuplicate) {
        return res.status(400).json({ error: 'A student with this Student ID already exists.' });
      }

      const updated = await studentRepo.updateById(studentId, {
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim(),
        studentId: payload.studentId.trim(),
        program: payload.program.trim(),
        year: payload.year,
        status: payload.status,
        enrolledAt: payload.enrolledAt,
      });

      if (!updated) {
        return res.status(404).json({ error: 'Student not found.' });
      }

      return res.status(200).json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid student data.';
      return res.status(400).json({ error: message });
    }
  });

  app.delete('/students/:id', async (req: Request, res: Response) => {
    const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await studentRepo.deleteById(studentId);

    if (!deleted) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    return res.status(200).json({ message: 'Student deleted successfully.' });
  });

  const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON payload.' });
    }
    throw err;
  };

  app.use(jsonErrorHandler);

  return app;
}
