"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthorLine, EmptyState } from "@/components/shared";
import { useBlog, useLikeBlog, useBlogComments, usePostComment } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { formatDate, timeAgo, getInitials, cn, formatNumber } from "@/lib/utils";
import { Heart, MessageCircle, Share2, Eye, Clock, Send, Reply, ArrowLeft } from "lucide-react";
import type { Comment } from "@/types";
import { toast } from "react-toastify";

export default function BlogDetailPage() {
  const { slug }             = useParams<{ slug: string }>();
  const { user, isLoggedIn } = useAuth();
  const likeMut              = useLikeBlog();
  const postComment          = usePostComment();

  const { data: blog, isLoading } = useBlog(slug ?? "");
  const { data: commentData }     = useBlogComments(blog?._id ?? "");

  const [commentText, setCommentText] = useState("");
  const [replyTo,     setReplyTo]     = useState<string | null>(null);
  const [replyText,   setReplyText]   = useState("");
  const [liked,       setLiked]       = useState(false);

  const comments = commentData?.comments ?? [];

  const handleLike = () => {
    if (!isLoggedIn) { toast.error("Sign in to like posts."); return; }
    setLiked(l => !l);
    likeMut.mutate(blog!._id);
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: blog?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const submitComment = async () => {
    if (!isLoggedIn) { toast.error("Sign in to comment."); return; }
    if (!commentText.trim()) return;
    await postComment.mutateAsync({ blogId: blog!._id, body: commentText });
    setCommentText("");
  };

  const submitReply = async (parentId: string) => {
    if (!isLoggedIn) { toast.error("Sign in to reply."); return; }
    if (!replyText.trim()) return;
    await postComment.mutateAsync({ blogId: blog!._id, body: replyText, parent: parentId });
    setReplyTo(null);
    setReplyText("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
          <div className="skeleton h-8 w-2/3 mb-4 rounded" />
          <div className="skeleton h-5 w-1/2 mb-8 rounded" />
          <div className="skeleton aspect-[16/7] rounded-2xl mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-5 rounded" style={{ width: `${75 + Math.random() * 25}%` }} />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <EmptyState icon="📝" title="Blog post not found" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/blogs"
            className="inline-flex items-center gap-1.5 text-sm font-sans text-ink-500 hover:text-ink-900 transition-colors mb-6">
            <ArrowLeft size={14} /> Back to Community
          </Link>

          <article>
            {/* Tags */}
            {(blog.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {blog.tags!.map(tag => (
                  <span key={tag} className="text-[11px] font-sans font-medium text-ink-500 bg-ink-100 px-2.5 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-950 leading-tight mb-4">
              {blog.title}
            </h1>

            {blog.excerpt && (
              <p className="text-ink-600 text-lg font-body italic leading-relaxed mb-6 border-l-4 border-ember-600 pl-4">
                {blog.excerpt}
              </p>
            )}

            {/* Author row */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <Link href={`/writers/${blog.author._id}`}>
                  {blog.author.avatar?.url ? (
                    <img src={blog.author.avatar.url} alt={blog.author.name}
                      className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-ember-600 flex items-center justify-center text-white font-bold">
                      {getInitials(blog.author.name)}
                    </div>
                  )}
                </Link>
                <div>
                  <Link href={`/writers/${blog.author._id}`}
                    className="font-sans font-semibold text-ink-900 hover:text-ember-600 transition-colors text-sm block">
                    {blog.author.name}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-ink-500 font-sans">
                    <span>{formatDate(blog.createdAt, "MMMM dd, yyyy")}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {blog.readTime} min read</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-500 font-sans">
                <span className="flex items-center gap-1"><Eye size={13} /> {formatNumber(blog.views)}</span>
                <span className="flex items-center gap-1"><Heart size={13} /> {formatNumber(blog.likes)}</span>
              </div>
            </div>

            {/* Featured image */}
            {blog.featuredImage?.url && (
              <div className="mb-8 rounded-2xl overflow-hidden">
                <img src={blog.featuredImage.url} alt={blog.title}
                  className="w-full object-cover max-h-[460px]" />
              </div>
            )}

            {/* Body */}
            <div className="prose-article text-ink-800 font-body text-[17px] leading-[1.85]"
              dangerouslySetInnerHTML={{ __html: blog.content }} />

            {/* Actions */}
            <div className="flex items-center gap-3 mt-8 py-4 border-t border-b border-[var(--color-border)]">
              <button onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border font-sans font-semibold text-sm transition-all",
                  liked || blog.isLiked ? "bg-ember-50 border-ember-200 text-ember-700" : "border-[var(--color-border)] text-ink-600 hover:border-ink-400"
                )}>
                <Heart size={15} className={cn(liked || blog.isLiked ? "fill-ember-600 text-ember-600" : "")} />
                {formatNumber(blog.likes + (liked ? 1 : 0))}
              </button>
              <button onClick={() => document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-ink-600 hover:border-ink-400 font-sans font-semibold text-sm transition-all">
                <MessageCircle size={15} /> {comments.length}
              </button>
              <button onClick={handleShare}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-ink-600 hover:border-ink-400 font-sans font-semibold text-sm transition-all">
                <Share2 size={15} /> Share
              </button>
            </div>

            {/* Comments */}
            {blog.allowComments && (
              <section id="comments" className="mt-12">
                <h2 className="font-display text-2xl font-bold text-ink-900 mb-6">Comments ({comments.length})</h2>
                {isLoggedIn ? (
                  <div className="flex gap-3 mb-8">
                    <div className="w-9 h-9 rounded-full bg-ember-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {getInitials(user?.name ?? "")}
                    </div>
                    <div className="flex-1">
                      <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                        placeholder="Share your thoughts…" rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white text-ink-900 font-body text-sm outline-none focus:ring-2 focus:ring-ember-600/25 focus:border-ember-600 resize-none transition-all" />
                      <div className="flex justify-end mt-2">
                        <button onClick={submitComment} disabled={!commentText.trim() || postComment.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-lg transition-colors disabled:opacity-50">
                          <Send size={13} /> Post Comment
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 p-4 bg-ink-50 rounded-xl border border-[var(--color-border)] text-center">
                    <p className="text-sm text-ink-600 font-body mb-3">Sign in to join the conversation</p>
                    <Link href="/login" className="px-5 py-2 bg-ember-600 hover:bg-ember-700 text-white text-sm font-sans font-semibold rounded-lg transition-colors">Sign In</Link>
                  </div>
                )}
                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <p className="text-ink-400 font-body text-sm text-center py-8">Be the first to comment.</p>
                  ) : (
                    comments.map(c => (
                      <BlogCommentThread key={c._id} comment={c} replyTo={replyTo} replyText={replyText}
                        isLoggedIn={isLoggedIn} onSetReply={setReplyTo} onReplyTextChange={setReplyText}
                        onSubmitReply={submitReply} isPending={postComment.isPending} />
                    ))
                  )}
                </div>
              </section>
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BlogCommentThread({ comment, replyTo, replyText, isLoggedIn, onSetReply, onReplyTextChange, onSubmitReply, isPending }: {
  comment: Comment; replyTo: string | null; replyText: string; isLoggedIn: boolean;
  onSetReply: (id: string | null) => void; onReplyTextChange: (v: string) => void;
  onSubmitReply: (id: string) => void; isPending: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-ink-700 text-xs font-bold shrink-0">
        {comment.author?.avatar?.url
          ? <img src={comment.author.avatar.url} alt={comment.author.name} className="w-8 h-8 rounded-full object-cover" />
          : getInitials(comment.author?.name ?? "?")}
      </div>
      <div className="flex-1">
        <div className="bg-white border border-[var(--color-border)] rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans font-semibold text-ink-900 text-sm">{comment.author?.name}</span>
            <span className="text-xs text-ink-400 font-sans">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-ink-700 font-body text-sm leading-relaxed">
            {comment.isDeleted ? <em className="text-ink-400">[deleted]</em> : comment.body}
          </p>
        </div>
        {isLoggedIn && !comment.isDeleted && (
          <button onClick={() => onSetReply(replyTo === comment._id ? null : comment._id)}
            className="flex items-center gap-1 mt-1.5 px-1 text-xs font-sans text-ink-500 hover:text-ember-600 transition-colors">
            <Reply size={12} /> Reply
          </button>
        )}
        {replyTo === comment._id && (
          <div className="mt-3 flex gap-2">
            <textarea value={replyText} onChange={e => onReplyTextChange(e.target.value)}
              placeholder="Write a reply…" rows={2}
              className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-ink-900 font-body text-sm outline-none focus:ring-2 focus:ring-ember-600/25 focus:border-ember-600 resize-none" />
            <button onClick={() => onSubmitReply(comment._id)} disabled={!replyText.trim() || isPending}
              className="self-end px-3 py-2 bg-ember-600 hover:bg-ember-700 text-white rounded-lg transition-colors disabled:opacity-50">
              <Send size={13} />
            </button>
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-[var(--color-border)] space-y-3">
            {comment.replies.map(reply => (
              <div key={reply._id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-ink-200 flex items-center justify-center text-ink-600 text-[9px] font-bold shrink-0">
                  {getInitials(reply.author?.name ?? "?")}
                </div>
                <div className="flex-1 bg-ink-50 border border-[var(--color-border)] rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-sans font-semibold text-ink-900 text-xs">{reply.author?.name}</span>
                    <span className="text-[10px] text-ink-400 font-sans">{timeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="text-ink-700 font-body text-xs">{reply.isDeleted ? <em className="text-ink-400">[deleted]</em> : reply.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
