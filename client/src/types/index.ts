export type Role =  "writer" | "user";

export type ToastType = "success" | "error" | "warning" | "info";
export type ToastPosition =
  | "top-right" | "top-left" | "top-center"
  | "bottom-right" | "bottom-left" | "bottom-center";

export interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  position?: ToastPosition;
}

export interface ToastItem extends Required<ToastOptions> {
  id: string;
}


export type ContactTopic = "general" | "editorial" | "bug" | "partnership" | "press" | "other";
export type ContactStatus = "unread" | "read" | "replied" | "archived";

export interface ContactReply {
  body: string;
  repliedBy: User;
  repliedAt: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  topic: ContactTopic;
  status: ContactStatus;
  reply: ContactReply | null;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: { url: string; fileId?: string };
  bio?: string;
  socialLinks?: { twitter?: string; facebook?: string; instagram?: string };
  stats?: {
    totalArticles: number;
    totalBlogs: number;
    totalViews: number;
    totalFollowers: number;
    totalLikes: number;
    
  };
  followersCount?: number;
  followingCount?: number;
  isVerified?: boolean;
  newsletterSubscribed?: boolean;
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  isActive: boolean;
  order: number;
}

export type ArticleStatus = "draft" | "scheduled" | "published" | "archived";

export interface MediaItem {
  url: string;
  fileId?: string;
  fileType?: "image" | "video";
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
}
// IMAGE UPLOAD 
export interface UploadedImage {
  url: string;
  fileId: string;
  thumbnailUrl?: string;
  width?:  number;
  height?: number;
}

export interface ImageKitAuthResponse {
  token:  string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export interface UseImageUploadOptions {
  folder?: string;
  maxSizeMB?: number;
  onSuccess?: (image: UploadedImage) => void;
  onError?: (error: string) => void;
}

export interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: Category;
  tags?: Array<{ _id: string; name: string; slug: string }>;
  featuredImage?: MediaItem;
  gallery?: MediaItem[];
  author: User;
  status: ArticleStatus;
  publishedAt?: string;
  scheduledAt?: string;
  isBreaking: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  allowComments: boolean;
  views: number;
  likes: number;
  readTime: number;
  reactions?: Record<string, number>;
  isLiked?: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: MediaItem;
  category: Category;
  author: User;
  status: ArticleStatus;
  publishedAt?: string;
  isBreaking: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  views: number;
  likes: number;
  isLiked?: boolean;
  readTime: number;
  createdAt: string;
}

export interface ArticlePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ArticlesResponse {
  articles: ArticleListItem[];
  pagination: ArticlePagination;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author: User;
  tags?: string[];
  featuredImage?: { url: string; fileId?: string };
  views: number;
  likes: number;
  isLiked?: boolean;
  readTime: number;
  allowComments: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CommentStatus = "pending" | "approved" | "rejected" | "spam";

export interface Comment {
  _id: string;
  author: User;
  body: string;
  parent?: string | null;
  status: CommentStatus;
  likes: number;
  isLiked?: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  reports?: Array<{ reportedBy: string; reason: string }>;
  replies?: Comment[];
  article?: string;
  blog?: string;
  createdAt: string;
  editedAt?: string;
}

export type NotificationType =
  | "new_article" | "new_blog" | "new_comment"
  | "new_follower" | "comment_reply" | "breaking_news" | "newsletter";

export interface Notification {
  _id: string;
  recipient: string;
  sender?: User;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  article?: { _id: string; title: string; slug: string };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ArticleFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  sort?: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
  author?: string;
}

export interface BlogFilters {
  page?: number;
  limit?: number;
  search?: string;
  author?: string;
}
