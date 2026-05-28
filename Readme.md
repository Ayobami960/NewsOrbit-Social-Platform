# OsunGist — Project Snapshot

This file contains a concise snapshot of the repository: top-level folders, key files, and a short note about how to explore or run each part.

## Overview

- Monorepo-style project containing three main parts: `admin`, `client`, and `server`.

## Repository structure

```
README.md
admin/
	checkcode.tsx
	eslint.config.js
	index.html
	package.json
	README.md
	tsconfig.app.json
	tsconfig.json
	tsconfig.node.json
	vercel.json
	vite.config.ts
	public/
	src/
		App.tsx
		code.tsx
		index.css
		main.tsx
		assets/
		components/
			Featuredimageuploader.tsx
			PageLoader.tsx
			ProtectedRoute.tsx
			charts/
			layout/
			ui/
		context/
			AuthContext.tsx
		hooks/
			useAdmin.ts
			useAnalytics.ts
			useArticles.ts
		lib/
		pages/
		types/
		utils/
client/
	AGENTS.md
	CLAUDE.md
	eslint.config.mjs
	next-env.d.ts
	next.config.ts
	package.json
	postcss.config.mjs
	README.md
	tailwind.config.ts
	tsconfig.json
	public/
	src/
		app/
		components/
		context/
		hooks/
		lib/
		types/
server/
	index.html
	package.json
	Readme.md
	server.js
	text_data.js
	vercel.json
	config/
		db.js
		Imagekit.js
		multer.js
		redis.js
	controllers/
		admin.controller.js
		analytics.controller.js
		article.controller.js
		auth.controller.js
		blog.controller.js
		category.controller.js
		comment.controller.js
		follow.controller.js
		media.controller.js
		newsletter.controller.js
		notification.controller.js
		push.controller.js
		upload.controller.js
		user.controller.js
	jobs/
		scheduler.js
	lib/
		env.js
		upload.js
	logs/
	middlewares/
		auth.js
		errorHandler.js
		security.js
		upload.js
		validate.js
	models/
		ActivityLog.js
		Article.js
		Blog.js
		Category.js
		Comment.js
		Follow.js
		Newsletter.js
		Notification.js
		PushSubscription.js
		Tags.js
		User.js
	routes/
		adminRoutes.js
		analyticsRoutes.js
		articleRoutes.js
		authRoutes.js
		blogRoutes.js
		categoryRoutes.js
		commentRoutes.js
		followRoutes.js
		index.js
		infoRoute.js
		mediaRoutes.js
		newsletterRoutes.js
		notificationRoutes.js
		pushRoutes.js
		uploadRoutes.js
		userRoutes.js
	Schema/
		auth.js
	uploads/
	utils/
		apiResponse.js
		email.js
		logger.js
		notification.js
		sanitise.js
		slug.js
		tokens.js
		webpush.js
	Validators/
		article.validator.js
		auth.validator.js
```

## Quick notes

- See the individual `README.md` files in `admin/`, `client/`, and `server/` for more specific setup and run instructions.
- Typical workflow:

	- Admin: UI tools and utilities in `admin/` (built with Vite).
	- Client: Next.js frontend in `client/`.
	- Server: Node/Express API in `server/`.

## How to explore locally

1. Inspect per-folder README files: `admin/README.md`, `client/README.md`, `server/Readme.md`.
2. Open the project in your editor to run or build the parts you need.

---

Generated snapshot of repository contents.
