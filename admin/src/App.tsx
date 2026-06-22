import { Navigate, Route, Routes } from "react-router";
import type { Role } from "./types";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Articles from "./pages/Articles";
import ArticleEditor from "./pages/ArticleEditor";
import AcceptInvite from "./pages/AcceptInvite"; 
import Categories from "./pages/Categories";
import Users from "./pages/Users";
import Comments from "./pages/Comments";
import Blogs from "./pages/Blogs";
import Newsletter from "./pages/Newsletter";
import Push from "./pages/Push";
import ActivityLog from "./pages/ActivityLog";
import Message from "./pages/Message";
import Chat from "./pages/Chat";

const ALL_ROLES: Role[] = ["super_admin", "admin", "writer", "manager"];
const ALL_WRITER: Role[] = ["admin","writer"];
const WRITER_ONLY: Role[] = ["writer"];
const ADMIN_UP: Role[] = ["super_admin", "admin"];
const SUPER_ADMIN_ONLY: Role[] = ["super_admin"];
const SUPER_ADMIN: Role[] = ["super_admin", "manager"];

export default function AppRouter() {
  return (
    <Routes>
      {/* ── Public ──────────────────────────────────────────────────────── */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/*
        Accept-invite is intentionally NOT wrapped in PublicRoute/ProtectedRoute.
        It must be accessible whether or not the visitor is logged in —
        an invited user has no account yet.
      */}
      <Route path="/accept-invite" element={<AcceptInvite />} />

      {/* ── Smart root → role-based redirect ────────────────────────────── */}
      {/* <Route
        path="/"
        element={
          <ProtectedRoute roles={ALL_ROLES}>
            <RoleBasedLanding />
          </ProtectedRoute>
        }
      /> */}

      {/* ── All roles ───────────────────────────────────────────────────── */}
      <Route path="/"  element={<ProtectedRoute roles={ALL_ROLES}><Dashboard /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute roles={ALL_ROLES}><Analytics /></ProtectedRoute>} />
      <Route path="/articles" element={<ProtectedRoute roles={ALL_WRITER}><Articles /></ProtectedRoute>} />
      <Route path="/New-articles" element={<ProtectedRoute roles={WRITER_ONLY}><ArticleEditor /></ProtectedRoute>} />
      <Route path="/articles/edit/:id" element={<ProtectedRoute roles={ALL_ROLES}><ArticleEditor /></ProtectedRoute>} />

      {/* ── Admin + Super Admin ──────────────────────────────────────────── */}
      <Route path="/categories" element={<ProtectedRoute roles={ADMIN_UP}><Categories /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={ADMIN_UP}><Users /></ProtectedRoute>} />

      {/* Uncomment as features are built: */}
      <Route path="/blogs" element={<ProtectedRoute roles={SUPER_ADMIN}><Blogs /></ProtectedRoute>} />
      <Route path="/comments" element={<ProtectedRoute roles={SUPER_ADMIN}><Comments /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute roles={SUPER_ADMIN}><Message /></ProtectedRoute>} />
      <Route path="/newsletter" element={<ProtectedRoute roles={ALL_WRITER}><Newsletter /></ProtectedRoute>} />
      <Route path="/push" element={<ProtectedRoute roles={SUPER_ADMIN_ONLY}><Push /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute roles={SUPER_ADMIN}><Chat /></ProtectedRoute>} />

      {/* <Route path="/settings"   element={<ProtectedRoute roles={ADMIN_UP}><Settings /></ProtectedRoute>} /> */}
     

      {/* ── Super Admin only ─────────────────────────────────────────────── */}
      <Route path="/activity" element={<ProtectedRoute roles={SUPER_ADMIN}><ActivityLog /></ProtectedRoute>} />

      {/* ── Fallback ─────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role-based landing
// ─────────────────────────────────────────────────────────────────────────────
// function RoleBasedLanding() {
//   const { user } = useAuth();
//   if (user?.role === "writer") return <Navigate to="/analytics" replace />;
//   return <Dashboard />;
// }
