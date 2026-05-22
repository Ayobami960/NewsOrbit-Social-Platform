const router = require("express").Router();
const ctrl = require("../controllers/analytics.controller");
const { protect, restrictTo } = require("../middlewares/auth");

router.use(protect, restrictTo("admin", "super_admin", "writer"));

router.get("/overview",        ctrl.getOverview);
router.get("/top-articles",    ctrl.getTopArticles);
router.get("/activity",        ctrl.getActivityLogs);
router.get("/articles-by-day", ctrl.getArticlesByDay);
router.get("/users-by-role", ctrl.getUsersByRole);


module.exports = router;