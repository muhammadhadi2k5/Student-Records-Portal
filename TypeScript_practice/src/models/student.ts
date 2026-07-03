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

export enum StudentStatusEnum {
    Active = "active",
    Inactive = "inactive",
    Graduated = "graduated"
}