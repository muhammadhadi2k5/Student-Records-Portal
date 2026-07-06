import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StudentForm } from "@/components/student-form";
import { getStudent, updateStudent } from "@/lib/students-api";

export const Route = createFileRoute("/students/$id/edit")({
  component: EditStudent,
});

function EditStudent() {
  const { id } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: student, isLoading, isError } = useQuery({
    queryKey: ["students", id],
    queryFn: () => getStudent(id),
  });

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof updateStudent>[1]) => updateStudent(id, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students", id] });
      router.navigate({ to: "/students/$id", params: { id: updated.id } });
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading record…</p>;
  if (isError || !student) {
    return <p className="text-sm text-destructive">Student record could not be found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <nav className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Students</Link>
        <span className="mx-2">/</span>
        <Link to="/students/$id" params={{ id }} className="hover:text-foreground">
          {student.lastName}, {student.firstName}
        </Link>
        <span className="mx-2">/</span>
        <span>Edit</span>
      </nav>
      <h1
        className="mt-3 text-2xl font-semibold tracking-tight text-foreground"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        Edit student record
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update the record for {student.firstName} {student.lastName}.
      </p>

      <div className="mt-8 rounded-md border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <StudentForm
          initial={student}
          submitLabel="Save changes"
          submitting={mutation.isPending}
          error={mutation.error ? (mutation.error as Error).message : null}
          onCancel={() => router.navigate({ to: "/students/$id", params: { id } })}
          onSubmit={(input) => mutation.mutate(input)}
        />
      </div>
    </div>
  );
}
