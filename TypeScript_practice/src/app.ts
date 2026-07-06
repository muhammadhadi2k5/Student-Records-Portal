import cors from 'cors';
import path from 'node:path';
import express, { type ErrorRequestHandler, type Request, type Response } from 'express';
import { simulateApiCall } from './api';
import { Repository } from './repository';
import { type CreateStudentRecordDTO, type StudentRecord, type StudentStatus, STUDENT_STATUSES } from './models/student';
import { validateStudentRecordInput } from './validation';

function generateStudentId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

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

export function createApp(options?: { dataFilePath?: string }) {
  const app = express();
  const defaultDataFilePath = path.resolve(__dirname, '..', 'data', 'students.json');
  const dataFilePath = options?.dataFilePath ?? defaultDataFilePath;
  const studentRepo = new Repository<StudentRecord>(dataFilePath);

  app.use(cors());
  app.use(express.json());

  app.get('/students', async (_req: Request, res: Response) => {
    const students = await simulateApiCall(studentRepo.getAll(), 0);
    return res.status(200).json(students);
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

      const student: StudentRecord = {
        id: generateStudentId(),
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim(),
        studentId: payload.studentId.trim(),
        program: payload.program.trim(),
        year: payload.year,
        status: payload.status,
        enrolledAt: payload.enrolledAt,
      };

      const savedStudent = await simulateApiCall(student, 0);
      studentRepo.add(savedStudent);

      return res.status(201).json(savedStudent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid student data.';
      return res.status(400).json({ error: message });
    }
  });

  app.get('/students/:id', (req: Request, res: Response) => {
    const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const student = studentRepo.findById(studentId, (item) => item.id);

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

      const updatedStudent: StudentRecord = {
        id: studentId,
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim(),
        studentId: payload.studentId.trim(),
        program: payload.program.trim(),
        year: payload.year,
        status: payload.status,
        enrolledAt: payload.enrolledAt,
      };

      const updated = studentRepo.updateById(studentId, (item) => item.id, updatedStudent);

      if (!updated) {
        return res.status(404).json({ error: 'Student not found.' });
      }

      const savedStudent = await simulateApiCall(updatedStudent, 0);
      return res.status(200).json(savedStudent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid student data.';
      return res.status(400).json({ error: message });
    }
  });

  app.delete('/students/:id', (req: Request, res: Response) => {
    const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = studentRepo.deleteById(studentId, (item) => item.id);

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
