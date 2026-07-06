import { useState, type FormEvent } from "react";
import type { Student, StudentInput } from "@/lib/students-api";

type Props = {
  initial?: Student;
  submitLabel: string;
  onSubmit: (input: StudentInput) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
  error?: string | null;
};

const STATUSES: Student["status"][] = ["Active", "On Leave", "Graduated", "Withdrawn"];

const fieldClass =
  "mt-1.5 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClass = "block text-xs font-medium uppercase tracking-wider text-muted-foreground";

export function StudentForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  submitting,
  error,
}: Props) {
  const [form, setForm] = useState<StudentInput>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    email: initial?.email ?? "",
    studentId: initial?.studentId ?? "",
    program: initial?.program ?? "",
    year: initial?.year ?? 1,
    status: initial?.status ?? "Active",
    enrolledAt: initial?.enrolledAt ?? new Date().toISOString().slice(0, 10),
  });

  function set<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-foreground">Personal information</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Legal name and primary institutional contact.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="firstName">First name</label>
            <input
              id="firstName"
              required
              className={fieldClass}
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              required
              className={fieldClass}
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="email">Institutional email</label>
            <input
              id="email"
              type="email"
              required
              className={fieldClass}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-foreground">Academic record</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Enrolment identifier, program, and current standing.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="studentId">Student ID</label>
            <input
              id="studentId"
              required
              className={fieldClass}
              value={form.studentId}
              onChange={(e) => set("studentId", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="program">Program</label>
            <input
              id="program"
              required
              className={fieldClass}
              value={form.program}
              onChange={(e) => set("program", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="year">Year of study</label>
            <input
              id="year"
              type="number"
              min={1}
              max={10}
              required
              className={fieldClass}
              value={form.year}
              onChange={(e) => set("year", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="status">Enrolment status</label>
            <select
              id="status"
              className={fieldClass}
              value={form.status}
              onChange={(e) => set("status", e.target.value as Student["status"])}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="enrolledAt">Date of enrolment</label>
            <input
              id="enrolledAt"
              type="date"
              required
              className={fieldClass}
              value={form.enrolledAt}
              onChange={(e) => set("enrolledAt", e.target.value)}
            />
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
