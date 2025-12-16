const { z } = require("zod");
const { db } = require("../../config/db");

function list() {
  return db.prepare("SELECT * FROM products WHERE is_active=1 ORDER BY id DESC").all();
}

function getOne(id) {
  return db.prepare("SELECT * FROM products WHERE id=?").get(Number(id));
}

const createSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  is_active: z.number().int().optional()
});

function create(payload) {
  const d = createSchema.parse(payload);
  const info = db.prepare(`
    INSERT INTO products(sku,name,description,price,stock,is_active)
    VALUES(?,?,?,?,?,?)
  `).run(d.sku, d.name, d.description || null, d.price, d.stock, d.is_active ?? 1);

  return getOne(info.lastInsertRowid);
}

const updateSchema = createSchema.partial();
function update(id, payload) {
  const d = updateSchema.parse(payload);
  const cur = getOne(id);
  if (!cur) throw new Error("Not found");

  const next = {
    sku: d.sku ?? cur.sku,
    name: d.name ?? cur.name,
    description: d.description ?? cur.description,
    price: d.price ?? cur.price,
    stock: d.stock ?? cur.stock,
    is_active: d.is_active ?? cur.is_active
  };

  db.prepare(`
    UPDATE products SET sku=?, name=?, description=?, price=?, stock=?, is_active=?
    WHERE id=?
  `).run(next.sku, next.name, next.description, next.price, next.stock, next.is_active, Number(id));

  return getOne(id);
}

const stockSchema = z.object({ stock: z.number().int().nonnegative() });
function updateStock(id, payload) {
  const { stock } = stockSchema.parse(payload);
  const cur = getOne(id);
  if (!cur) throw new Error("Not found");
  db.prepare("UPDATE products SET stock=? WHERE id=?").run(stock, Number(id));
  return getOne(id);
}

function remove(id) {
  db.prepare("DELETE FROM products WHERE id=?").run(Number(id));
}

module.exports = { list, getOne, create, update, updateStock, remove };
