import "dotenv/config";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const dbPath = path.join(__dirname, "../../data/users.json");

function loadUsers() {
  if (!fs.existsSync(dbPath)) return [];
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function saveUsers(users: any[]) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(users, null, 2));
}

const users = loadUsers();

const adminEmail = process.env.ADMIN_EMAIL!;
const adminExists = users.find((u: any) => u.email === adminEmail);

if (!adminExists) {
  const newAdmin = {
    id: "u_admin",
    email: adminEmail,
    fullName: process.env.ADMIN_FULLNAME || "Admin",
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD!, 10),
    role: "admin",
  };
  users.push(newAdmin);
  saveUsers(users);
  console.log("✅ Admin created:", newAdmin.email);
} else {
  console.log("ℹ️ Admin already exists:", adminEmail);
}