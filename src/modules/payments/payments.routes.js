const express = require("express");
const router = express.Router();
const c = require("./payments.controller");
const { auth } = require("../../middleware/auth");
const { authorize } = require("../../middleware/authorize");
const { ROLES } = require("../../config/roles");

router.use(auth);

// customer creates payment for their own order
router.post("/", authorize([ROLES.CUSTOMER]), c.create);

// admin verifies/rejects payment
router.patch("/:id/verify", authorize([ROLES.ADMIN]), c.verify);
router.patch("/:id/reject", authorize([ROLES.ADMIN]), c.reject);

module.exports = router;
