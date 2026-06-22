// ─────────────────────────────────────────────────────────────────────────────
// ENUMS & UNIONS
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "super_admin" | "manager" | "admin" | "writer";


export type ArticleStatus = "draft" | "scheduled" | "published" | "archived";

// FIX: BlogStatus was accidentally removed from types.ts
export type BlogStatus = "pending" | "approved" | "rejected" | "archived";

export type CommentStatus = "pending" | "approved" | "rejected" | "spam";

export type NotificationType =
  | "new_article"
  | "new_blog"
  | "new_comment"
  | "new_follower"
  | "comment_reply"
  | "breaking_news"
  | "newsletter"
  // | "blog_approved"
  // | "blog_rejected";

export type ActivityAction =
  | "login" | "logout" | "register" | "password_reset" | "email_verify"
  | "token_refresh" | "failed_login"
  | "article_create" | "article_update" | "article_delete" | "article_publish" | "article_schedule"
  | "blog_create" | "blog_update" | "blog_delete" | "blog_approve" | "blog_reject"
  | "comment_create" | "comment_edit" | "comment_delete" | "comment_report"
  | "user_follow" | "user_unfollow"
  | "media_upload" | "media_delete"
  | "user_create" | "user_ban" | "user_unban" | "user_role_change" | "user_invite"
  | "category_create" | "category_update" | "category_delete"
  | "rate_limit_hit" | "injection_attempt" | "forbidden_access";

export type ActivitySeverity = "info" | "warning" | "critical";

// ─────────────────────────────────────────────────────────────────────────────
// BASE
// ─────────────────────────────────────────────────────────────────────────────

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface MongoId {
  _id: string;
}

export type BaseEntity = MongoId & Timestamps;

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA
// ─────────────────────────────────────────────────────────────────────────────

export interface MediaFile {
  url:      string;
  fileId?:  string;
  fileType?: "image" | "video";
  caption?: string;
  alt?:     string;
  width?:   number;
  height?:  number;
  size?:    number;
}

export interface Avatar {
  url:     string;
  fileId?: string;
}


// IMAGE UPLOAD 
export interface UploadedImage {
  url:           string;
  fileId:        string;
  thumbnailUrl?: string;
  width?:        number;
  height?:       number;
}

export interface ImageKitAuthResponse {
  token:       string;
  expire:      number;
  signature:   string;
  publicKey:   string;
  urlEndpoint: string;
}

