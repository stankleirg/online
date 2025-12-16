const express = require("express");
const router = express.Router();

const c = require("./categories.controller");
const { auth } = require("../../middleware/auth");
const { authorize } = require("../../middleware/authorize");
const { ROLES } = require("../../config/roles");

// public read
router.get("/", c.list);
router.get("/:id", c.getOne);

// admin CRUD
router.post("/", auth, authorize([ROLES.ADMIN]), c.create);
router.patch("/:id", auth, authorize([ROLES.ADMIN]), c.update);
router.delete("/:id", auth, authorize([ROLES.ADMIN]), c.remove);

module.exports = router;
