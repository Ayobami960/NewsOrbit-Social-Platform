// Validators/article.validator.js
const Joi = require("joi");

const objectId = Joi.string().pattern(/^[a-f\d]{24}$/i);

const mediaSchema = Joi.object({
  url:      Joi.string().uri().required(),
  fileId:   Joi.string().allow(null, "").optional(),
  fileType: Joi.string().valid("image", "video").default("image"),
  caption:  Joi.string().max(200).optional(),
  alt:      Joi.string().max(150).optional(),
  width:    Joi.number().integer().positive().optional(),
  height:   Joi.number().integer().positive().optional(),
  size:     Joi.number().integer().positive().optional(),
}).optional().allow(null);

const tagSchema = Joi.alternatives().try(
  objectId,
  Joi.string().trim().min(2).max(50)
);

const createArticle = Joi.object({
  title:        Joi.string().min(5).max(250).trim().required(),
  content:      Joi.string().min(10).required(),
  contentDelta: Joi.object().optional(),
  excerpt:      Joi.string().max(500).trim().allow("").optional(),

  category: objectId.required(),

  tags: Joi.array()
    .items(tagSchema)
    .max(20)
    .unique((a, b) => {
      const aStr = typeof a === "string" ? a.toLowerCase().trim() : String(a);
      const bStr = typeof b === "string" ? b.toLowerCase().trim() : String(b);
      return aStr === bStr;
    })
    .default([]),

  // ── Nested object (used when backend uploads via multer) ─────────────────
  featuredImage: mediaSchema,
  gallery:       Joi.array().items(mediaSchema).max(20).default([]),

  // ── Flat fields (used when frontend uploads directly to ImageKit CDN) ────
  // The controller converts these into the nested featuredImage object.
  featuredImageUrl:    Joi.string().uri().allow("", null).optional(),
  featuredImageFileId: Joi.string().allow("", null).optional(),

  status: Joi.string().valid("draft", "scheduled", "published").default("draft"),

  scheduledAt: Joi.when("status", {
    is:        "scheduled",
    then:      Joi.date().iso().greater("now").required(),
    otherwise: Joi.date().iso().optional().allow(null),
  }),

  isBreaking:        Joi.boolean().default(false),
  breakingExpiresAt: Joi.date().iso().optional().allow(null),
  allowComments:     Joi.boolean().default(true),
  isFeatured:        Joi.boolean().default(false),
  isPinned:          Joi.boolean().default(false),

  seo: Joi.object({
    metaTitle:       Joi.string().max(70).optional(),
    metaDescription: Joi.string().max(160).optional(),
    canonicalUrl:    Joi.string().uri().optional(),
    noIndex:         Joi.boolean().default(false),
  }).optional(),
});

const updateArticle = createArticle
  .fork(
    ["title", "content", "category"],
    (schema) => schema.optional()
  )
  .concat(
    Joi.object({
      featuredImage: mediaSchema.allow(null),
      gallery:       Joi.array().items(mediaSchema).max(20).allow(null),
      // Also allow flat fields on update
      featuredImageUrl:    Joi.string().uri().allow("", null).optional(),
      featuredImageFileId: Joi.string().allow("", null).optional(),
    })
  );

module.exports = { createArticle, updateArticle };