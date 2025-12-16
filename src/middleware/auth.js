const jwt = require("jsonwebtoken");
const { fail } = require("../utils/response");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return fail(res, 401, "Missing token");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, email }
    return next();
  } catch {
    return fail(res, 401, "Invalid token");
  }
}

module.exports = { auth };
