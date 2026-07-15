export function validateName(name: string): void {
    if (name === undefined || name === null || name.trim().length === 0) {
        throw new Error("Name cannot be empty.");
    }

    if (name.trim().length < 2) {
        throw new Error("Name must be at least 2 characters long.");
    }
}

export function validateAge(age: number): void {
    if (Number.isNaN(age)) {
        throw new Error("Age must be a number.");
    }

    if (age <= 0) {
        throw new Error("Age must be a positive number.");
    }

    if (age > 100) {
        throw new Error("Age must be a realistic number (100 or less).");
    }
}

export function validateEmail(email: string): void {
    if (email === undefined || email === null || email.trim().length === 0) {
        throw new Error("Email cannot be empty.");
    }

    if (!email.includes("@")) {
        throw new Error("Email must contain an '@' symbol.");
    }
    if (!email.includes(".com")){
        throw new Error("Email must contain a valid domain (e.g. '.com').");
    }
}

export function validateStudentInput(
    name: string,
    age: number,
    email: string,
    studentId?: string,
    program?: string,
    year?: number,
    status?: string,
    enrolledAt?: string,
): void {
    validateName(name);
    validateAge(age);
    validateEmail(email);

    if (studentId !== undefined) {
        if (studentId.trim().length === 0) {
            throw new Error("Student ID cannot be empty.");
        }
    }

    if (program !== undefined) {
        if (program.trim().length === 0) {
            throw new Error("Program cannot be empty.");
        }
    }
}

export function normalizeStudentId(studentId: string): string {
    return studentId.replace(/\D/g, "");
}

const SORTABLE_FIELDS = ["firstName", "lastName", "studentId", "program", "year", "status", "enrolledAt"] as const;
export type SortableField = (typeof SORTABLE_FIELDS)[number];
export type SortOrder = "asc" | "desc";

export function validateSort(
    sortBy: unknown,
    sortOrder: unknown,
): { sortBy: SortableField | undefined; sortOrder: SortOrder } {
    if (sortBy === undefined) {
        return { sortBy: undefined, sortOrder: "asc" };
    }

    if (typeof sortBy !== "string" || !SORTABLE_FIELDS.includes(sortBy as SortableField)) {
        throw new Error(`sortBy must be one of: ${SORTABLE_FIELDS.join(", ")}.`);
    }

    if (sortOrder !== undefined && sortOrder !== "asc" && sortOrder !== "desc") {
        throw new Error("sortOrder must be 'asc' or 'desc'.");
    }

    return { sortBy: sortBy as SortableField, sortOrder: (sortOrder as SortOrder) ?? "asc" };
}

export function validateYearFilter(year: unknown): number | undefined {
    if (year === undefined) return undefined;

    const parsed = Number(year);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 4) {
        throw new Error("year filter must be an integer between 1 and 4.");
    }
    return parsed;
}

export function validatePagination(page: unknown, limit: unknown): { page: number; limit: number } {
    const parsedPage = page === undefined ? 1 : Number(page);
    const parsedLimit = limit === undefined ? 10 : Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        throw new Error("Page must be a positive integer.");
    }

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        throw new Error("Limit must be an integer between 1 and 100.");
    }

    return { page: parsedPage, limit: parsedLimit };
}

export function validateStudentRecordInput(
    firstName: string,
    lastName: string,
    email: string,
    studentId: string,
    program: string,
    year: number,
    status: string,
    enrolledAt: string,
): void {
    validateName(firstName);
    validateName(lastName);
    validateEmail(email);

    if (studentId.trim().length === 0) {
        throw new Error("Student ID cannot be empty.");
    }

    if (program.trim().length === 0) {
        throw new Error("Program cannot be empty.");
    }

    if (!Number.isInteger(year) || year < 1 || year > 10) {
        throw new Error("Year must be an integer between 1 and 10.");
    }

    if (status.trim().length === 0) {
        throw new Error("Status cannot be empty.");
    }

    if (enrolledAt.trim().length === 0) {
        throw new Error("Enrolment date cannot be empty.");
    }
    const date = new Date(enrolledAt);
    if (Number.isNaN(date.getTime())) {
        throw new Error("Enrolment date must be a valid date.");
    }
}
