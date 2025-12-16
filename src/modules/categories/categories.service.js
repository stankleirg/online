const { z } = require("zod");
const { db } = require("../../config/db");

function list() {
  return db.prepare("SELECT * FROM categories ORDER BY id DESC").all();
}

function getOne(id) {
  return db.prepare("SELECT * FROM categories WHERE id=?").get(Number(id));
}

const createSchema = z.object({ name: z.string().min(2) });

function create(payload) {
  const d = createSchema.parse(payload);

  // avoid duplicate name
  const exists = db.prepare("SELECT id FROM categories WHERE name=?").get(d.name);
  if (exists) throw new Error("Category already exists");

  const info = db.prepare("INSERT INTO categories(name) VALUES(?)").run(d.name);
  return getOne(info.lastInsertRowid);
}

const updateSchema = z.object({ name: z.string().min(2) });

function update(id, payload) {
  const cur = getOne(id);
  if (!cur) throw new Error("Not found");

  const d = updateSchema.parse(payload);

  const exists = db.prepare("SELECT id FROM categories WHERE name=? AND id<>?").get(d.name, Number(id));
  if (exists) throw new Error("Category name already used");

  db.prepare("UPDATE categories SET name=? WHERE id=?").run(d.name, Number(id));
  return getOne(id);
}

function remove(id) {
  db.prepare("DELETE FROM categories WHERE id=?").run(Number(id));
}

module.exports = { list, getOne, create, update, remove };
