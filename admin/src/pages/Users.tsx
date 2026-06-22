import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  useAdminUsers,
  useInviteUser,
  useInviteManager,
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
import {
  UserPlus, Shield, Ban, RotateCcw, ChevronRight, Building2, BriefcaseBusiness,
} from "lucide-react";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CREATABLE_ROLES: Record<string, ("admin" | "writer" | "manager")[]> = {
  super_admin: ["admin", "writer", "manager"],
  admin:       ["writer"],
};

const VISIBLE_ROLES: Record<string, Role[]> = {
  super_admin: ["super_admin", "admin", "manager", "writer", "user"],
  admin:       ["writer", "user"],
};

const BANNABLE_ROLES: Record<string, Role[]> = {
  super_admin: ["admin", "manager", "writer", "user"],
  admin:       ["writer", "user"],
};

// Human-readable labels for manager scope values
const SCOPE_LABEL: Record<string, string> = {
  content_manager:    "Content Manager",
  community_manager:  "Community Manager",
  operations_manager: "Operations Manager",
  editorial_manager:  "Editorial Manager",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface InviteFormState {
  name:           string;
  email:          string;
  partnerCompany: string;
  role:           "admin" | "writer";
}

interface ManagerInviteFormState {
  name:             string;
  email:            string;
  inviteManagement: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

  const visibleRoles: Role[]                         = VISIBLE_ROLES[myRole] ?? [];
  const creatableRoles: ("admin" | "writer" | "manager")[] =
    me ? (CREATABLE_ROLES[me.role] ?? []) : [];

  // Only super_admin can invite managers
  const canInviteManager = isSuperAdmin;

  // ── Filters ───────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<UserFilters>({
    page: 1, limit: 20, role: "", search: "",
  });
  const [search, setSearch] = useState("");

  // ── Modal state ───────────────────────────────────────────────────────────
  const [inviteOpen,        setInviteOpen]        = useState(false);
  const [managerInviteOpen, setManagerInviteOpen] = useState(false);
  const [roleOpen,          setRoleOpen]          = useState(false);
  const [banOpen,           setBanOpen]           = useState(false);
  const [selected,          setSelected]          = useState<User | null>(null);

  const [inviteForm, setInviteForm] = useState<InviteFormState>({
    name: "", email: "", partnerCompany: "", role: "writer",
  });
  const [managerForm, setManagerForm] = useState<ManagerInviteFormState>({
    name: "", email: "", inviteManagement: "",
  });
  const [banReason, setBanReason] = useState("");
  const [newRole,   setNewRole]   = useState<Role>("writer");

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useAdminUsers(filters);
  const users      = data?.users ?? [];
  const pagination = data?.pagination;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const inviteMut        = useInviteUser();
  const managerInviteMut = useInviteManager();
  const banMut           = useBanUser();
  const unbanMut         = useUnbanUser();
  const roleMut          = useChangeRole();

  // ── Derived ───────────────────────────────────────────────────────────────
  // Only admin invites require partnerCompany — writers inherit it
  const inviteNeedsCompany = inviteForm.role === "admin";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const runSearch = () => setFilters((f) => ({ ...f, search, page: 1 }));

  const openInvite = () => {
    setInviteForm({ name: "", email: "", partnerCompany: "", role: "writer" });
    setInviteOpen(true);
  };

  const openManagerInvite = () => {
    setManagerForm({ name: "", email: "", inviteManagement: "" });
    setManagerInviteOpen(true);
  };

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (inviteNeedsCompany && !inviteForm.partnerCompany.trim()) {
      toast.error("Partner company name is required when inviting an admin.");
      return;
    }
    const payload = {
      name:  inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      role:  inviteForm.role,
      ...(inviteNeedsCompany && {
        partnerCompany: inviteForm.partnerCompany.trim(),
      }),
    };
    await inviteMut.mutateAsync(payload);
    setInviteOpen(false);
    setInviteForm({ name: "", email: "", partnerCompany: "", role: "writer" });
  };

  const handleManagerInvite = async () => {
    if (!managerForm.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!managerForm.email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!managerForm.inviteManagement) {
      toast.error("Management scope is required.");
      return;
    }
    await managerInviteMut.mutateAsync({
      name: managerForm.name.trim(),
      email: managerForm.email.trim(),
      inviteManagement: managerForm.inviteManagement,
    });
    setManagerInviteOpen(false);
    setManagerForm({ name: "", email: "", inviteManagement: "" });
  };

  const handleBan = async () => {
    if (!selected) return;
    if (!banReason.trim()) {
      toast.error("Ban reason is required.");
      return;
    }
    await banMut.mutateAsync({
      id:      selected._id,
      payload: { reason: banReason },
    });
    setBanOpen(false);
    setBanReason("");
    setSelected(null);
  };

  const handleUnban  = (u: User) => unbanMut.mutate(u._id);

  const handleRoleChange = async () => {
    if (!selected) return;
    await roleMut.mutateAsync({ id: selected._id, payload: { role: newRole } });
    setRoleOpen(false);
    setSelected(null);
  };

  const openBan  = (u: User) => { setSelected(u); setBanReason(""); setBanOpen(true); };
  const openRole = (u: User) => { setSelected(u); setNewRole(u.role); setRoleOpen(true); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Layout
      title="Users & Roles"
      action={
        <div className="flex items-center gap-2">
          {/* Invite Manager — super_admin only */}
          {canInviteManager && (
            <Btn variant="secondary" size="sm" onClick={openManagerInvite}>
              <Shield size={14} /> Invite Manager
            </Btn>
          )}
          {/* Invite User — admin or super_admin */}
          {creatableRoles.filter((r) => r !== "manager").length > 0 && (
            <Btn variant="primary" size="sm" onClick={openInvite}>
              <UserPlus size={14} /> Invite User
            </Btn>
          )}
        </div>
      }
    >
      {/* ── Role hierarchy strip ─────────────────────────────────────────── */}
      <div className="mb-5 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-2">
          Role Hierarchy
        </p>
        <div className="flex items-center gap-2 text-sm text-zinc-400 flex-wrap">
          {(
            ["super_admin", "admin", "manager", "writer", "user"] as Role[]
          ).map((r, i, arr) => (
            <span key={r} className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${ROLE_COLOR[r]}`}
              >
                {ROLE_LABEL[r]}
              </span>
              {i < arr.length - 1 && (
                <ChevronRight size={13} className="text-zinc-700" />
              )}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-zinc-600 mt-2">
          {isSuperAdmin
            ? "Super Admin can invite Admins, Managers & Writers, change any role, and ban any non-super_admin."
            : "Admin can view Writers & Users, invite Writers, and ban Writers & Users."}
        </p>
      </div>

      {/* ── Main card ────────────────────────────────────────────────────── */}
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Input
            className="max-w-55"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />

          <Select
            className="w-37.5"
            value={filters.role ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                role:  e.target.value as Role | "",
                page: 1,
              }))
            }
          >
            <option value="">
              {isSuperAdmin ? "All Roles" : "All Visible Roles"}
            </option>
            {visibleRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>

          <Select
            className="w-37.5"
            value={
              filters.isBanned === true
                ? "true"
                : filters.isBanned === false
                ? "false"
                : ""
            }
            onChange={(e) => {
              const v = e.target.value;
              setFilters((f) => ({
                ...f,
                isBanned:
                  v === "true" ? true : v === "false" ? false : "",
                page: 1,
              }));
            }}
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Banned</option>
          </Select>

          <Btn size="sm" onClick={runSearch}>
            Search
          </Btn>

          <span className="ml-auto text-xs text-zinc-600">
            {pagination
              ? `${pagination.total.toLocaleString()} users`
              : ""}
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <Empty message="No users found" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Partner Company</Th>
                <Th>Management Scope</Th>
                <Th>Status</Th>
                <Th>Created By</Th>
                <Th>Stats</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf      = u._id === me?._id;
                const userCanBan  = isAdmin && canBan(myRole, u.role, isSelf);
                const userCanRole = isSuperAdmin && !isSelf;
                const isManager   = u.role === "manager";

                return (
                  <tr
                    key={u._id}
                    className={`hover:bg-zinc-800/30 transition-colors ${
                      u.isBanned ? "opacity-60" : ""
                    }`}
                  >
                    {/* User */}
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={u.name}
                          src={u.avatar?.url}
                          size={32}
                        />
                        <div>
                          <p className="text-zinc-100 text-[13.5px] font-medium leading-tight">
                            {u.name}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] text-zinc-500">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-zinc-600 text-[11px]">
                            {u.email}
                          </p>
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

                    {/* Partner Company — admin & writer only */}
                    <Td>
                      {u.partnerCompany ? (
                        <div className="flex items-center gap-1.5">
                          <Building2
                            size={11}
                            className="text-zinc-600 shrink-0"
                          />
                          <span className="text-zinc-300 text-xs font-medium">
                            {u.partnerCompany}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </Td>

                    {/* Management Scope — manager only */}
                    <Td>
                      {isManager && u.inviteManagement ? (
                        <div className="flex items-center gap-1.5">
                          <BriefcaseBusiness
                            size={11}
                            className="text-violet-500 shrink-0"
                          />
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] font-medium whitespace-nowrap">
                            {SCOPE_LABEL[u.inviteManagement] ??
                              u.inviteManagement}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
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
                        <div>
                          {(u.stats?.totalViews ?? 0).toLocaleString()} views
                        </div>
                      </div>
                    </Td>

                    {/* Dates */}
                    <Td className="text-zinc-500 text-xs whitespace-nowrap">
                      {formatDate(u.createdAt)}
                      <br />
                      <span className="text-zinc-700">
                        {u.lastLogin
                          ? `Last: ${timeAgo(u.lastLogin)}`
                          : "Never logged in"}
                      </span>
                      <br />
                      <span className="text-zinc-700">
                        {u.loginCount} login
                        {u.loginCount !== 1 ? "s" : ""}
                      </span>
                    </Td>

                    {/* Actions */}
                    <Td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {userCanRole && (
                          <Btn size="xs" onClick={() => openRole(u)}>
                            <Shield size={11} /> Role
                          </Btn>
                        )}

                        {userCanBan &&
                          (u.isBanned ? (
                            <Btn
                              size="xs"
                              variant="success"
                              onClick={() => handleUnban(u)}
                              loading={unbanMut.isPending}
                            >
                              <RotateCcw size={11} /> Unban
                            </Btn>
                          ) : (
                            <Btn
                              size="xs"
                              variant="danger"
                              onClick={() => openBan(u)}
                            >
                              <Ban size={11} /> Ban
                            </Btn>
                          ))}

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

        {pagination && (
          <Pagination
            page={pagination.page}
            total={pagination.total}
            limit={pagination.limit}
            onChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        )}
      </Card>

      {/* ── Invite User Modal ─────────────────────────────────────────────── */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Team Member"
        footer={
          <>
            <Btn onClick={() => setInviteOpen(false)}>Cancel</Btn>
            <Btn
              variant="primary"
              onClick={handleInvite}
              loading={inviteMut.isPending}
            >
              Send Invite
            </Btn>
          </>
        }
      >
        {/* Context banner */}
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/60">
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            {isSuperAdmin
              ? "As Super Admin you can invite Admins (with their partner company) and Writers."
              : "As Admin you can invite Writers — they will automatically inherit your company name."}
          </p>
        </div>

        {/* Role selector */}
        <FormGroup label="Role">
          <Select
            value={inviteForm.role}
            onChange={(e) => {
              const role = e.target.value as "admin" | "writer";
              setInviteForm((f) => ({
                ...f,
                role,
                partnerCompany: role === "admin" ? f.partnerCompany : "",
              }));
            }}
          >
            {creatableRoles
              .filter((r) => r !== "manager")
              .map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
          </Select>
        </FormGroup>

        <FormGroup label="Full Name">
          <Input
            value={inviteForm.name}
            onChange={(e) =>
              setInviteForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="John Adeyemi"
          />
        </FormGroup>

        <FormGroup label="Email Address">
          <Input
            type="email"
            value={inviteForm.email}
            onChange={(e) =>
              setInviteForm((f) => ({ ...f, email: e.target.value }))
            }
            placeholder="admin@company.com"
          />
        </FormGroup>

        {/* Partner Company — only for admin role */}
        {inviteNeedsCompany && (
          <FormGroup label="Partner Company Name">
            <div className="relative">
              <Building2
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <Input
                className="pl-8"
                value={inviteForm.partnerCompany}
                onChange={(e) =>
                  setInviteForm((f) => ({
                    ...f,
                    partnerCompany: e.target.value,
                  }))
                }
                placeholder="e.g. Acme Media Ltd"
              />
            </div>
            <p className="text-[11px] text-zinc-600 mt-1.5">
              Writers invited by this admin will automatically carry this
              company name.
            </p>
          </FormGroup>
        )}

        {/* Writer inheritance note */}
        {!inviteNeedsCompany && me?.partnerCompany && (
          <div className="mt-1 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/40 border border-zinc-700/50">
            <Building2 size={12} className="text-zinc-500 shrink-0" />
            <p className="text-[11px] text-zinc-500">
              This writer will be assigned to{" "}
              <span className="text-zinc-300 font-medium">
                {me.partnerCompany}
              </span>{" "}
              automatically.
            </p>
          </div>
        )}

        <p className="text-xs text-zinc-600 mt-3">
          An invite email will be sent with a secure link to verify their
          email and set a password.
        </p>
      </Modal>

      {/* ── Invite Manager Modal ──────────────────────────────────────────── */}
      <Modal
        open={managerInviteOpen}
        onClose={() => setManagerInviteOpen(false)}
        title="Invite Manager"
        footer={
          <>
            <Btn onClick={() => setManagerInviteOpen(false)}>Cancel</Btn>
            <Btn
              variant="primary"
              onClick={handleManagerInvite}
              loading={managerInviteMut.isPending}
            >
              Send Invite
            </Btn>
          </>
        }
      >
        {/* Context banner */}
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-violet-500/5 border border-violet-500/20">
          <div className="flex items-start gap-2">
            <Shield size={13} className="text-violet-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Managers are platform-level roles created by Super Admin only.
              Define their management scope — this determines what area of
              the platform they oversee.
            </p>
          </div>
        </div>

        <FormGroup label="Full Name">
          <Input
            value={managerForm.name}
            onChange={(e) =>
              setManagerForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Jane Okafor"
            autoFocus
          />
        </FormGroup>

        <FormGroup label="Email Address">
          <Input
            type="email"
            value={managerForm.email}
            onChange={(e) =>
              setManagerForm((f) => ({ ...f, email: e.target.value }))
            }
            placeholder="manager@newsorbit.com"
          />
        </FormGroup>

        <FormGroup label="Management Scope">
          <div className="relative">
            <BriefcaseBusiness
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <Select
              className="pl-8"
              value={managerForm.inviteManagement}
              onChange={(e) =>
                setManagerForm((f) => ({
                  ...f,
                  inviteManagement: e.target.value,
                }))
              }
            >
              <option value="">Select a scope…</option>
              <option value="content_manager">Content Manager</option>
              <option value="community_manager">Community Manager</option>
              <option value="operations_manager">Operations Manager</option>
              <option value="editorial_manager">Editorial Manager</option>
            </Select>
          </div>
          <p className="text-[11px] text-zinc-600 mt-1.5">
            This scope defines what section of the dashboard the manager
            oversees and is shown on their profile.
          </p>
        </FormGroup>

        <p className="text-xs text-zinc-600 mt-3">
          An invite email will be sent with a secure link to verify their
          email and set a password.
        </p>
      </Modal>

      {/* ── Ban Modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={banOpen}
        onClose={() => setBanOpen(false)}
        title={`Ban ${selected?.name ?? "User"}`}
        footer={
          <>
            <Btn onClick={() => setBanOpen(false)}>Cancel</Btn>
            <Btn
              variant="danger"
              onClick={handleBan}
              loading={banMut.isPending}
            >
              Confirm Ban
            </Btn>
          </>
        }
      >
        <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-800/60 rounded-lg border border-zinc-700">
          <Avatar
            name={selected?.name ?? ""}
            src={selected?.avatar?.url}
            size={36}
          />
          <div>
            <p className="text-zinc-100 text-sm font-medium">
              {selected?.name}
            </p>
            <p className="text-zinc-500 text-xs">{selected?.email}</p>
            {selected?.partnerCompany && (
              <p className="text-zinc-600 text-[11px] flex items-center gap-1 mt-0.5">
                <Building2 size={10} /> {selected.partnerCompany}
              </p>
            )}
            {selected?.role === "manager" && selected?.inviteManagement && (
              <p className="text-violet-500 text-[11px] flex items-center gap-1 mt-0.5">
                <BriefcaseBusiness size={10} />
                {SCOPE_LABEL[selected.inviteManagement] ??
                  selected.inviteManagement}
              </p>
            )}
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
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="e.g. Violation of platform guidelines"
            onKeyDown={(e) => e.key === "Enter" && handleBan()}
          />
        </FormGroup>
      </Modal>

      {/* ── Change Role Modal ─────────────────────────────────────────────── */}
      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title={`Change Role — ${selected?.name ?? ""}`}
        footer={
          <>
            <Btn onClick={() => setRoleOpen(false)}>Cancel</Btn>
            <Btn
              variant="primary"
              onClick={handleRoleChange}
              loading={roleMut.isPending}
            >
              Save Role
            </Btn>
          </>
        }
      >
        <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-800/60 rounded-lg border border-zinc-700">
          <Avatar
            name={selected?.name ?? ""}
            src={selected?.avatar?.url}
            size={36}
          />
          <div>
            <p className="text-zinc-100 text-sm font-medium">
              {selected?.name}
            </p>
            <p className="text-zinc-500 text-xs">{selected?.email}</p>
            {selected?.partnerCompany && (
              <p className="text-zinc-600 text-[11px] flex items-center gap-1 mt-0.5">
                <Building2 size={10} /> {selected.partnerCompany}
              </p>
            )}
            {selected?.role === "manager" && selected?.inviteManagement && (
              <p className="text-violet-500 text-[11px] flex items-center gap-1 mt-0.5">
                <BriefcaseBusiness size={10} />
                {SCOPE_LABEL[selected.inviteManagement] ??
                  selected.inviteManagement}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-zinc-400">Current role:</span>
          {selected && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                ROLE_COLOR[selected.role]
              }`}
            >
              {ROLE_LABEL[selected.role]}
            </span>
          )}
        </div>

        <FormGroup label="New Role">
          <Select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            {/* super_admin is never offered in the UI — set via DB only */}
            {(["admin", "manager", "writer", "user"] as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </FormGroup>

        <p className="text-xs text-zinc-600 mt-2">
          The user will be notified of their new role by email.
        </p>
      </Modal>
    </Layout>
  );
}