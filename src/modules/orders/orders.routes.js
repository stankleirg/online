const express = require("express");
const router = express.Router();
const c = require("./orders.controller");
const { auth } = require("../../middleware/auth");
const { authorize } = require("../../middleware/authorize");
const { ROLES } = require("../../config/roles");

router.use(auth);

// customer: create order, view own orders
router.post("/", authorize([ROLES.CUSTOMER]), c.create);
router.get("/me", authorize([ROLES.CUSTOMER]), c.listMine);
router.get("/me/:id", authorize([ROLES.CUSTOMER]), c.getMine);

// staff/admin: manage all orders
router.get("/", authorize([ROLES.STAFF, ROLES.ADMIN]), c.listAll);
router.patch("/:id/status", authorize([ROLES.STAFF, ROLES.ADMIN]), c.updateStatus);

module.exports = router;
