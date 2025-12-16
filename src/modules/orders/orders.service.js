const { z } = require("zod");
const { db } = require("../../config/db");

const createSchema = z.object({
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    qty: z.number().int().positive()
  })).min(1)
});

function genOrderCode() {
  const t = Date.now().toString().slice(-8);
  return `ORD-${t}`;
}

function create(userId, payload) {
  const { items } = createSchema.parse(payload);

  const tx = db.transaction(() => {
    // validate products + calculate totals + reduce stock
    let total = 0;
    const productStmt = db.prepare("SELECT id,name,price,stock,is_active FROM products WHERE id=?");
    const updateStockStmt = db.prepare("UPDATE products SET stock=? WHERE id=?");

    const preparedItems = items.map(it => {
      const p = productStmt.get(it.product_id);
      if (!p || p.is_active !== 1) throw new Error(`Product ${it.product_id} not available`);
      if (p.stock < it.qty) throw new Error(`Stock not enough for product ${p.id} (${p.name})`);

      const price = p.price;
      const subtotal = price * it.qty;
      total += subtotal;

      // reduce stock
      updateStockStmt.run(p.stock - it.qty, p.id);

      return { product_id: p.id, qty: it.qty, price_snapshot: price, subtotal };
    });

    const orderCode = genOrderCode();
    const orderInfo = db.prepare(`
      INSERT INTO orders(order_code,user_id,total_amount,status)
      VALUES(?,?,?, 'pending')
    `).run(orderCode, userId, total);

    const orderId = orderInfo.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO order_items(order_id,product_id,qty,price_snapshot,subtotal)
      VALUES(?,?,?,?,?)
    `);

    for (const it of preparedItems) {
      insertItem.run(orderId, it.product_id, it.qty, it.price_snapshot, it.subtotal);
    }

    return getById(orderId);
  });

  return tx();
}

function getById(orderId) {
  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(Number(orderId));
  if (!order) return null;
  const items = db.prepare("SELECT * FROM order_items WHERE order_id=?").all(Number(orderId));
  return { ...order, items };
}

function listMine(userId) {
  return db.prepare("SELECT * FROM orders WHERE user_id=? ORDER BY id DESC").all(Number(userId));
}

function getMine(userId, orderId) {
  const order = db.prepare("SELECT * FROM orders WHERE id=? AND user_id=?").get(Number(orderId), Number(userId));
  if (!order) return null;
  const items = db.prepare("SELECT * FROM order_items WHERE order_id=?").all(Number(orderId));
  return { ...order, items };
}

function listAll() {
  return db.prepare(`
    SELECT o.*, u.email AS customer_email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.id DESC
  `).all();
}

const statusSchema = z.object({
  status: z.enum(["pending","paid","processing","shipped","completed","cancelled"])
});
function updateStatus(orderId, payload) {
  const { status } = statusSchema.parse(payload);
  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(Number(orderId));
  if (!order) throw new Error("Not found");

  db.prepare("UPDATE orders SET status=? WHERE id=?").run(status, Number(orderId));
  return getById(orderId);
}

module.exports = { create, listMine, getMine, listAll, updateStatus, getById };
