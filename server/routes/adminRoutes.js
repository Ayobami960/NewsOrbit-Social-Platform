
const router = require("express").Router();
const admin = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middlewares/auth");

router.use(protect);

// ── User management ───────────────────────────────────────────────────────────

// Invite a new user (super_admin → admin | admin → writer)
router.post("/invite", restrictTo("super_admin", "admin"), admin.inviteUser);

// List users (scoped by role inside the controller)
router.get("/users", restrictTo("admin", "super_admin"), admin.getUsers);

// Single user detail

// Role / ban / unban / activity — note /users/:id prefix on all of them
router.patch("/users/:id/role", restrictTo("super_admin"),             admin.changeRole);
router.patch("/users/:id/ban", restrictTo("admin", "super_admin"),    admin.banUser);
router.patch("/users/:id/unban", restrictTo("admin", "super_admin"),    admin.unbanUser);
router.get  ("/users/:id/activity",restrictTo("admin", "super_admin"),    admin.getUserActivity);

// ImageKit browser-upload credentials
router.get("/imagekit-auth", restrictTo("admin", "super_admin"), admin.getImageKitAuth);

// ── Analytics ─────────────────────────────────────────────────────────────────
// overview / top-articles / articles-by-day are accessible to writers too
// (the controller scopes the response to their own data automatically)

router.get("/overview",  protect, admin.getOverview);
router.get("/top-articles",  protect, admin.getTopArticles);
router.get("/articles-by-day", protect, admin.getArticlesByDay);
// router.get ("/my-stats",  protect, restrictTo("super_admin","admin","writer"),  getMyArticleStats);


// These two are super_admin-only — no role-based scoping inside the controller
router.get("/activity-logs",   restrictTo("super_admin"), admin.getActivityLogs);
router.get("/users-by-role",   restrictTo("super_admin"), admin.getUsersByRole);

module.exports = router;