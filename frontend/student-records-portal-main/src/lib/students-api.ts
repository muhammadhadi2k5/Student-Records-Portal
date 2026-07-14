export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  program: string;
  year: number;
  status: "Active" | "On Leave" | "Graduated" | "Withdrawn";
  enrolledAt: string; // ISO date
};

export type StudentInput = Omit<Student, "id">;

export type ListStudentsParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type PaginatedStudents = {
  data: Student[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
const STORAGE_KEY = "student-registry:v1";

// ---- localStorage fallback (used when VITE_API_BASE_URL is not set) ----

const seed: Student[] = [
  {
    id: "s-1001",
    firstName: "Amelia",
    lastName: "Bennett",
    email: "a.bennett@university.edu",
    studentId: "2024-1001",
    program: "B.A. Political Science",
    year: 3,
    status: "Active",
    enrolledAt: "2022-09-01",
  },
  {
    id: "s-1002",
    firstName: "Julian",
    lastName: "Okafor",
    email: "j.okafor@university.edu",
    studentId: "2024-1002",
    program: "B.Sc. Applied Mathematics",
    year: 2,
    status: "Active",
    enrolledAt: "2023-09-01",
  },
  {
    id: "s-1003",
    firstName: "Sofia",
    lastName: "Marchetti",
    email: "s.marchetti@university.edu",
    studentId: "2023-0884",
    program: "M.A. Comparative Literature",
    year: 1,
    status: "On Leave",
    enrolledAt: "2024-09-01",
  },
];

function readLocal(): Student[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Student[];
  } catch {
    return seed;
  }
}

function writeLocal(students: Student[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function newId() {
  return "s-" + Math.random().toString(36).slice(2, 9);
}

async function delay<T>(value: T): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), 150));
}

function normalizeStudentId(studentId: string): string {
  return studentId.replace(/\D/g, "");
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // response wasn't JSON; fall through to the generic message
  }
  return fallback;
}

// ---- API ----

export async function listStudents(params: ListStudentsParams = {}): Promise<PaginatedStudents> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const search = params.search?.trim() ?? "";

  if (API_BASE) {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.set("search", search);
    const res = await fetch(`${API_BASE}/students?${query}`);
    if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load students"));
    return res.json();
  }

  const all = readLocal();
  const filtered = search
    ? all.filter((s) =>
        [s.firstName, s.lastName, s.email, s.studentId, s.program]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : all;

  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return delay({ data, page, limit, total, totalPages });
}

export async function getStudent(id: string): Promise<Student> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/students/${id}`);
    if (!res.ok) throw new Error(await parseErrorMessage(res, "Student not found"));
    return res.json();
  }
  const s = readLocal().find((x) => x.id === id);
  if (!s) throw new Error("Student not found");
  return delay(s);
}

export async function createStudent(input: StudentInput): Promise<Student> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to create student"));
    return res.json();
  }
  const list = readLocal();
  const normalizedId = normalizeStudentId(input.studentId.trim());
  if (normalizedId && list.some((s) => normalizeStudentId(s.studentId) === normalizedId)) {
    throw new Error("A student with this Student ID already exists.");
  }
  const student: Student = { id: newId(), ...input };
  writeLocal([student, ...list]);
  return delay(student);
}

export async function updateStudent(id: string, input: StudentInput): Promise<Student> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to update student"));
    return res.json();
  }
  const list = readLocal();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error("Student not found");
  const normalizedId = normalizeStudentId(input.studentId.trim());
  if (normalizedId && list.some((s) => s.id !== id && normalizeStudentId(s.studentId) === normalizedId)) {
    throw new Error("A student with this Student ID already exists.");
  }
  const updated: Student = { id, ...input };
  list[idx] = updated;
  writeLocal(list);
  return delay(updated);
}

export async function deleteStudent(id: string): Promise<void> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/students/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to delete student"));
    return;
  }
  writeLocal(readLocal().filter((x) => x.id !== id));
  await delay(null);
}
