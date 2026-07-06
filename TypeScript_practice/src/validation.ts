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

    if (age > 120) {
        throw new Error("Age must be a realistic number (120 or less).");
    }
}

export function validateEmail(email: string): void {
    if (email === undefined || email === null || email.trim().length === 0) {
        throw new Error("Email cannot be empty.");
    }

    if (!email.includes("@")) {
        throw new Error("Email must contain an '@' symbol.");
    }

    if (!email.includes(".")) {
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

    if (year !== undefined) {
        if (!Number.isInteger(year) || year < 1 || year > 10) {
            throw new Error("Year must be an integer between 1 and 10.");
        }
    }

    if (status !== undefined) {
        if (status.trim().length === 0) {
            throw new Error("Status cannot be empty.");
        }
    }

    if (enrolledAt !== undefined) {
        if (enrolledAt.trim().length === 0) {
            throw new Error("Enrolment date cannot be empty.");
        }
        const date = new Date(enrolledAt);
        if (Number.isNaN(date.getTime())) {
            throw new Error("Enrolment date must be a valid date.");
        }
    }
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
