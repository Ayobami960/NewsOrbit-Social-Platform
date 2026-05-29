
const { sendValidationErr } = require("../utils/apiResponse");

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true, convert: true });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join("."), message: d.message.replace(/['"]/g, "") }));
    return sendValidationErr(res, errors);
  }
  req.body = value;
  next();
};

module.exports = { validate };