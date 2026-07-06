import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { deleteStudent, listStudents, type Student } from "@/lib/students-api";

export const Route = createFileRoute("/")({
  component: StudentsIndex,
});

const statusStyles: Record<Student["status"], string> = {
  Active: "bg-primary/10 text-primary border-primary/20",
  "On Leave": "bg-amber-50 text-amber-800 border-amber-200",
  Graduated: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Withdrawn: "bg-muted text-muted-foreground border-border",
};

function StudentsIndex() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const { data: students, isLoading, isError } = useQuery({
    queryKey: ["students"],
    queryFn: listStudents,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.firstName, s.lastName, s.email, s.studentId, s.program]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [students, query]);

  function handleDelete(s: Student) {
    if (!confirm(`Remove ${s.firstName} ${s.lastName} from the registry?`)) return;
    removeMutation.mutate(s.id);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Registrar / Enrolled students
          </p>
          <h1
            className="mt-2 text-3xl font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Student directory
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            A complete record of enrolled students. Use the search field to locate a record, or
            add a new student to the registry.
          </p>
        </div>
        <Link
          to="/students/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Add student
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Search by name, ID, program, or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <p className="text-xs text-muted-foreground">
          {students ? `${filtered.length} of ${students.length}` : ""}
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-card shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading records…</div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-destructive">
            Unable to load student records.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No students match your search.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Student ID</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="transition hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <Link
                      to="/students/$id"
                      params={{ id: s.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {s.lastName}, {s.firstName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{s.studentId}</td>
                  <td className="px-4 py-3 text-foreground">{s.program}</td>
                  <td className="px-4 py-3 text-muted-foreground">Year {s.year}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyles[s.status]}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-xs">
                      <Link
                        to="/students/$id"
                        params={{ id: s.id }}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                      <button
                        onClick={() =>
                          router.navigate({ to: "/students/$id/edit", params: { id: s.id } })
                        }
                        className="text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
