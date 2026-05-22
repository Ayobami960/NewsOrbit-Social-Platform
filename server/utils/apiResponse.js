
const sendSuccess = (res, data = {}, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const sendCreated = (res, data = {}, message = "Created successfully") =>
  sendSuccess(res, data, message, 201);

const sendError = (res, message = "Something went wrong", statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const sendUnauthorized  = (res, msg = "Unauthorized") => sendError(res, msg, 401);
const sendForbidden = (res, msg = "Forbidden") => sendError(res, msg, 403);
const sendNotFound = (res, msg = "Not found") => sendError(res, msg, 404);
const sendValidationErr = (res, errors) => sendError(res, "Validation failed", 422, errors);

module.exports = {
  sendSuccess, sendCreated, sendError,
  sendUnauthorized, sendForbidden, sendNotFound, sendValidationErr,
};