const express = require("express");
const router = express.Router();
const c = require("./users.controller");
const { auth } = require("../../middleware/auth");
const { authorize } = require("../../middleware/authorize");
const { ROLES } = require("../../config/roles");

router.use(auth, authorize([ROLES.ADMIN]));

router.get("/", c.list);
router.post("/", c.create);
router.patch("/:id/role", c.setRole);
router.patch("/:id/status", c.setStatus);
router.delete("/:id", c.remove);

module.exports = router;
