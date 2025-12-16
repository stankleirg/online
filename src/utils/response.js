function ok(res, data, message = "OK") {
  return res.json({ success: true, message, data });
}

function fail(res, status, message, details = null) {
  return res.status(status).json({ success: false, message, details });
}

module.exports = { ok, fail };
