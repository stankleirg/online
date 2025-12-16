const { ok, fail } = require("../../utils/response");
const svc = require("./categories.service");

function list(req, res) {
  return ok(res, svc.list());
}

function getOne(req, res) {
  const row = svc.getOne(req.params.id);
  if (!row) return fail(res, 404, "Not found");
  return ok(res, row);
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

function remove(req, res) {
  try {
    svc.remove(req.params.id);
    return ok(res, true, "Deleted");
  } catch (e) {
    return fail(res, 400, e.message);
  }
}

module.exports = { list, getOne, create, update, remove };
