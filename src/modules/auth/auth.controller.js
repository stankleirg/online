const { fail, ok } = require("../../utils/response");
const svc = require("./auth.service");

async function register(req, res) {
  try {
    const user = await svc.register(req.body);
    return ok(res, user, "Registered");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

async function login(req, res) {
  try {
    const result = await svc.login(req.body);
    return ok(res, result, "Logged in");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

module.exports = { register, login };
