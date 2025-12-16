const { z } = require("zod");
const { db } = require("../../config/db");

const createSchema = z.object({
  order_id: z.number().int().positive(),
  method: z.string().min(2),
  amount: z.number().int().nonnegative(),
  proof_url: z.string().url().optional()
});

function create(userId, payload) {
  const d = createSchema.parse(payload);

  const order = db.prepare("SELECT * FROM orders WHERE id=? AND user_id=?").get(d.order_id, Number(userId));
  if (!order) throw new Error("Order not found");
  if (order.status === "cancelled") throw new Error("Order cancelled");
  if (order.total_amount !== d.amount) throw new Error("Amount must match order total");

  const exists = db.prepare("SELECT id FROM payments WHERE order_id=?").get(d.order_id);
  if (exists) throw new Error("Payment already submitted for this order");

  const info = db.prepare(`
    INSERT INTO payments(order_id,method,amount,status,paid_at,proof_url)
    VALUES(?,?,?, 'pending', datetime('now'), ?)
  `).run(d.order_id, d.method, d.amount, d.proof_url || null);

  return db.prepare("SELECT * FROM payments WHERE id=?").get(info.lastInsertRowid);
}

function verify(paymentId) {
  const tx = db.transaction(() => {
    const p = db.prepare("SELECT * FROM payments WHERE id=?").get(Number(paymentId));
    if (!p) throw new Error("Payment not found");
    if (p.status !== "pending") throw new Error("Payment already processed");

    db.prepare("UPDATE payments SET status='verified' WHERE id=?").run(Number(paymentId));
    db.prepare("UPDATE orders SET status='paid' WHERE id=?").run(p.order_id);

    return db.prepare("SELECT * FROM payments WHERE id=?").get(Number(paymentId));
  });

  return tx();
}

function reject(paymentId) {
  const p = db.prepare("SELECT * FROM payments WHERE id=?").get(Number(paymentId));
  if (!p) throw new Error("Payment not found");
  if (p.status !== "pending") throw new Error("Payment already processed");

  db.prepare("UPDATE payments SET status='rejected' WHERE id=?").run(Number(paymentId));
  return db.prepare("SELECT * FROM payments WHERE id=?").get(Number(paymentId));
}

module.exports = { create, verify, reject };
