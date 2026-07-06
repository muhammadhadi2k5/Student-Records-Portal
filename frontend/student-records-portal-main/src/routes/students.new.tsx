import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentForm } from "@/components/student-form";
import { createStudent } from "@/lib/students-api";

export const Route = createFileRoute("/students/new")({
  component: NewStudent,
});

function NewStudent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createStudent,
    onSuccess: (student) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      router.navigate({ to: "/students/$id", params: { id: student.id } });
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <nav className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Students</Link>
        <span className="mx-2">/</span>
        <span>New</span>
      </nav>
      <h1
        className="mt-3 text-2xl font-semibold tracking-tight text-foreground"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        Add a student
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a new student record. All fields are required.
      </p>

      <div className="mt-8 rounded-md border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <StudentForm
          submitLabel="Create record"
          submitting={mutation.isPending}
          error={mutation.error ? (mutation.error as Error).message : null}
          onCancel={() => router.navigate({ to: "/" })}
          onSubmit={(input) => mutation.mutate(input)}
        />
      </div>
    </div>
  );
}
