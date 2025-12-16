const express = require("express");
const router = express.Router();
const c = require("./products.controller");
const { auth } = require("../../middleware/auth");
const { authorize } = require("../../middleware/authorize");
const { ROLES } = require("../../config/roles");

// public
router.get("/", c.list);
router.get("/:id", c.getOne);

// admin only (full CRUD)
router.post("/", auth, authorize([ROLES.ADMIN]), c.create);
router.patch("/:id", auth, authorize([ROLES.ADMIN]), c.update);
router.delete("/:id", auth, authorize([ROLES.ADMIN]), c.remove);

// staff can update stock only
router.patch("/:id/stock", auth, authorize([ROLES.STAFF, ROLES.ADMIN]), c.updateStock);

module.exports = router;
