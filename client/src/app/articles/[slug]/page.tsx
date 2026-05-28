"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CategoryPill, BreakingBadge, EmptyState } from "@/components/shared";
import { useArticle, useLikeArticle, useArticles } from "@/hooks/useArticles";
import { useArticleComments, usePostComment } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import {
  formatDate,
  timeAgo,
  getInitials,
  cn,
  formatNumber,
} from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Clock,
  Send,
  Reply,
  ArrowLeft,
} from "lucide-react";
import type { Comment } from "@/types";
import { toast } from "react-toastify";

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ArticleDetailPage() {
  const { slug }             = useParams<{ slug: string }>();
  const { user, isLoggedIn } = useAuth();

  const likeInFlight = useRef(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: article, isLoading } = useArticle(slug ?? "");
  const { data: commentData }        = useArticleComments(article?._id ?? "");

  // ── Mutations ─────────────────────────────────────────────────────────────
  // useLikeArticle owns all cache patching — no onSuccess needed here
  const likeMut    = useLikeArticle();
  const postComment = usePostComment();

  // ── Local state ───────────────────────────────────────────────────────────
  const [commentText, setCommentText] = useState("");
  const [replyTo,     setReplyTo]     = useState<string | null>(null);
  const [replyText,   setReplyText]   = useState("");

  const comments = commentData?.comments ?? [];

  // ── Handlers ──────────────────────────────────────────────────────────────

 const handleLike = () => {
  if (!isLoggedIn) { toast.error("Sign in to like articles."); return; }
  if (likeInFlight.current) return;  
  likeInFlight.current = true;
  likeMut.mutate(article!._id, {
    onSettled: () => { likeInFlight.current = false; },  // release after server responds
  });
};


  const handleShare = () => {
    if (typeof navigator === "undefined") return;
    if (navigator.share) {
      navigator.share({ title: article?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const submitComment = async () => {
    if (!isLoggedIn)          { toast.error("Sign in to comment."); return; }
    if (!commentText.trim())   return;
    await postComment.mutateAsync({ articleId: article!._id, body: commentText });
    setCommentText("");
  };

  const submitReply = async (parentId: string) => {
    if (!isLoggedIn)        { toast.error("Sign in to reply."); return; }
    if (!replyText.trim())   return;
    await postComment.mutateAsync({
      articleId: article!._id,
      body:      replyText,
      parent:    parentId,
    });
    setReplyTo(null);
    setReplyText("");
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          <div className="skeleton h-8 w-2/3 mb-4 rounded" />
          <div className="skeleton h-5 w-1/2 mb-8 rounded" />
          <div className="skeleton aspect-16/7 rounded-2xl mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="skeleton h-5 rounded"
                style={{ width: `${75 + (i % 3) * 8}%` }}
              />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <EmptyState
            icon="📄"
            title="Article not found"
            description="This story may have been removed."
          />
        </main>
        <Footer />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* Back link */}
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm font-sans text-ink-500 hover:text-ink-900 transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to News
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

            {/* ── Main column ── */}
            <article>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {article.isBreaking && <BreakingBadge />}
                <CategoryPill category={article.category} />
                {article.isPinned && (
                  <span className="text-[11px] font-sans font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                    📌 Pinned
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-950 leading-tight mb-4">
                {article.title}
              </h1>

              {/* Excerpt */}
              {article.excerpt && (
                <p className="text-ink-600 text-lg font-body italic leading-relaxed mb-6 border-l-4 border-ember-600 pl-4">
                  {article.excerpt}
                </p>
              )}

              {/* Author + meta row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-6 border-b border-(--color-border)">
                <div className="flex items-center gap-3">
                  {article.author ? (
                    <>
                      <AuthorAvatar author={article.author} size="md" />
                      <div>
                        <Link
                          href={`/writers/${article.author._id}`}
                          className="font-sans font-semibold text-ink-900 hover:text-ember-600 transition-colors text-sm block"
                        >
                          {article.author.name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-ink-500 font-sans">
                          {article.publishedAt && (
                            <span>{formatDate(article.publishedAt, "MMMM dd, yyyy")}</span>
                          )}
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {article.readTime} min read
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="font-sans font-semibold text-ink-900 text-sm block">Unknown Author</p>
                      <div className="flex items-center gap-2 text-xs text-ink-500 font-sans">
                        {article.publishedAt && (
                          <span>{formatDate(article.publishedAt, "MMMM dd, yyyy")}</span>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {article.readTime} min read
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-500 font-sans">
                  <span className="flex items-center gap-1">
                    <Eye size={13} /> {formatNumber(article.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={13} /> {formatNumber(article.likes)}
                  </span>
                </div>
              </div>

              {/* Featured image */}
              {article.featuredImage?.url && (
                <div className="mb-8 rounded-2xl overflow-hidden">
                  <img
                    src={article.featuredImage.url}
                    alt={article.featuredImage.alt || article.title}
                    className="w-full object-cover max-h-125"
                  />
                  {article.featuredImage.caption && (
                    <p className="text-xs text-ink-400 font-body italic text-center mt-2">
                      {article.featuredImage.caption}
                    </p>
                  )}
                </div>
              )}

              {/* Body HTML */}
              <div
                className="prose-article text-ink-800 font-body text-[17px] leading-[1.85]"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-(--color-border)">
                  <span className="text-xs font-sans font-semibold text-ink-500 uppercase tracking-widest">
                    Tags:
                  </span>
                  {article.tags.map((tag) => (
                    <Link
                      key={tag._id}
                      href={`/news?search=${tag.name}`}
                      className="text-xs font-sans px-3 py-1 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-700 transition-colors"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* ── Action bar ── */}
              <div className="flex items-center gap-3 mt-6 py-4 border-t border-b border-(--color-border)">

                {/* Like button — driven entirely by article.isLiked from cache */}
                <button
                  onClick={handleLike}
                  disabled={likeMut.isPending}
                  aria-label={article.isLiked ? "Unlike article" : "Like article"}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border font-sans font-semibold text-sm transition-all disabled:opacity-60",
                    article.isLiked
                      ? "bg-ember-50 border-ember-200 text-ember-700"
                      : "border-(--color-border) text-ink-600 hover:border-ink-400"
                  )}
                >
                  <Heart
                    size={15}
                    fill={article.isLiked ? "currentColor" : "none"}
                    className={
                      article.isLiked ? "text-ember-600" : "text-ink-400"
                    }
                  />
                  {formatNumber(article.likes)}
                </button>

                {/* Scroll to comments */}
                <button
                  onClick={() =>
                    document
                      .getElementById("comments")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-(--color-border) text-ink-600 hover:border-ink-400 font-sans font-semibold text-sm transition-all"
                >
                  <MessageCircle size={15} /> {comments.length}
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-(--color-border) text-ink-600 hover:border-ink-400 font-sans font-semibold text-sm transition-all"
                >
                  <Share2 size={15} /> Share
                </button>
              </div>

              {/* Author bio card */}
              <div className="mt-8 p-5 bg-ink-50 rounded-2xl border border-(--color-border)">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <AuthorAvatar author={article.author} size="md" />
                    <div>
                      <p className="text-[11px] font-sans font-bold uppercase tracking-widest text-ink-400 mb-1">
                        Written by
                      </p>
                      <Link
                        href={`/writers/${article.author._id}`}
                        className="font-display font-bold text-lg text-ink-900 hover:text-ember-600 transition-colors"
                      >
                        {article.author.name}
                      </Link>
                      {article.author.bio && (
                        <p className="text-sm text-ink-600 font-body mt-1">
                          {article.author.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/writers/${article.author._id}`}
                    className="inline-block mt-3 px-4 py-1.5 bg-ember-600 hover:bg-ember-700 text-white text-xs font-sans font-semibold rounded-lg transition-colors"
                  >
                    View all →
                  </Link>
                </div>
              </div>

              {/* ── Comments section ── */}
              {article.allowComments && (
                <section id="comments" className="mt-12">
                  <h2 className="font-display text-2xl font-bold text-ink-900 mb-6">
                    Comments ({comments.length})
                  </h2>

                  {/* Comment input */}
                  {isLoggedIn ? (
                    <div className="flex gap-3 mb-8">
                      <div className="w-9 h-9 rounded-full bg-ember-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {getInitials(user?.name ?? "")}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Share your thoughts…"
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-(--color-border) bg-white text-ink-900 font-body text-sm outline-none focus:ring-2 focus:ring-ember-600/25 focus:border-ember-600 resize-none transition-all"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={submitComment}
                            disabled={!commentText.trim() || postComment.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Send size={13} /> Post Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-8 p-4 bg-ink-50 rounded-xl border border-(--color-border) text-center">
                      <p className="text-sm text-ink-600 font-body mb-3">
                        Sign in to join the conversation
                      </p>
                      <Link
                        href="/login"
                        className="px-5 py-2 bg-ember-600 hover:bg-ember-700 text-white text-sm font-sans font-semibold rounded-lg transition-colors"
                      >
                        Sign In
                      </Link>
                    </div>
                  )}

                  {/* Comment list */}
                  <div className="space-y-6">
                    {comments.length === 0 ? (
                      <p className="text-ink-400 font-body text-sm text-center py-8">
                        Be the first to comment.
                      </p>
                    ) : (
                      comments.map((c) => (
                        <CommentThread
                          key={c._id}
                          comment={c}
                          replyTo={replyTo}
                          replyText={replyText}
                          isLoggedIn={isLoggedIn}
                          onSetReply={setReplyTo}
                          onReplyTextChange={setReplyText}
                          onSubmitReply={submitReply}
                          isPending={postComment.isPending}
                        />
                      ))
                    )}
                  </div>
                </section>
              )}
            </article>

            {/* ── Sidebar ── */}
            <aside>
              <div className="sticky top-20 space-y-5">

                {/* Writer card */}
                <div className="border border-(--color-border) rounded-xl p-4 bg-white">
                  <p className="text-[11px] font-sans font-bold uppercase tracking-widest text-ink-400 mb-3">
                    About the Writer
                  </p>
                  <div className="flex items-center gap-3">
                    <AuthorAvatar author={article.author} size="sm" />
                    <div>
                      <Link
                        href={`/writers/${article.author._id}`}
                        className="font-display font-bold text-ink-900 hover:text-ember-600 transition-colors"
                      >
                        {article.author.name}
                      </Link>
                      {article.author.bio && (
                        <p className="text-xs text-ink-600 font-body mt-1 line-clamp-3">
                          {article.author.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Related articles */}
                <RelatedArticles
                  categorySlug={article.category.slug}
                  currentId={article._id}
                />
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─── AuthorAvatar ─────────────────────────────────────────────────────────────

type AvatarSize = "sm" | "md" | "lg";

const avatarSizes: Record<AvatarSize, string> = {
  sm: "w-12 h-12 text-base",
  md: "w-11 h-11 text-sm",
  lg: "w-16 h-16 text-xl",
};

function AuthorAvatar({
  author,
  size = "md",
}: {
  author: { _id: string; name: string; avatar?: { url?: string } };
  size?: AvatarSize;
}) {
  const cls = avatarSizes[size];
  return (
    <Link href={`/writers/${author._id}`} className="shrink-0">
      {author.avatar?.url ? (
        <img
          src={author.avatar.url}
          alt={author.name}
          className={`${cls} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${cls} rounded-full bg-ember-600 flex items-center justify-center text-white font-bold`}
        >
          {getInitials(author.name)}
        </div>
      )}
    </Link>
  );
}

// ─── CommentThread ────────────────────────────────────────────────────────────

function CommentThread({
  comment,
  replyTo,
  replyText,
  isLoggedIn,
  onSetReply,
  onReplyTextChange,
  onSubmitReply,
  isPending,
}: {
  comment: Comment;
  replyTo: string | null;
  replyText: string;
  isLoggedIn: boolean;
  onSetReply: (id: string | null) => void;
  onReplyTextChange: (v: string) => void;
  onSubmitReply: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="shrink-0">
        {comment.author?.avatar?.url ? (
          <img
            src={comment.author.avatar.url}
            alt={comment.author.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-ink-300 flex items-center justify-center text-ink-700 text-xs font-bold">
            {getInitials(comment.author?.name ?? "?")}
          </div>
        )}
      </div>

      <div className="flex-1">
        {/* Bubble */}
        <div className="bg-white border border-(--color-border) rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans font-semibold text-ink-900 text-sm">
              {comment.author?.name}
            </span>
            <span className="text-xs text-ink-400 font-sans">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-ink-700 font-body text-sm leading-relaxed">
            {comment.isDeleted ? (
              <em className="text-ink-400">[deleted]</em>
            ) : (
              comment.body
            )}
          </p>
        </div>

        {/* Reply toggle */}
        {isLoggedIn && !comment.isDeleted && (
          <button
            onClick={() =>
              onSetReply(replyTo === comment._id ? null : comment._id)
            }
            className="flex items-center gap-1 mt-1.5 px-1 text-xs font-sans text-ink-500 hover:text-ember-600 transition-colors"
          >
            <Reply size={12} /> Reply
          </button>
        )}

        {/* Reply input */}
        {replyTo === comment._id && (
          <div className="mt-3 flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              className="flex-1 px-3 py-2 rounded-xl border border-(--color-border) bg-white text-ink-900 font-body text-sm outline-none focus:ring-2 focus:ring-ember-600/25 focus:border-ember-600 resize-none"
            />
            <button
              onClick={() => onSubmitReply(comment._id)}
              disabled={!replyText.trim() || isPending}
              className="self-end px-3 py-2 bg-ember-600 hover:bg-ember-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send size={13} />
            </button>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-(--color-border) space-y-4">
            {comment.replies.map((reply) => (
              <div key={reply._id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-ink-200 flex items-center justify-center text-ink-600 text-[10px] font-bold shrink-0">
                  {getInitials(reply.author?.name ?? "?")}
                </div>
                <div className="flex-1">
                  <div className="bg-ink-50 border border-(--color-border) rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-sans font-semibold text-ink-900 text-xs">
                        {reply.author?.name}
                      </span>
                      <span className="text-[10px] text-ink-400 font-sans">
                        {timeAgo(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-ink-700 font-body text-xs leading-relaxed">
                      {reply.isDeleted ? (
                        <em className="text-ink-400">[deleted]</em>
                      ) : (
                        reply.body
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RelatedArticles ──────────────────────────────────────────────────────────

function RelatedArticles({
  categorySlug,
  currentId,
}: {
  categorySlug: string;
  currentId: string;
}) {
  const { data } = useArticles({
    category: categorySlug,
    limit:    5,
    status:   "published",
  });

  const related = (data?.articles ?? [])
    .filter((a) => a._id !== currentId)
    .slice(0, 4);

  if (!related.length) return null;

  return (
    <div className="border border-(--color-border) rounded-xl overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-(--color-border)">
        <p className="text-[11px] font-sans font-bold uppercase tracking-widest text-ink-400">
          Related Stories
        </p>
      </div>
      <div className="divide-y divide-(--color-border)">
        {related.map((a) => (
          <Link
            key={a._id}
            href={`/articles/${a.slug}`}
            className="flex gap-3 p-3 hover:bg-ink-50 transition-colors group"
          >
            {a.featuredImage?.url && (
              <img
                src={a.featuredImage.url}
                alt={a.title}
                className="w-16 h-12 object-cover rounded-lg shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-sans font-semibold text-ink-800 group-hover:text-ember-700 transition-colors line-clamp-2 leading-snug">
                {a.title}
              </p>
              <p className="text-[10px] text-ink-400 font-sans mt-1">
                {timeAgo(a.publishedAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}