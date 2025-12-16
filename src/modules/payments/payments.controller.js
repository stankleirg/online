const { ok, fail } = require("../../utils/response");
const svc = require("./payments.service");

function create(req, res) {
  try {
    return ok(res, svc.create(req.user.id, req.body), "Payment submitted");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

function verify(req, res) {
  try {
    return ok(res, svc.verify(req.params.id), "Payment verified");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

function reject(req, res) {
  try {
    return ok(res, svc.reject(req.params.id), "Payment rejected");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

module.exports = { create, verify, reject };
