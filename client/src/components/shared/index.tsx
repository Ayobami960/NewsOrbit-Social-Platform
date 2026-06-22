
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Eye, Heart } from "lucide-react";
import type { ArticleListItem, Blog, Category } from "@/types";
import { timeAgo, formatNumber, cn, categoryColor } from "@/lib/utils";

// ── Category Pill ─────────────────────────────────────────────────────────────

export function CategoryPill({
  category, size = "sm", asSpan = false,
}: {
  category: Category; size?: "xs" | "sm"; asSpan?: boolean;
}) {
  const style = categoryColor(category.color);
  const router = useRouter();
  const className = cn(
    "inline-flex items-center rounded-full border font-sans font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer",
    size === "xs" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-0.5"
  );
  if (asSpan) {
    return (
      <span role="link" tabIndex={0} className={className} style={style}
        onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/news?category=${category.slug}`); }}
        onKeyDown={e => { if (e.key === "Enter") router.push(`/news?category=${category.slug}`); }}>
        {category.name}
      </span>
    );
  }
  return (
    <Link href={`/news?category=${category.slug}`} className={className} style={style}>
      {category.name}
    </Link>
  );
}

// ── Breaking Badge ────────────────────────────────────────────────────────────

export function BreakingBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-ember-600 text-white text-[10px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      Breaking
    </span>
  );
}

// ── Author Line ───────────────────────────────────────────────────────────────
// variant="article" → /writers/[id]       (news articles, staff authors)
// variant="blog"    → /profile/user/[id]  (community blogs)
// Always uses <span> — never <a>/<Link> — safe inside any outer <Link>.

export function AuthorLine({
  author, date, 
  // readTime, 
  size = "sm", variant = "blog",
}: {
  author: { _id?: string; name: string; avatar?: { url: string } };
  date?: string;
  // readTime?: number;
  size?: "xs" | "sm";
  variant?: "article" | "blog";
}) {
  const router = useRouter();
  const hasAuthorId = !!author._id && author._id !== "undefined" && author._id !== "null";
  const href = hasAuthorId
    ? variant === "article"
      ? `/writers/${author._id}`
      : `/profile/user/${author._id}`
    : undefined;

  const handleNavigate = () => {
    if (!href) return;
    router.push(href);
  };

  return (
    <div className={cn("flex items-center gap-2", size === "xs" ? "text-[11px]" : "text-xs")}>
      <span
        role={hasAuthorId ? "link" : undefined}
        tabIndex={hasAuthorId ? 0 : undefined}
        className={cn("flex items-center gap-1.5 group", hasAuthorId ? "cursor-pointer" : "cursor-default")}
        onClick={e => {
          if (!hasAuthorId) return;
          e.preventDefault();
          e.stopPropagation();
          handleNavigate();
        }}
        onKeyDown={e => { if (hasAuthorId && e.key === "Enter") handleNavigate(); }}>
        {author.avatar?.url ? (
          <img src={author.avatar.url} alt={author.name}
            className={cn("rounded-full object-cover shrink-0", size === "xs" ? "w-4 h-4" : "w-5 h-5")} />
        ) : (
          <div className={cn(
            "rounded-full bg-ember-600/20 flex items-center justify-center text-ember-600 font-bold shrink-0",
            size === "xs" ? "w-4 h-4 text-[8px]" : "w-5 h-5 text-[9px]"
          )}>
            {author.name[0]}
          </div>
        )}
        <span className="font-sans font-medium text-ink-700 group-hover:text-ember-600 transition-colors">
          {author.name}
        </span>
      </span>
      {date && <><span className="text-ink-300">·</span><span className="text-ink-500 font-sans">{timeAgo(date)}</span></>}
      {/* {readTime && <><span className="text-ink-300">·</span><span className="flex items-center gap-1 text-ink-500 font-sans"><Clock size={10} /> {readTime}m</span></>} */}
    </div>
  );
}

// ── Article Card (Hero) ───────────────────────────────────────────────────────

export function ArticleCardHero({ article }: { article: ArticleListItem }) {
  return (
    <article className="article-card group">
      <Link href={`/articles/${article.slug}`} className="block">
        <div className="relative overflow-hidden rounded-xl aspect-video bg-ink-100 mb-4">
          {article.featuredImage?.url ? (
            <img src={article.featuredImage.url} alt={article.featuredImage.alt || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-ink-200 to-ink-300 flex items-center justify-center">
              <span className="text-ink-400 text-4xl">📰</span>
            </div>
          )}
          {article.isBreaking && <div className="absolute top-3 left-3"><BreakingBadge /></div>}
          <div className="absolute top-3 right-3"><CategoryPill category={article.category} asSpan /></div>
        </div>
        <h2 className="font-display text-2xl px-1.5 font-bold text-ink-900 mb-2 group-hover:text-ember-700 transition-colors leading-tight line-clamp-3">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="text-ink-600 px-1.5 font-body text-sm leading-relaxed mb-3 line-clamp-2">{article.excerpt}</p>
        )}
      </Link>
      <div className="p-1.5">
        <AuthorLine author={article.author} date={article.publishedAt} variant="article" />
      </div>
    </article>
  );
}

// ── Article Card (Medium / side) ──────────────────────────────────────────────

export function ArticleCardMd({ article }: { article: ArticleListItem }) {
  return (
    <article className="article-card group flex gap-4 p-1.5 rounded-3xl">
      <Link href={`/articles/${article.slug}`} className="shrink-0">
        <div className="relative overflow-hidden rounded-lg w-28 h-20 bg-ink-100">
          {article.featuredImage?.url ? (
            <img src={article.featuredImage.url} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-ink-200 to-ink-300" />
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0 ">
        <div className="flex items-center gap-2 mb-1.5">
          {article.isBreaking && <BreakingBadge />}
          <CategoryPill category={article.category} size="xs" asSpan />
        </div>
        <Link href={`/articles/${article.slug}`}>
          <h3 className="font-display text-sm font-bold text-ink-900 group-hover:text-ember-700 transition-colors line-clamp-2 leading-snug mb-1.5">
            {article.title}
          </h3>
        </Link>
        <AuthorLine author={article.author} date={article.publishedAt} size="xs" variant="article" />
      </div>
    </article>
  );
}

// ── Article Card (Grid) ───────────────────────────────────────────────────────

export function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <article className="article-card group border border-(--color-border) rounded-xl overflow-hidden bg-white">
      <Link href={`/articles/${article.slug}`} className="block">
        <div className="relative overflow-hidden aspect-16/10 bg-ink-100">
          {article.featuredImage?.url ? (
            <img src={article.featuredImage.url} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-ink-100 to-ink-200 flex items-center justify-center">
              <span className="text-ink-300 text-3xl">📰</span>
            </div>
          )}
          {article.isBreaking && <div className="absolute top-2 left-2"><BreakingBadge /></div>}
        </div>
      </Link>
      <div className="p-4">
        <div className="mb-2"><CategoryPill category={article.category} size="xs" /></div>
        <Link href={`/articles/${article.slug}`}>
          <h3 className="font-display font-bold text-ink-900 group-hover:text-ember-700 transition-colors line-clamp-3 leading-snug mb-2.5 text-[15px]">
            {article.title}
          </h3>
        </Link>
        <AuthorLine author={article.author} date={article.publishedAt}  size="xs" variant="article" />
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-(--color-border)">
          <span className="flex items-center gap-1 text-[11px] text-ink-400 font-sans"><Eye size={11} /> {formatNumber(article.views)}</span>
          <span className="flex items-center gap-1 text-[11px] text-ink-400 font-sans"><Heart size={11} /> {formatNumber(article.likes)}</span>
        </div>
      </div>
    </article>
  );
}

// ── Blog Card ─────────────────────────────────────────────────────────────────
// Image + title  → /blogs/[slug]
// Author click   → /profile/user/[id]   (variant="blog")

export function BlogCard({ blog }: { blog: Blog }) {
  return (
    <article className="article-card group border border-(--color-border) rounded-xl overflow-hidden bg-white">
      {blog.featuredImage?.url && (
        <Link href={`/blogs/${blog.slug}`} className="block">
          <div className="relative overflow-hidden aspect-video bg-ink-100">
            <img src={blog.featuredImage.url} alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        </Link>
      )}
      <div className="p-3">
        {(blog.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {(blog.tags ?? []).slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-sans font-medium text-ink-500 bg-ink-100 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <Link href={`/blogs/${blog.slug}`}>
          <h3 className="font-display font-bold text-ink-900 group-hover:text-ember-700 transition-colors line-clamp-2 leading-snug mb-2 text-[15px]">
            {blog.title}
          </h3>
        </Link>
        {blog.excerpt && (
          <p className="text-ink-500 text-xs font-body line-clamp-2 mb-3">{blog.excerpt}</p>
        )}
        <AuthorLine author={blog.author} date={blog.createdAt}  size="xs" variant="blog" />
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-(--color-border)">
          <span className="flex items-center gap-1 text-[11px] text-ink-400 font-sans"><Eye size={11} /> {formatNumber(blog.views)}</span>
          <span className="flex items-center gap-1 text-[11px] text-ink-400 font-sans"><Heart size={11} /> {formatNumber(blog.likes)}</span>
        </div>
      </div>
    </article>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function ArticleSkeleton() {
  return (
    <div className="border border-(--color-border) rounded-xl overflow-hidden bg-white">
      <div className="skeleton aspect-16/10" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

export function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-0.5 bg-ember-600 rounded-full" />
          <h2 className="font-display text-xl font-bold text-ink-900">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-ink-500 font-body">{subtitle}</p>}
      </div>
      {/* {action} */}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

export function EmptyState({ icon = "📭", title = "Nothing here yet", description, action }: {
  icon?: string; title?: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4 opacity-40">{icon}</span>
      <h3 className="font-display text-lg font-bold text-ink-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-500 font-body max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

export function Pagination({ page, pages, total, onChange }: {
  page: number; pages: number; total: number; onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}
        className="px-4 py-2 text-sm font-sans font-medium border border-(--color-border) rounded-lg text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        ← Previous
      </button>
      <span className="text-sm text-ink-500 font-sans px-2">
        {page} / {pages} <span className="text-ink-400">({total.toLocaleString()} stories)</span>
      </span>
      <button disabled={page === pages} onClick={() => onChange(page + 1)}
        className="px-4 py-2 text-sm font-sans font-medium border border-(--color-border) rounded-lg text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Next →
      </button>
    </div>
  );
}