require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const { ok } = require("./utils/response");

const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const productsRoutes = require("./modules/products/products.routes");
const ordersRoutes = require("./modules/orders/orders.routes");
const paymentsRoutes = require("./modules/payments/payments.routes");
const categoriesRoutes = require("./modules/categories/categories.routes");

const app = express();
app.use(express.json());
app.use(morgan("dev"));

// ✅ ini yang bikin /login.html kebaca
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});


app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/products", productsRoutes);
app.use("/orders", ordersRoutes);
app.use("/payments", paymentsRoutes);
app.use("/categories", categoriesRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
