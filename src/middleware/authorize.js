const { fail } = require("../utils/response");

function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, "Unauthenticated");
    if (!allowedRoles.includes(req.user.role)) return fail(res, 403, "Forbidden");
    next();
  };
}

module.exports = { authorize };
