require("dotenv").config();
const bcrypt = require("bcryptjs");
const { db } = require("../config/db");

(function main() {
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users(name,email,password_hash,role,status)
    VALUES(?,?,?,?,?)
  `);

  const pwAdmin = bcrypt.hashSync("admin123", 10);
  const pwStaff = bcrypt.hashSync("staff123", 10);
  const pwCust = bcrypt.hashSync("cust123", 10);

  insertUser.run("Admin", "admin@mail.com", pwAdmin, "admin", "active");
  insertUser.run("Staff", "staff@mail.com", pwStaff, "staff", "active");
  insertUser.run("Customer", "cust@mail.com", pwCust, "customer", "active");

  db.prepare(`INSERT OR IGNORE INTO categories(name) VALUES (?)`).run("Elektronik");
  db.prepare(`INSERT OR IGNORE INTO categories(name) VALUES (?)`).run("Fashion");

  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products(sku,name,description,price,stock,is_active)
    VALUES(?,?,?,?,?,?)
  `);

  insertProduct.run("SKU-001", "Headphone", "Headphone simpel", 250000, 20, 1);
  insertProduct.run("SKU-002", "Kaos Polos", "Kaos basic", 75000, 50, 1);

  console.log("Seed done ✅");
  console.log("Login default:");
  console.log("admin@mail.com / admin123");
  console.log("staff@mail.com / staff123");
  console.log("cust@mail.com / cust123");
})();
