import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteStudent, getStudent } from "@/lib/students-api";

export const Route = createFileRoute("/students/$id")({
  component: StudentDetail,
});

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-border py-3 last:border-b-0">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function StudentDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: student, isLoading, isError } = useQuery({
    queryKey: ["students", id],
    queryFn: () => getStudent(id),
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      router.navigate({ to: "/" });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading record…</p>;
  }

  if (isError || !student) {
    return (
      <div>
        <p className="text-sm text-destructive">Student record could not be found.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <nav className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Students</Link>
        <span className="mx-2">/</span>
        <span>{student.lastName}, {student.firstName}</span>
      </nav>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {student.firstName} {student.lastName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Student ID <span className="font-mono">{student.studentId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/students/$id/edit"
            params={{ id: student.id }}
            className="inline-flex items-center rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            Edit
          </Link>
          <button
            onClick={() => {
              if (confirm(`Remove ${student.firstName} ${student.lastName} from the registry?`)) {
                removeMutation.mutate();
              }
            }}
            className="inline-flex items-center rounded-md border border-destructive/30 bg-card px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/5"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-md border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-foreground">Record</h2>
        <dl className="mt-3">
          <DetailRow label="Full name" value={`${student.firstName} ${student.lastName}`} />
          <DetailRow label="Email" value={student.email} />
          <DetailRow label="Student ID" value={<span className="font-mono">{student.studentId}</span>} />
          <DetailRow label="Program" value={student.program} />
          <DetailRow label="Year" value={`Year ${student.year}`} />
          <DetailRow label="Status" value={student.status} />
          <DetailRow
            label="Enrolled"
            value={new Date(student.enrolledAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </dl>
      </div>

      <Link to="/" className="mt-6 inline-block text-sm text-primary hover:underline">
        ← Back to directory
      </Link>
    </div>
  );
}
