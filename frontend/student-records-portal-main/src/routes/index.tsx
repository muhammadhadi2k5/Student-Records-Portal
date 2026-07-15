import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { deleteStudent, listStudents, type SortableField, type SortOrder, type Student } from "@/lib/students-api";
import {
  addSearchHistoryEntry,
  clearSearchHistory,
  getSearchHistory,
  type SearchHistoryEntry,
} from "@/lib/search-history";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/")({
  component: StudentsIndex,
});

const statusStyles: Record<Student["status"], string> = {
  Active: "bg-primary/10 text-primary border-primary/20",
  "On Leave": "bg-amber-50 text-amber-800 border-amber-200",
  Graduated: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Withdrawn: "bg-muted text-muted-foreground border-border",
};

const STATUS_OPTIONS: Student["status"][] = ["Active", "On Leave", "Graduated", "Withdrawn"];
const YEAR_OPTIONS = [1, 2, 3, 4];
const PAGE_SIZE = 10;

const selectClass =
  "rounded-md border border-input bg-card px-2.5 py-1.5 text-xs text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

function StudentsIndex() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sortBy, setSortBy] = useState<SortableField | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<Student["status"] | "">("");
  const [programFilter, setProgramFilter] = useState("");
  const [yearFilter, setYearFilter] = useState<number | "">("");
  const [studentPendingDelete, setStudentPendingDelete] = useState<Student | null>(null);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortBy, sortOrder, statusFilter, programFilter, yearFilter]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["students", page, debouncedQuery, sortBy, sortOrder, statusFilter, programFilter, yearFilter],
    queryFn: () =>
      listStudents({
        page,
        limit: PAGE_SIZE,
        search: debouncedQuery,
        sortBy,
        sortOrder,
        status: statusFilter || undefined,
        program: programFilter || undefined,
        year: yearFilter === "" ? undefined : yearFilter,
      }),
  });

  const students = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  // Programs list is capped at 100 students; fine for this dataset's scale, but
  // wouldn't capture every distinct program past that many records.
  const { data: programsData } = useQuery({
    queryKey: ["students", "programs"],
    queryFn: () => listStudents({ limit: 100 }),
  });
  const programOptions = Array.from(new Set((programsData?.data ?? []).map((s) => s.program))).sort();

  const hasActiveFilters = statusFilter !== "" || programFilter !== "" || yearFilter !== "";

  function handleSort(field: SortableField) {
    if (sortBy === field) {
      setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  function sortIndicator(field: SortableField) {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? " ▲" : " ▼";
  }

  function clearFilters() {
    setStatusFilter("");
    setProgramFilter("");
    setYearFilter("");
  }

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  function handleDelete(s: Student) {
    setStudentPendingDelete(s);
  }

  function confirmDelete() {
    if (!studentPendingDelete) return;
    removeMutation.mutate(studentPendingDelete.id);
    setStudentPendingDelete(null);
  }

  function recordVisit(s: Student) {
    if (!query.trim()) return;
    setHistory(
      addSearchHistoryEntry({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        studentId: s.studentId,
        query: query.trim(),
      }),
    );
  }

  function handleClearHistory() {
    setHistory(clearSearchHistory());
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
            A complete record of enrolled students. Use the search field to locate a record, or add a new student to the registry.
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
        <div className="relative w-full max-w-sm">
          <input
            type="search"
            placeholder="Search by name, ID, program, or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 150)}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          {showHistory && history.length > 0 ? (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-secondary py-1 shadow-lg">
              <div className="flex items-center justify-between px-3 py-1.5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent</p>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClearHistory}
                  className="text-xs text-muted-foreground hover:text-destructive hover:underline"
                >
                  Clear
                </button>
              </div>
              <ul>
                {history.map((h) => (
                  <li key={h.id}>
                    <Link
                      to="/students/$id"
                      params={{ id: h.id }}
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex items-center justify-between px-3 py-1.5 text-sm hover:bg-card"
                    >
                      <span className="font-medium text-foreground">
                        {h.lastName}, {h.firstName}
                      </span>
                      <span className="ml-2 truncate text-xs text-muted-foreground">
                        “{h.query}”
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {total > 0
            ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
            : ""}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Student["status"] | "")}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">All programs</option>
          {programOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value === "" ? "" : Number(e.target.value))}
          className={selectClass}
        >
          <option value="">All years</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>Year {y}</option>
          ))}
        </select>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-destructive hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border bg-card shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading records…</div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-destructive">
            Unable to load student records.
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No students match your search.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("lastName")} className="hover:text-foreground">
                    Name{sortIndicator("lastName")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("studentId")} className="hover:text-foreground">
                    Student ID{sortIndicator("studentId")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("program")} className="hover:text-foreground">
                    Program{sortIndicator("program")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("year")} className="hover:text-foreground">
                    Year{sortIndicator("year")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("status")} className="hover:text-foreground">
                    Status{sortIndicator("status")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s) => (
                <tr key={s.id} className="transition hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <Link
                      to="/students/$id"
                      params={{ id: s.id }}
                      onClick={() => recordVisit(s)}
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
                        onClick={() => recordVisit(s)}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                      <Link
                        to="/students/$id/edit"
                        params={{ id: s.id }}
                        onClick={() => recordVisit(s)}
                        className="text-primary hover:underline"
                      >
                        Edit
                      </Link>
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AlertDialog
        open={studentPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setStudentPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove student record?</AlertDialogTitle>
            <AlertDialogDescription>
              {studentPendingDelete
                ? `This will permanently remove ${studentPendingDelete.firstName} ${studentPendingDelete.lastName} from the registry. This can't be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
