const Joi = require("joi");

const mongoIdField = Joi.string()
  .hex()
  .length(24)
  .required()
  .messages({
    "string.hex": "Invalid id format.",
    "string.length": "Invalid id format.",
  });



// ─────────────────────────────────────────────────────────────────────────────
// Admin: role / ban / pagination / activity log
// ─────────────────────────────────────────────────────────────────────────────
exports.mongoIdParamSchema = Joi.object({
  id: mongoIdField,
}).options({ stripUnknown: true });

exports.changeRoleSchema = Joi.object({
  role: Joi.string().valid("admin", "writer").required(), // never "super_admin" via this route
}).options({ stripUnknown: true });

exports.banUserSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(300).required(),
}).options({ stripUnknown: true });

exports.paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string().valid("user", "writer", "admin", "super_admin", "manager").optional(),
  search: Joi.string().trim().max(100).allow("").optional(),
  isBanned: Joi.string().valid("true", "false").optional(),
}).options({ stripUnknown: true });

exports.createActivityLogSchema = Joi.object({
  action: Joi.string().trim().min(2).max(100).required(),
  resource: Joi.string().trim().max(200).optional(),
  resourceType: Joi.string().trim().max(50).optional(),
  meta: Joi.object().max(20).optional(), // cap object size to avoid huge payloads
}).options({ stripUnknown: true }); // user/severity/isSuspicious deliberately NOT accepted — server sets these