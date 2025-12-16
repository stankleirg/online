const { ok, fail } = require("../../utils/response");
const svc = require("./products.service");

function list(req, res) {
  return ok(res, svc.list());
}

function getOne(req, res) {
  const p = svc.getOne(req.params.id);
  if (!p) return fail(res, 404, "Not found");
  return ok(res, p);
}

function create(req, res) {
  try {
    return ok(res, svc.create(req.body), "Created");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

function update(req, res) {
  try {
    return ok(res, svc.update(req.params.id, req.body), "Updated");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

function updateStock(req, res) {
  try {
    return ok(res, svc.updateStock(req.params.id, req.body), "Stock updated");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

function remove(req, res) {
  try {
    svc.remove(req.params.id);
    return ok(res, true, "Deleted");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

module.exports = { list, getOne, create, update, updateStock, remove };
