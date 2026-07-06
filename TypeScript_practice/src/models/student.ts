export class Student implements IStudent {
    id: string;
    name: string;
    age: number;
    email: string;

    constructor(id: string, name: string, age: number, email: string){
        this.id = id;
        this.name = name;
        this.age = age;
        this.email = email;
    }
}

export interface IStudent {
    id: string;
    name: string;
    age: number;
    email: string;
}

export interface CreateStudentDTO {
    name: string;
    age: number;
    email: string;
}

export type StudentStatus = "Active" | "On Leave" | "Graduated" | "Withdrawn";

export const STUDENT_STATUSES = ["Active", "On Leave", "Graduated", "Withdrawn"] as const;

export type StudentRecord = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentId: string;
    program: string;
    year: number;
    status: StudentStatus;
    enrolledAt: string;
};

export type CreateStudentRecordDTO = Omit<StudentRecord, "id">;
