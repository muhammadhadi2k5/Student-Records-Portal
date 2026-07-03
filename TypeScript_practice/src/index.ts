import readline from "readline";
import { Student } from "./models/student";
import { Repository } from "./repository";
import { validateStudentInput } from "./validation";
import { simulateApiCall } from "./api";

const studentRepo = new Repository<Student>();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function showMenu(): Promise<void> {
    console.log("\n--- Student Manager ---");
    console.log("1. Add Student");
    console.log("2. List Students");
    console.log("3. Update Student");
    console.log("4. Delete Student");
    console.log("5. Exit");

    const choice = await ask("Choose an option: ");

    if (choice === "1") {
        await addStudent();
    } else if (choice === "2") {
        listStudents();
    } else if (choice === "3") {
        await updateStudent();
    } else if (choice === "4") {
        await deleteStudent();
    } else if (choice === "5") {
        console.log("Goodbye!");
        rl.close();
        return;
    } else {
        console.log("Invalid option, try again.");
    }

    await showMenu();
}

async function addStudent(): Promise<void> {
    const name = await ask("Enter name: ");
    const ageInput = await ask("Enter age: ");
    const email = await ask("Enter email: ");

    const age = Number(ageInput);

    try {
        validateStudentInput(name, age, email);

        const id = String(Date.now());
        const newStudent = new Student(id, name, age, email);

        const savedStudent = await simulateApiCall(newStudent);
        studentRepo.add(savedStudent);

        console.log("Student added successfully:", savedStudent);
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error:", error.message);
        }
    }
}

function listStudents(): void {
    const allStudents = studentRepo.getAll();

    if (allStudents.length === 0) {
        console.log("No students found.");
        return;
    }

    console.log("\n--- All Students ---");
    for (let i = 0; i < allStudents.length; i++) {
        const s = allStudents[i];
        console.log(`${i + 1}. [${s.id}] ${s.name}, age ${s.age}, ${s.email}`);
    }
}

async function updateStudent(): Promise<void> {
    const id = await ask("Enter the ID of the student to update: ");

    const existing = studentRepo.findById(id, (s) => s.id);

    if (existing === undefined) {
        console.log("No student found with that ID.");
        return;
    }

    const name = await ask(`New name (${existing.name}): `);
    const ageInput = await ask(`New age (${existing.age}): `);
    const email = await ask(`New email (${existing.email}): `);

    const age = Number(ageInput);

    try {
        validateStudentInput(name, age, email);

        const updatedStudent = new Student(id, name, age, email);
        studentRepo.updateById(id, (s) => s.id, updatedStudent);

        console.log("Student updated successfully:", updatedStudent);
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error:", error.message);
        }
    }
}

async function deleteStudent(): Promise<void> {
    const id = await ask("Enter the ID of the student to delete: ");

    const wasDeleted = studentRepo.deleteById(id, (s) => s.id);

    if (wasDeleted) {
        console.log("Student deleted successfully.");
    } else {
        console.log("No student found with that ID.");
    }
}

showMenu();