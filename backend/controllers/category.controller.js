

const Category = require("../models/Category");
const { generateUniqueSlug } = require("../utils/slug");

const { log } = require("../models/ActivityLog");
const { sendSuccess, sendCreated, sendNotFound } = require("../utils/apiResponse");

exports.getCategories = async (req, res, next) => {
  try {
    const cats = await Category.find({ isActive: true }).sort("order name").lean();
    return sendSuccess(res, { categories: cats });
  } catch (err) { next(err); }
};
exports.getCategory = async (req, res, next) => {
  try {
    const cat = await Category.findOne({ slug: req.params.slug });
    if (!cat) return sendNotFound(res, "Category not found.");
    return sendSuccess(res, { category: cat });
  } catch (err) { next(err); }
};
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, color, order } = req.body ?? {};

    // ✅ Only name is truly required; order defaults to 0
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const slug = await generateUniqueSlug(Category, name.trim());

    const cat = await Category.create({
      name: name.trim(),
      slug,
      description,
      color: color ?? "#c0392b",
      order: order ?? 0,
      createdBy: req.user._id,
    });

    log({ user: req.user._id, action: "category_create", resource: cat._id.toString(), ip: req.ip });
    return sendCreated(res, { category: cat }, "Category created.");
  } catch (err) {
    next(err);
  }
};
exports.updateCategory = async (req, res, next) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return sendNotFound(res, "Category not found.");
    const { name, description, color, order, isActive } = req.body;
    if (name) { cat.name = name; cat.slug = await generateUniqueSlug(Category, name, cat._id); }
    if (description !== undefined) cat.description = description;
    if (color) cat.color = color;
    if (order !== undefined) cat.order = order;
    if (isActive !== undefined) cat.isActive = isActive;
    
    await cat.save();
    log({ user: req.user._id, action: "category_update", resource: cat._id.toString(), ip: req.ip });
    return sendSuccess(res, { category: cat }, "Category updated.");
  } catch (err) { next(err); }
};
exports.deleteCategory = async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return sendNotFound(res, "Category not found.");
    log({ user: req.user._id, action: "category_delete", resource: req.params.id, ip: req.ip });
    return sendSuccess(res, {}, "Category deleted.");
  } catch (err) { next(err); }
};