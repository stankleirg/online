const { ok, fail } = require("../../utils/response");
const svc = require("./orders.service");

function create(req, res) {
  try {
    const data = svc.create(req.user.id, req.body);
    return ok(res, data, "Order created");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

function listMine(req, res) {
  return ok(res, svc.listMine(req.user.id));
}

function getMine(req, res) {
  const data = svc.getMine(req.user.id, req.params.id);
  if (!data) return fail(res, 404, "Not found");
  return ok(res, data);
}

function listAll(req, res) {
  return ok(res, svc.listAll());
}

function updateStatus(req, res) {
  try {
    return ok(res, svc.updateStatus(req.params.id, req.body), "Status updated");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

module.exports = { create, listMine, getMine, listAll, updateStatus };
