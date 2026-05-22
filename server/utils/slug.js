const toSlug = (str = "") =>
  str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-{2,}/g, "-");

const generateUniqueSlug = async (Model, title, excludeId = null, maxAttempts = 20) => {
  let slug = toSlug(title);
  if (!slug) slug = "untitled";

  let counter = 0;
  let candidate = slug;

  for (let i = 0; i < maxAttempts; i++) {
    const q = { slug: candidate };
    if (excludeId) q._id = { $ne: excludeId };

    const exists = await Model.findOne(q).select("_id").lean();
    if (!exists) return candidate;

    counter += 1;
    candidate = `${slug}-${counter}`;
  }

  // Fallback with timestamp if too many collisions
  return `${slug}-${Date.now()}`;
};

module.exports = { toSlug, generateUniqueSlug };