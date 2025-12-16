const { ok, fail } = require("../../utils/response");
const svc = require("./users.service");

function list(req, res) {
  return ok(res, svc.list());
}

function create(req, res) {
  try {
    return ok(res, svc.create(req.body), "User created");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

function setRole(req, res) {
  try {
    return ok(res, svc.setRole(req.params.id, req.body), "Role updated");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

function setStatus(req, res) {
  try {
    return ok(res, svc.setStatus(req.params.id, req.body), "Status updated");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

function remove(req, res) {
  try {
    svc.remove(req.params.id);
    return ok(res, true, "User deleted");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

module.exports = { list, create, setRole, setStatus, remove };

