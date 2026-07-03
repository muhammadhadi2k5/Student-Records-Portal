import readline from "readline";
import { Student } from "./models/student";
import { Repository } from "./repository";
import { validateStudentInput, validateName, validateAge, validateEmail } from "./validation";
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

async function askYesNo(question: string): Promise<boolean> {
    while (true) {
        const answer = (await ask(question)).trim().toLowerCase();
        if (answer === "y" || answer === "yes") {
            return true;
        }
        if (answer === "n" || answer === "no") {
            return false;
        }
        console.log("Please enter 'y' or 'n'.");
    }
}

async function askValidatedName(question: string): Promise<string> {
    while (true) {
        const input = await ask(question);
        try {
            validateName(input);
            return input.trim();
        } catch (error) {
            if (error instanceof Error) {
                console.log(`Error: ${error.message}`);
            }
        }
    }
}

async function askValidatedAge(question: string): Promise<number> {
    while (true) {
        const input = await ask(question);
        const age = Number(input);

        try {
            validateAge(age);
            return age;
        } catch (error) {
            if (error instanceof Error) {
                console.log(`Error: ${error.message}`);
            }
        }
    }
}

async function askValidatedEmail(question: string): Promise<string> {
    while (true) {
        const input = await ask(question);
        try {
            validateEmail(input);
            return input.trim();
        } catch (error) {
            if (error instanceof Error) {
                console.log(`Error: ${error.message}`);
            }
        }
    }
}

function generateStudentId(): string {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
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
    const name = await askValidatedName("Enter name: ");
    const age = await askValidatedAge("Enter age: ");
    const email = await askValidatedEmail("Enter email: ");

    validateStudentInput(name, age, email);

    const id = generateStudentId();
    const newStudent = new Student(id, name, age, email);

    const savedStudent = await simulateApiCall(newStudent);
    studentRepo.add(savedStudent);

    console.log("Student added successfully:", savedStudent);
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

    let name = existing.name;
    let age = existing.age;
    let email = existing.email;

    if (await askYesNo(`Update name? (current: ${existing.name}) [y/n]: `)) {
        name = await askValidatedName("Enter new name: ");
    }

    if (await askYesNo(`Update age? (current: ${existing.age}) [y/n]: `)) {
        age = await askValidatedAge("Enter new age: ");
    }

    if (await askYesNo(`Update email? (current: ${existing.email}) [y/n]: `)) {
        email = await askValidatedEmail("Enter new email: ");
    }

    const updatedStudent = new Student(id, name, age, email);
    studentRepo.updateById(id, (s) => s.id, updatedStudent);

    console.log("Student updated successfully:", updatedStudent);
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