export interface UseImageUploadOptions {
  folder?:    string;
  maxSizeMB?: number;
  onSuccess?: (image: UploadedImage) => void;
  onError?:   (error: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────

export interface UserStats {
  totalArticles:  number;
  totalBlogs:     number;
  totalViews:     number;
  totalComments:  number;
  totalFollowers: number;
}

export interface SocialLinks {
  twitter?:   string;
  facebook?:  string;
  instagram?: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role:  Role;
  partnerCompany: string;
  inviteManagement?: string;
  avatar?:  Avatar;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  isBanned:  boolean;
  banReason?:  string;
  createdBy?: UserRef | null;
  followersCount: number;
  followingCount:   number;
  stats:  UserStats;
  newsletterSubscribed: boolean;
  socialLinks?:  SocialLinks;
  lastLogin?:  string;
  loginCount:number;
}

/** Lightweight user reference used inside populated documents */
export interface UserRef {
  _id: string;
  name: string;
  avatar?: Avatar;
  role?:  Role;
  bio?: string;
  followersCount?: number;
  stats?:  Partial<UserStats>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY & TAG
// ─────────────────────────────────────────────────────────────────────────────

export interface Category extends BaseEntity {
  name:  string;
  slug: string;
  description?: string;
  color: string;
  isActive: boolean;
  order: number;
  createdBy?:   UserRef;
}

export interface CategoryRef {
  _id: string;
  name:string;
  slug: string;
  color: string;
}
export interface CategoryPayload {
  name:  string;
  description: string;
  color: string;
  order: number;
}
export interface Tag extends BaseEntity {
  name:  string;
  slug: string;
  usageCount: number;
  createdBy?: UserRef;
}

export interface TagRef {
  _id:  string;
  name: string;
  slug: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO
// ─────────────────────────────────────────────────────────────────────────────

export interface ArticleSEO {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?:  string;
  noIndex?:  boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE
// ─────────────────────────────────────────────────────────────────────────────

export interface Article extends BaseEntity {
  title:  string;
  slug:    string;
  content:  string;
  contentDelta?: Record<string, unknown>;
  excerpt?:   string;
  category:   CategoryRef;
  tags:  TagRef[];
  featuredImage?:    MediaFile;
  gallery:  MediaFile[];
  author:  UserRef;
  coAuthors:  UserRef[];
  status: ArticleStatus;
  scheduledAt?: string;
  publishedAt?: string;
  isBreaking:  boolean;
  breakingExpiresAt?: string;
  seo?:  ArticleSEO;
  views:   number;
  readTime:  number;
  likes:    number;
  reactions: Record<string, number>;
  isFeatured:   boolean;
  isPinned:   boolean;
  allowComments:     boolean;
  isDeleted:   boolean;
  deletedAt?:   string;
  deletedBy?:  UserRef;
}

export interface ArticleListItem extends Omit<Article, "content" | "contentDelta"> {}

// Form payloads
export interface CreateArticlePayload {
  title:              string;
  content:            string;
  excerpt?:           string;
  category:           string;
  tags?:              string[];
  status?:            ArticleStatus;
  scheduledAt?:       string;
  isBreaking?:        boolean;
  breakingExpiresAt?: string;
  allowComments?:     boolean;
  isFeatured?:        boolean;
  isPinned?:          boolean;
  seo?:               ArticleSEO;
}

export type UpdateArticlePayload = Partial<CreateArticlePayload>;

// ─────────────────────────────────────────────────────────────────────────────
// BLOG (user-generated)
// ─────────────────────────────────────────────────────────────────────────────

export interface Blog extends BaseEntity {
  title:           string;
  slug:            string;
  content:         string;
  excerpt?:        string;
  author:          UserRef;
  tags:            string[];
  featuredImage?:  { url: string; fileId?: string };
  // FIX: status field was accidentally dropped
  status:          BlogStatus;
  moderatedBy?:    UserRef;
  moderatedAt?:    string;
  moderationNote?: string;
  views:           number;
  likes:           number;
  readTime:        number;
  allowComments:   boolean;
  isDeleted:       boolean;
}

export interface ModerateBlogPayload {
  status:           "approved" | "rejected";
  moderationNote?:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface CommentReport {
  reportedBy: UserRef;
  reason?:    string;
  at:         string;
}

export interface Comment extends BaseEntity {
  article?:        { _id: string; title: string; slug: string } | null;
  blog?:           { _id: string; title: string; slug: string } | null;
  author:          UserRef;
  parent?:         string | null;
  body:            string;
  status:          CommentStatus;
  moderatedBy?:    UserRef;
  moderatedAt?:    string;
  moderationNote?: string;
  likes:           number;
  reports:         CommentReport[];
  isDeleted:       boolean;
  deletedAt?:      string;
  editedAt?:       string;
  isEdited:        boolean;
  replies?:        Comment[];
}

export interface ModerateCommentPayload {
  status:           "approved" | "rejected" | "spam";
  moderationNote?:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export interface Notification extends BaseEntity {
  recipient: string;
  sender?:   UserRef | null;
  type:      NotificationType;
  title:     string;
  body?:     string;
  link?:     string;
  article?:  ArticleListItem | null;
  blog?:     Blog | null;
  comment?:  Comment | null;
  isRead:    boolean;
  readAt?:   string;
}

// ─────────────────────────────────────────────────────────────────────────────
// NEWSLETTER
// ─────────────────────────────────────────────────────────────────────────────

export interface NewsletterSubscriber extends BaseEntity {
  email:            string;
  name?:            string;
  isActive:         boolean;
  confirmedAt?:     string;
  unsubscribedAt?:  string;
  unsubscribeToken: string;
  source:           string;
}

export interface SendNewsletterPayload {
  subject:    string;
  html:       string;
  pushTitle?: string;
  pushBody?:  string;
  articleUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUSH SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────

export interface PushSubscription extends BaseEntity {
  user?:      string | null;
  endpoint:   string;
  keys:       { p256dh: string; auth: string };
  userAgent?: string;
  isActive:   boolean;
}

export interface PushBroadcastPayload {
  title: string;
  body:  string;
  url?:  string;
}

export interface PushBroadcastResult {
  sent:    number;
  expired: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOG
// ─────────────────────────────────────────────────────────────────────────────

export interface ActivityLog extends BaseEntity {
  user?:         UserRef | null;
  action:        ActivityAction;
  ip?:           string;
  userAgent?:    string;
  resource?:     string;
  resourceType?: string;
  meta?:         Record<string, unknown>;
  severity:      ActivitySeverity;
  isSuspicious:  boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export interface WriterOverview {
  scope:      "writer";
  articles:   { total: number; published: number; draft: number };
  totalViews: number;
}



export interface AdminOverview {
  scope:      "admin";
  writers:    number;
  articles:   { total: number; published: number };
  totalViews: number;
}

export interface SuperAdminOverview {
  scope:      "super_admin";
  articles:   { total: number; published: number };
  blogs:      { total: number; pending: number };
  users:      { total: number; newThisMonth: number };
  comments:   { total: number; pending: number };
  newsletter: { subscribers: number };
  security:   { suspiciousLast30Days: number };
  totalViews: number;
}

export interface ManagerOverview {
  scope:      "manager";
  articles:   { total: number; published: number };
  blogs:      { total: number; pending: number };
  users:      { total: number; newThisMonth: number };
  comments:   { total: number; pending: number };
  newsletter: { subscribers: number };
  security:   { suspiciousLast30Days: number };
  totalViews: number;
}

// export type AnalyticsOverview = WriterOverview | AdminOverview | SuperAdminOverview;
export type AnalyticsOverview = WriterOverview | AdminOverview | SuperAdminOverview | ManagerOverview;

export interface ArticlesByDayItem {
  _id:   string; // "YYYY-MM-DD"
  count: number;
  views: number;
}

export interface AdminBlogFilters {
  page:   number;
  search: string;
}

export interface UsersByRoleItem {
  _id:   Role;
  count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data:    T;
}


export interface Pagination  {
  page: number;
  limit: number;
  total: number;
  pages: number;         
  hasNext?: boolean;
  hasPrev?: boolean;
};

// FIX: PaginatedResponse used a hardcoded `articles` key, making it unusable
// for users, blogs, comments, etc. Now generic with a configurable key.
// For backwards-compat, ArticlePaginatedResponse keeps the `articles` key.
export interface PaginatedResponse<T> {
  items:      T[];
  pagination: Pagination;
}

// Article list endpoint specifically returns `articles`, not `items`
export interface ArticlePaginatedResponse {
  articles:   ArticleListItem[];
  pagination: Pagination;
}


// Optional: More flexible version
export interface GenericPaginatedResponse<T> {
  [key: string]: T[] | Pagination;
}
// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  name:            string;
  email:           string;
  password:        string;
  confirmPassword: string;
}

export interface LoginResponse {
  accessToken: string;
  user:        User;
}

export interface InviteUserPayload {
  name?:  string;
  email:  string;
  // FIX: "user" and "super_admin" cannot be invited — only admin and writer
  role:   "admin" | "writer";
}


export interface InviteManagerPayload {
  name:             string;
  email:            string;
  inviteManagement: string;
  [key: string]: unknown;   // ← satisfies Record<string, unknown>
}

export interface BanUserPayload {
  reason: string;
}

export interface ChangeRolePayload {
  role: Role;
}

// ImageKit Auth Response
export interface ImageKitAuthResponse {
  publicKey:   string;
  urlEndpoint: string;
  token:       string;
  expire:      number;
  signature:   string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
}

export interface TableColumn<T> {
  key:     keyof T | string;
  label:   string;
  render?: (row: T) => React.ReactNode;
  width?:  string;
}

export interface SidebarNavItem {
  to:     string;
  label:  string;
  icon:   React.ElementType;
  roles:  Role[];
  badge?: number;
  exact?: boolean;
}

export interface SidebarNavSection {
  section: true;
  label:   string;
}

export type SidebarNavEntry = SidebarNavItem | SidebarNavSection;

// ─────────────────────────────────────────────────────────────────────────────
// QUERY PARAMS
// ─────────────────────────────────────────────────────────────────────────────

export interface ArticleFilters {
  page?:       number;
  limit?:      number;
  status?:     ArticleStatus | "";
  category?:   string;
  author?:     string;
  search?:     string;
  sort?:       string;
  isBreaking?: boolean;
}


export interface UserFilters {
  page?: number; 
  limit?: number;
  search?: string;
  role?: Role | "";
  isBanned?: boolean | "";
};

export interface BlogFilters {
  page?:   number;
  limit?:  number;
  // FIX: status filter was missing from BlogFilters
  status?: BlogStatus | "";
}

export interface ActivityFilters {
  page?:         number;
  limit?:        number;
  severity?:     ActivitySeverity | "";
  isSuspicious?: boolean | "";
  action?:       ActivityAction | "";
}