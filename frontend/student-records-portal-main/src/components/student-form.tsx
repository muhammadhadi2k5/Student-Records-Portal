import { useState, type FormEvent } from "react";
import type { Student, StudentInput } from "@/lib/students-api";
import { ProgramCombobox } from "@/components/program-combobox";

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
const fieldErrorClass = "border-destructive focus:border-destructive focus:ring-destructive/30";
const labelClass = "block text-xs font-medium uppercase tracking-wider text-muted-foreground";
const errorTextClass = "mt-1 text-xs text-destructive";

type FieldErrors = Partial<Record<keyof StudentInput, string>>;

function validateField<K extends keyof StudentInput>(key: K, form: StudentInput): string | undefined {
  switch (key) {
    case "firstName":{
      const value = (form[key] as string).trim();
      if (!value) return `First name is required, e.g. "John".`;
      if (value.length < 2) return `First name must be at least 2 characters, e.g. "John".`;
      return undefined;
    }
    case "lastName": {
      const value = (form[key] as string).trim();
      if (!value) return "Last name is required, e.g. 'Smith'.";
      if (value.length < 2) return "Last name must be at least 2 characters, e.g. 'Smith'.";
      return undefined;
    }
    case "email": {
      const value = form.email.trim();
      if (!value) return "Email is required, e.g. name@example.com.";
      if (!value.includes("@") || !value.includes(".com")) {
        return "Enter a valid email, e.g. name@example.com.";
      }
      return undefined;
    }
    case "studentId": {
      if (!form.studentId.trim()) return "Student ID is required, e.g. 20241001.";
      return undefined;
    }
    case "program": {
      if (!form.program.trim()) return "Program is required, e.g. Computer Science.";
      return undefined;
    }
    case "year": {
      const value = form.year;
      if (!Number.isInteger(value) || value < 1 || value > 10) {
        return "Year must be a whole number between 1 and 10, e.g. 2.";
      }
      return undefined;
    }
    case "enrolledAt": {
      const value = form.enrolledAt.trim();
      if (!value) return "Enrolment date is required, e.g. 2024-09-01.";
      if (Number.isNaN(new Date(value).getTime())) return "Enter a valid date, e.g. 2024-09-01.";
      return undefined;
    }
    default:
      return undefined;
  }
}

const VALIDATED_FIELDS: (keyof StudentInput)[] = [
  "firstName",
  "lastName",
  "email",
  "studentId",
  "program",
  "year",
  "enrolledAt",
];

function validateAll(form: StudentInput): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of VALIDATED_FIELDS) {
    const message = validateField(key, form);
    if (message) errors[key] = message;
  }
  return errors;
}

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function set<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((errors) => {
      if (!errors[key]) return errors;
      const next = { ...errors };
      delete next[key];
      return next;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validateAll(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
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
              className={`${fieldClass} ${fieldErrors.firstName ? fieldErrorClass : ""}`}
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
            {fieldErrors.firstName ? <p className={errorTextClass}>{fieldErrors.firstName}</p> : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              className={`${fieldClass} ${fieldErrors.lastName ? fieldErrorClass : ""}`}
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
            {fieldErrors.lastName ? <p className={errorTextClass}>{fieldErrors.lastName}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="email">Institutional email</label>
            <input
              id="email"
              type="email"
              className={`${fieldClass} ${fieldErrors.email ? fieldErrorClass : ""}`}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {fieldErrors.email ? <p className={errorTextClass}>{fieldErrors.email}</p> : null}
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
              className={`${fieldClass} ${fieldErrors.studentId ? fieldErrorClass : ""}`}
              value={form.studentId}
              onChange={(e) => set("studentId", e.target.value)}
            />
            {fieldErrors.studentId ? <p className={errorTextClass}>{fieldErrors.studentId}</p> : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="program">Program</label>
            <div className="mt-1.5">
              <ProgramCombobox
                id="program"
                value={form.program}
                onChange={(value) => set("program", value)}
                className={fieldErrors.program ? fieldErrorClass : ""}
              />
            </div>
            {fieldErrors.program ? <p className={errorTextClass}>{fieldErrors.program}</p> : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="year">Year of study</label>
            <input
              id="year"
              type="number"
              className={`${fieldClass} ${fieldErrors.year ? fieldErrorClass : ""}`}
              value={form.year}
              onChange={(e) => set("year", Number(e.target.value))}
            />
            {fieldErrors.year ? <p className={errorTextClass}>{fieldErrors.year}</p> : null}
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
              className={`${fieldClass} ${fieldErrors.enrolledAt ? fieldErrorClass : ""}`}
              value={form.enrolledAt}
              onChange={(e) => set("enrolledAt", e.target.value)}
            />
            {fieldErrors.enrolledAt ? <p className={errorTextClass}>{fieldErrors.enrolledAt}</p> : null}
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
