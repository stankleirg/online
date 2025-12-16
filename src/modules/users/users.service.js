const { z } = require("zod");
const bcrypt = require("bcryptjs");
const { db } = require("../../config/db");
const { ROLES } = require("../../config/roles");

function list() {
  return db.prepare("SELECT id,name,email,role,status,created_at FROM users ORDER BY id DESC").all();
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum([ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER]).default(ROLES.CUSTOMER)
});

function create(payload) {
  const data = createSchema.parse(payload);
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(data.email);
  if (exists) throw new Error("Email already used");

  const hash = bcrypt.hashSync(data.password, 10);
  const info = db
    .prepare("INSERT INTO users(name,email,password_hash,role,status) VALUES(?,?,?,?, 'active')")
    .run(data.name, data.email, hash, data.role);

  return { id: info.lastInsertRowid, name: data.name, email: data.email, role: data.role };
}

const roleSchema = z.object({ role: z.enum([ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER]) });
function setRole(id, payload) {
  const { role } = roleSchema.parse(payload);
  db.prepare("UPDATE users SET role=? WHERE id=?").run(role, Number(id));
  return db.prepare("SELECT id,name,email,role,status FROM users WHERE id=?").get(Number(id));
}

const statusSchema = z.object({ status: z.enum(["active", "inactive"]) });
function setStatus(id, payload) {
  const { status } = statusSchema.parse(payload);
  db.prepare("UPDATE users SET status=? WHERE id=?").run(status, Number(id));
  return db.prepare("SELECT id,name,email,role,status FROM users WHERE id=?").get(Number(id));
}

module.exports = { list, create, setRole, setStatus };
