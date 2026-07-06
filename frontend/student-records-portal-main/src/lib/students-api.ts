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

// ---- API ----

export async function listStudents(): Promise<Student[]> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/students`);
    if (!res.ok) throw new Error("Failed to load students");
    return res.json();
  }
  return delay(readLocal());
}

export async function getStudent(id: string): Promise<Student> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/students/${id}`);
    if (!res.ok) throw new Error("Student not found");
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
    if (!res.ok) throw new Error("Failed to create student");
    return res.json();
  }
  const list = readLocal();
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
    if (!res.ok) throw new Error("Failed to update student");
    return res.json();
  }
  const list = readLocal();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error("Student not found");
  const updated: Student = { id, ...input };
  list[idx] = updated;
  writeLocal(list);
  return delay(updated);
}

export async function deleteStudent(id: string): Promise<void> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/students/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete student");
    return;
  }
  writeLocal(readLocal().filter((x) => x.id !== id));
  await delay(null);
}
