import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  useAdminUsers,
  useInviteUser,
  useBanUser,
  useUnbanUser,
  useChangeRole,
} from "../hooks/useAdmin";
import Layout from "../components/layout/Layout";
import {
  Card, Table, Th, Td, Badge, Btn, Input, Select,
  Modal, FormGroup, Spinner, Empty, Pagination, Avatar,
} from "../components/ui";
import type { User, UserFilters, Role } from "../types";
import {
  ROLE_LABEL, ROLE_COLOR, formatDate, timeAgo,
} from "../lib/utils";
import { UserPlus, Shield, Ban, RotateCcw, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Role hierarchy — single source of truth on the frontend.
//
// super_admin → sees ALL roles, can invite admin | writer,
//               can change any role, can ban any non-super_admin
// admin       → sees writer | user only, can invite writer only,
//               can ban writer | user (not self, not super_admin, not other admins)
// ─────────────────────────────────────────────────────────────────────────────

const CREATABLE_ROLES: Record<string, ("admin" | "writer")[]> = {
  super_admin: ["admin", "writer"],
  admin:       ["writer"],
};

// Roles each actor is permitted to see in the user list.
const VISIBLE_ROLES: Record<string, Role[]> = {
  super_admin: ["super_admin", "admin", "writer", "user"],
  admin:       ["writer", "user"],
};

// Roles each actor is permitted to ban/unban.
const BANNABLE_ROLES: Record<string, Role[]> = {
  super_admin: ["admin", "writer", "user"],
  admin:       ["writer", "user"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface InviteFormState {
  name:  string;
  email: string;
  role:  "admin" | "writer";
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** True when the acting user may ban/unban the target user. */
function canBan(actorRole: Role, targetRole: Role, isSelf: boolean): boolean {
  if (isSelf) return false;
  return BANNABLE_ROLES[actorRole]?.includes(targetRole) ?? false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Users() {
  const { user: me, isRole } = useAuth();
  const isSuperAdmin = isRole("super_admin");
  const isAdmin      = isRole("super_admin", "admin");

  const myRole = me?.role ?? "user";

  // Roles this user can see in the filter dropdown
  const visibleRoles: Role[] = VISIBLE_ROLES[myRole] ?? [];

  // Roles this user can create via invite
  const creatableRoles: ("admin" | "writer")[] =
    me ? (CREATABLE_ROLES[me.role] ?? []) : [];

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<UserFilters>({
    page: 1, limit: 20, role: "", search: "",
  });
  const [search, setSearch] = useState("");

  // ── Modal state ────────────────────────────────────────────────────────────
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleOpen,   setRoleOpen]   = useState(false);
  const [banOpen,    setBanOpen]    = useState(false);
  const [selected,   setSelected]   = useState<User | null>(null);

  const [inviteForm, setInviteForm] = useState<InviteFormState>({
    name: "", email: "", role: creatableRoles[0] ?? "writer",
  });
  const [banReason, setBanReason] = useState("");
  const [newRole,   setNewRole]   = useState<Role>("writer");

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data, isLoading } = useAdminUsers(filters);
  const users      = data?.users      ?? [];
  const pagination = data?.pagination;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const inviteMut = useInviteUser();
  const banMut    = useBanUser();
  const unbanMut  = useUnbanUser();
  const roleMut   = useChangeRole();

  // ── Open invite modal ─────────────────────────────────────────────────────
  const openInvite = () => {
    setInviteForm({ name: "", email: "", role: creatableRoles[0] ?? "writer" });
    setInviteOpen(true);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const runSearch = () => setFilters(f => ({ ...f, search, page: 1 }));

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) { toast.error("Email is required."); return; }
    await inviteMut.mutateAsync(inviteForm);
    setInviteOpen(false);
    setInviteForm({ name: "", email: "", role: creatableRoles[0] ?? "writer" });
  };

  const handleBan = async () => {
    if (!selected) return;
    if (!banReason.trim()) { toast.error("Ban reason is required."); return; }
    await banMut.mutateAsync({ id: selected._id, payload: { reason: banReason } });
    setBanOpen(false); setBanReason(""); setSelected(null);
  };

  const handleUnban = (u: User) => unbanMut.mutate(u._id);

  const handleRoleChange = async () => {
    if (!selected) return;
    await roleMut.mutateAsync({ id: selected._id, payload: { role: newRole } });
    setRoleOpen(false); setSelected(null);
  };

  const openBan  = (u: User) => { setSelected(u); setBanReason(""); setBanOpen(true); };
  const openRole = (u: User) => { setSelected(u); setNewRole(u.role); setRoleOpen(true); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout
      title="Users & Roles"
      action={
        creatableRoles.length > 0 ? (
          <Btn variant="primary" size="sm" onClick={openInvite}>
            <UserPlus size={14} /> Invite User
          </Btn>
        ) : undefined
      }
    >
      {/* Role hierarchy strip */}
      <div className="mb-5 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-2">
          Role Hierarchy
        </p>
        <div className="flex items-center gap-2 text-sm text-zinc-400 flex-wrap">
          {(["super_admin", "admin", "writer", "user"] as Role[]).map((r, i, arr) => (
            <span key={r} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ROLE_COLOR[r]}`}>
                {ROLE_LABEL[r]}
              </span>
              {i < arr.length - 1 && <ChevronRight size={13} className="text-zinc-700" />}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-zinc-600 mt-2">
          {isSuperAdmin
            ? "Super Admin can view all roles, invite Admins & Writers, change any role, and ban any non-super_admin."
            : "Admin can view Writers & Users, invite Writers, and ban Writers & Users."}
        </p>
      </div>

      {/* Main card */}
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Input
            className="max-w-55"
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runSearch()}
          />

          {/* Role filter — scoped to what the current user is allowed to see */}
          <Select
            className="w-37.5"
            value={filters.role ?? ""}
            onChange={e =>
              setFilters(f => ({ ...f, role: e.target.value as Role | "", page: 1 }))
            }
          >
            <option value="">
              {isSuperAdmin ? "All Roles" : "All Visible Roles"}
            </option>
            {visibleRoles.map(r => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </Select>

          {/* Ban status filter — visible to all admins */}
          <Select
            className="w-37.5"
            value={filters.isBanned === true ? "true" : filters.isBanned === false ? "false" : ""}
            onChange={e => {
              const v = e.target.value;
              setFilters(f => ({
                ...f,
                isBanned: v === "true" ? true : v === "false" ? false : "",
                page: 1,
              }));
            }}
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Banned</option>
          </Select>

          <Btn size="sm" onClick={runSearch}>Search</Btn>

          <span className="ml-auto text-xs text-zinc-600">
            {pagination ? `${pagination.total.toLocaleString()} users` : ""}
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : users.length === 0 ? (
          <Empty message="No users found" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Created By</Th>
                <Th>Stats</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isSelf      = u._id === me?._id;
                const userCanBan  = isAdmin && canBan(myRole, u.role, isSelf);
                const userCanRole = isSuperAdmin && !isSelf;

                return (
                  <tr
                    key={u._id}
                    className={`hover:bg-zinc-800/30 transition-colors ${u.isBanned ? "opacity-60" : ""}`}
                  >
                    {/* User cell */}
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} src={u.avatar?.url} size={32} />
                        <div>
                          <p className="text-zinc-100 text-[13.5px] font-medium leading-tight">
                            {u.name}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] text-zinc-500">(you)</span>
                            )}
                          </p>
                          <p className="text-zinc-600 text-[11px]">{u.email}</p>
                          {u.isBanned && u.banReason && (
                            <p className="text-[10px] text-red-400 mt-0.5 max-w-45 truncate">
                              {u.banReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </Td>

                    {/* Role */}
                    <Td>
                      <Badge color={u.role}>{ROLE_LABEL[u.role]}</Badge>
                    </Td>

                    {/* Status */}
                    <Td>
                      <div className="space-y-1">
                        <Badge color={u.isBanned ? "banned" : "active"}>
                          {u.isBanned ? "Banned" : "Active"}
                        </Badge>
                        {!u.isVerified && (
                          <Badge color="warning">Unverified</Badge>
                        )}
                      </div>
                    </Td>

                    {/* Created by */}
                    <Td className="text-zinc-500 text-xs">
                      {typeof u.createdBy === "object" && u.createdBy
                        ? u.createdBy.name
                        : "Self-registered"}
                    </Td>

                    {/* Stats */}
                    <Td>
                      <div className="text-[11px] text-zinc-500 space-y-0.5">
                        <div>{u.stats?.totalArticles ?? 0} articles</div>
                        <div>{u.stats?.totalBlogs ?? 0} blogs</div>
                        <div>{(u.stats?.totalViews ?? 0).toLocaleString()} views</div>
                      </div>
                    </Td>

                    {/* Dates */}
                    <Td className="text-zinc-500 text-xs whitespace-nowrap">
                      {formatDate(u.createdAt)}
                      <br />
                      <span className="text-zinc-700">
                        {u.lastLogin ? `Last: ${timeAgo(u.lastLogin)}` : "Never logged in"}
                      </span>
                      <br />
                      <span className="text-zinc-700">
                        {u.loginCount} login{u.loginCount !== 1 ? "s" : ""}
                      </span>
                    </Td>

                    {/* Actions */}
                    <Td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Change role — super_admin only, never self */}
                        {userCanRole && (
                          <Btn size="xs" onClick={() => openRole(u)}>
                            <Shield size={11} /> Role
                          </Btn>
                        )}

                        {/* Ban / Unban — gated by canBan() */}
                        {userCanBan && (
                          u.isBanned ? (
                            <Btn
                              size="xs"
                              variant="success"
                              onClick={() => handleUnban(u)}
                              loading={unbanMut.isPending}
                            >
                              <RotateCcw size={11} /> Unban
                            </Btn>
                          ) : (
                            <Btn size="xs" variant="danger" onClick={() => openBan(u)}>
                              <Ban size={11} /> Ban
                            </Btn>
                          )
                        )}

                        {/* Explicit dash when no actions are available */}
                        {!userCanRole && !userCanBan && (
                          <span className="text-[11px] text-zinc-700">—</span>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}

        {/* Pagination */}
        {pagination && (
          <Pagination
            page={pagination.page}
            total={pagination.total}
            limit={pagination.limit}
            onChange={p => setFilters(f => ({ ...f, page: p }))}
          />
        )}
      </Card>

      {/* ── Invite Modal ────────────────────────────────────────────────────── */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Team Member"
        footer={
          <>
            <Btn onClick={() => setInviteOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleInvite} loading={inviteMut.isPending}>
              Send Invite
            </Btn>
          </>
        }
      >
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/60">
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            {isSuperAdmin
              ? "As Super Admin you can invite Admins and Writers."
              : "As Admin you can invite Writers only."}
          </p>
        </div>

        <FormGroup label="Full Name">
          <Input
            value={inviteForm.name}
            onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
            placeholder="John Adeyemi"
          />
        </FormGroup>

        <FormGroup label="Email Address">
          <Input
            type="email"
            value={inviteForm.email}
            onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
            placeholder="admin@yourdomain.com"
          />
        </FormGroup>

        <FormGroup label="Role">
          <Select
            value={inviteForm.role}
            onChange={e =>
              setInviteForm(f => ({ ...f, role: e.target.value as "admin" | "writer" }))
            }
          >
            {creatableRoles.map(r => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </Select>
        </FormGroup>

        <p className="text-xs text-zinc-600 mt-3">
          An invite email will be sent with a secure link to verify their email and set a password.
        </p>
      </Modal>

      {/* ── Ban Modal ────────────────────────────────────────────────────────── */}
      <Modal
        open={banOpen}
        onClose={() => setBanOpen(false)}
        title={`Ban ${selected?.name ?? "User"}`}
        footer={
          <>
            <Btn onClick={() => setBanOpen(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleBan} loading={banMut.isPending}>
              Confirm Ban
            </Btn>
          </>
        }
      >
        <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-800/60 rounded-lg border border-zinc-700">
          <Avatar name={selected?.name ?? ""} src={selected?.avatar?.url} size={36} />
          <div>
            <p className="text-zinc-100 text-sm font-medium">{selected?.name}</p>
            <p className="text-zinc-500 text-xs">{selected?.email}</p>
          </div>
        </div>

        <p className="text-sm text-zinc-400 mb-4">
          This will immediately prevent{" "}
          <strong className="text-zinc-200">{selected?.name}</strong> from
          accessing their account. They will be notified.
        </p>

        <FormGroup label="Ban Reason (required)">
          <Input
            value={banReason}
            onChange={e => setBanReason(e.target.value)}
            placeholder="e.g. Posting harmful content"
            onKeyDown={e => e.key === "Enter" && handleBan()}
          />
        </FormGroup>
      </Modal>

      {/* ── Change Role Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title={`Change Role — ${selected?.name ?? ""}`}
        footer={
          <>
            <Btn onClick={() => setRoleOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleRoleChange} loading={roleMut.isPending}>
              Save Role
            </Btn>
          </>
        }
      >
        <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-800/60 rounded-lg border border-zinc-700">
          <Avatar name={selected?.name ?? ""} src={selected?.avatar?.url} size={36} />
          <div>
            <p className="text-zinc-100 text-sm font-medium">{selected?.name}</p>
            <p className="text-zinc-500 text-xs">{selected?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-zinc-400">Current role:</span>
          {selected && (
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ROLE_COLOR[selected.role]}`}>
              {ROLE_LABEL[selected.role]}
            </span>
          )}
        </div>

        <FormGroup label="New Role">
          <Select
            value={newRole}
            onChange={e => setNewRole(e.target.value as Role)}
          >
            {/* super_admin can only be set via DB — never offered in the UI */}
            {(["admin", "writer", "user"] as Role[]).map(r => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </Select>
        </FormGroup>

        <p className="text-xs text-zinc-600 mt-2">
          The user will be notified of their new role.
        </p>
      </Modal>
    </Layout>
  );
}