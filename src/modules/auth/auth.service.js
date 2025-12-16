const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { db } = require("../../config/db");
const { ROLES } = require("../../config/roles");

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function register(payload) {
  const data = registerSchema.parse(payload);

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(data.email);
  if (exists) throw new Error("Email already registered");

  const hash = bcrypt.hashSync(data.password, 10);

  const stmt = db.prepare(`
    INSERT INTO users(name,email,password_hash,role,status)
    VALUES(?,?,?,?, 'active')
  `);

  const info = stmt.run(data.name, data.email, hash, ROLES.CUSTOMER);

  return { id: info.lastInsertRowid, name: data.name, email: data.email, role: ROLES.CUSTOMER };
}

async function login(payload) {
  const data = loginSchema.parse(payload);

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(data.email);
  if (!user) throw new Error("Invalid credentials");
  if (user.status !== "active") throw new Error("User inactive");

  const okPass = bcrypt.compareSync(data.password, user.password_hash);
  if (!okPass) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

module.exports = { register, login };
