import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  useAnalyticsOverview,
  useTopArticles,
  useArticlesByDay,
  useUsersByRole,
} from "../hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "../lib/apiFetch";
import Layout from "../components/layout/Layout";
import {
  Card, StatCard, BarRow, SectionHead, Spinner,
} from "../components/ui";
import AreaChart from "../components/charts/AreaChart";
import type {
  SuperAdminOverview, AdminOverview, WriterOverview,
  ArticleListItem,
} from "../types";
import { formatDate } from "../lib/utils";
import {
  Newspaper, Eye, Heart, MessageCircle, Users,
  TrendingUp, BookOpen,
} from "lucide-react";

// ── Writer engagement stats for their articles ─────────────────────────────
interface WriterEngagement {
  total: number;
  published: number;
  draft: number;
  totalViews: number;
  topArticles: ArticleListItem[];
}

function WriterAnalytics() {
  const { data: overview, isLoading: ovLoading } = useAnalyticsOverview();
  const { data: chartData = [], isLoading: chartLoading } = useArticlesByDay(30);
  const { data: eng } = useQuery({
    queryKey: ["articles", "my-stats"],
    queryFn:  () => authFetch<WriterEngagement>("/articles/my-stats").then(r => r.data),
  });

  // Blog engagement — comments + likes on their articles from users
  const { data: blogEngagement } = useQuery({
    queryKey: ["analytics", "writer-engagement"],
    queryFn:  () =>
      authFetch<{
        totalLikes: number;
        totalComments: number;
        totalReactions: number;
      }>("/analytics/writer-engagement").then(r => r.data).catch(() => ({
        totalLikes: 0, totalComments: 0, totalReactions: 0,
      })),
  });

  if (ovLoading) return <Spinner />;
  const ov = overview as WriterOverview | undefined;

  const SPARKS = [8,14,10,22,18,26,20,30,24,28,32,36];

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Articles"
          value={ov?.articles.total ?? 0}
          sub={`${ov?.articles.published ?? 0} published · ${ov?.articles.draft ?? 0} drafts`}
          subColor="text-zinc-400"
          accent="bg-red-500"
          icon={Newspaper}
          sparkData={SPARKS}
        />
        <StatCard
          label="Total Views"
          value={ov?.totalViews ?? 0}
          sub="Across all published articles"
          subColor="text-green-400"
          accent="bg-green-500"
          icon={Eye}
          sparkData={SPARKS.map(v => v * 40)}
        />
        <StatCard
          label="User Likes"
          value={blogEngagement?.totalLikes ?? 0}
          sub="Reactions from readers"
          subColor="text-pink-400"
          accent="bg-pink-500"
          icon={Heart}
        />
        <StatCard
          label="Comments Received"
          value={blogEngagement?.totalComments ?? 0}
          sub="On your articles"
          subColor="text-blue-400"
          accent="bg-blue-500"
          icon={MessageCircle}
        />
      </div>

      {/* Chart + top articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <SectionHead title="Articles Published — Last 30 Days" />
          {chartLoading
            ? <Spinner />
            : chartData.length > 0
              ? <AreaChart data={chartData} height={240} />
              : <div className="h-60 flex items-center justify-center text-zinc-600 text-sm">
                  No articles published in the last 30 days
                </div>
          }
        </Card>

        <Card className="p-5">
          <SectionHead title="Your Top Articles" />
          {(eng?.topArticles ?? []).length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-8">No published articles yet</p>
          ) : (
            <div className="space-y-0">
              {(eng?.topArticles ?? []).slice(0, 6).map((a, i) => (
                <div key={a._id} className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
                  <span className="text-xl font-black text-zinc-800 font-[Playfair_Display] w-7 shrink-0 leading-none mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-zinc-300 font-medium leading-snug line-clamp-2">
                      {a.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Eye size={10} /> {a.views.toLocaleString()}
                      </span>
                      <span>{formatDate(a.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Engagement breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <SectionHead title="Reader Engagement" />
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Eye size={14} className="text-blue-400" /> Total Views
              </div>
              <span className="text-zinc-100 font-bold">{(ov?.totalViews ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Heart size={14} className="text-pink-400" /> Total Likes
              </div>
              <span className="text-zinc-100 font-bold">{(blogEngagement?.totalLikes ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <MessageCircle size={14} className="text-green-400" /> Total Comments
              </div>
              <span className="text-zinc-100 font-bold">{(blogEngagement?.totalComments ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <TrendingUp size={14} className="text-amber-400" /> Avg. Views/Article
              </div>
              <span className="text-zinc-100 font-bold">
                {eng?.published && eng.published > 0
                  ? Math.round((ov?.totalViews ?? 0) / eng.published).toLocaleString()
                  : "—"}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHead title="Article Status Breakdown" />
          {eng && (
            <div className="mt-2 space-y-3">
              <BarRow label="Published" value={eng.published}       max={eng.total || 1} color="bg-green-500" />
              <BarRow label="Draft"     value={eng.draft}           max={eng.total || 1} color="bg-amber-500" />
              <BarRow label="Scheduled" value={eng.total - eng.published - eng.draft} max={eng.total || 1} color="bg-blue-500" />
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-3">Tips to grow</p>
            <ul className="space-y-2 text-xs text-zinc-500">
              <li>✦ Publish consistently — aim for 3+ articles/week</li>
              <li>✦ Use breaking news tag for time-sensitive stories</li>
              <li>✦ Engage with comments to boost reach</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Admin analytics (their team) ───────────────────────────────────────────
function AdminAnalytics() {
  const { data: overview, isLoading } = useAnalyticsOverview();
  const { data: topArticles = [] }    = useTopArticles();
  const { data: chartData = [] }      = useArticlesByDay(14);

  if (isLoading) return <Spinner />;
  const ov = overview as AdminOverview | undefined;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-4">
        <StatCard label="My Writers"    value={ov?.writers ?? 0}  sub="Under your management" accent="bg-blue-500" icon={Users} />
        <StatCard label="Team Articles" value={ov?.articles.total ?? 0} sub={`${ov?.articles.published ?? 0} published`} subColor="text-green-400" accent="bg-red-500" icon={Newspaper} />
        <StatCard label="Total Views"   value={ov?.totalViews ?? 0} sub="From your team's content" accent="bg-amber-500" icon={Eye} />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-5">
        <Card className="p-5">
          <SectionHead title="Team Articles — Last 14 Days" />
          {chartData.length > 0 ? <AreaChart data={chartData} height={220} /> : (
            <div className="h-55 flex items-center justify-center text-zinc-600 text-sm">No data yet</div>
          )}
        </Card>
        <Card className="p-5">
          <SectionHead title="Top Articles by Team" />
          {topArticles.slice(0, 5).map((a) => (
            <BarRow key={a._id} label={a.title.slice(0, 20) + "…"} value={a.views} max={topArticles[0]?.views || 1} />
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Super Admin analytics (full platform) ─────────────────────────────────
function SuperAdminAnalytics() {
  const { data: overview, isLoading } = useAnalyticsOverview();
  const { data: topArticles = [] }    = useTopArticles();
  const { data: chartData = [] }      = useArticlesByDay(30);
  const { data: usersByRole = [] }    = useUsersByRole();
  const [days, setDays]               = useState(30);

  if (isLoading) return <Spinner />;
  const ov = overview as SuperAdminOverview | undefined;

  const SPARKS = [12, 18, 14, 28, 22, 30, 24, 32, 20, 28, 35, 40];

  const totalUsers = usersByRole.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Articles"   value={ov?.articles.total ?? 0}         sub={`${ov?.articles.published ?? 0} published`} subColor="text-green-400" accent="bg-red-500"   icon={Newspaper}  sparkData={SPARKS} />
        <StatCard label="Registered Users" value={ov?.users.total ?? 0}            sub={`+${ov?.users.newThisMonth ?? 0} this month`} subColor="text-green-400" accent="bg-blue-500" icon={Users}      sparkData={SPARKS.map(v => v * 2)} />
        <StatCard label="Community Blogs"  value={ov?.blogs.total ?? 0}            sub="User-generated posts" accent="bg-violet-500"   icon={BookOpen}   sparkData={SPARKS.map(v => Math.round(v * .6))} />
        <StatCard label="Total Views"      value={ov?.totalViews ?? 0}             sub="Across all content"  accent="bg-amber-500"   icon={Eye}        sparkData={SPARKS.map(v => v * 80)} />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4  gap-4">
        <StatCard label="Newsletter Subs"   value={ov?.newsletter.subscribers ?? 0}  accent="bg-cyan-500" />
        {/* <StatCard label="Pending Comments"  value={ov?.comments.pending ?? 0}         accent="bg-amber-500"
          sub={`${ov?.comments.total ?? 0} total`} /> */}
        <StatCard label="Suspicious (30d)"  value={ov?.security.suspiciousLast30Days ?? 0}
          accent="bg-rose-600" subColor="text-rose-400"
          sub={ov?.security.suspiciousLast30Days ?? 0 > 20 ? "⚠ High activity" : "Normal"} />
        <StatCard label="Total Comments"   value={ov?.comments.total ?? 0}           accent="bg-green-500" />
      </div>

      {/* Main chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionHead title="Articles Published" />
            <div className="flex gap-1">
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    days === d ? "bg-red-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 0
            ? <AreaChart data={chartData} height={240} />
            : <div className="h-60 flex items-center justify-center text-zinc-600 text-sm">No data</div>
          }
        </Card>

        <Card className="p-5">
          <SectionHead title="Top 5 Articles" />
          {topArticles.slice(0, 5).map((a, i) => (
            <div key={a._id} className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
              <span className="text-lg font-black text-zinc-800 w-6 shrink-0 leading-none mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-zinc-300 leading-snug line-clamp-2 font-medium">{a.title}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-600">
                  <Eye size={9} />{a.views.toLocaleString()} views
                  <span>·</span>
                  {a.category?.name}
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Users by role */}
        <Card className="p-5">
          <SectionHead title="Users by Role" />
          {usersByRole.map(r => (
            <BarRow
              key={r._id}
              label={r._id.replace("_", " ")}
              value={r.count}
              max={totalUsers || 1}
              color={
                r._id === "super_admin" ? "bg-red-500" :
                r._id === "admin"       ? "bg-blue-500" :
                r._id === "writer"      ? "bg-green-500" : "bg-zinc-500"
              }
            />
          ))}
        </Card>

        {/* Content summary */}
        <Card className="p-5">
          <SectionHead title="Content Summary" />
          {[
            { label: "Published Articles", value: ov?.articles.published ?? 0, color: "text-green-400" },
            { label: "Draft Articles",      value: (ov?.articles.total ?? 0) - (ov?.articles.published ?? 0), color: "text-amber-400" },
            { label: "Community Blogs",     value: ov?.blogs.total ?? 0,        color: "text-violet-400" },
            { label: "Total Comments",      value: ov?.comments.total ?? 0,     color: "text-blue-400" },
            { label: "Newsletter Subs",     value: ov?.newsletter.subscribers ?? 0, color: "text-cyan-400" },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-zinc-800 last:border-0">
              <span className="text-[13px] text-zinc-500">{item.label}</span>
              <span className={`text-sm font-bold ${item.color}`}>{item.value.toLocaleString()}</span>
            </div>
          ))}
        </Card>

        {/* Security */}
        <Card className="p-5">
          <SectionHead title="Security Overview" />
          <div className="space-y-3 mt-2">
            {[
              { label: "Suspicious (30d)",  value: ov?.security.suspiciousLast30Days ?? 0, color: "bg-rose-500",   threshold: 20 },
              { label: "Pending Comments",  value: ov?.comments.pending ?? 0,               color: "bg-amber-500", threshold: 50 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>{item.label}</span>
                  <span className={item.value > item.threshold ? "text-rose-400 font-bold" : "text-zinc-400"}>
                    {item.value}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${Math.min(100, (item.value / (item.threshold * 2)) * 100)}%`, transition: "width .6s ease" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-800">
            <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">Quick Links</p>
            <div className="space-y-1.5">
              <a href="/activity" className="block text-xs text-zinc-500 hover:text-red-400 transition-colors">→ View full activity log</a>
              <a href="/comments" className="block text-xs text-zinc-500 hover:text-red-400 transition-colors">→ Moderate comments</a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Page entry ─────────────────────────────────────────────────────────────
export default function Analytics() {
  const { isRole } = useAuth();

  return (
    <Layout title="Analytics">
      {isRole("super_admin") && <SuperAdminAnalytics />}
      {isRole("admin")       && !isRole("super_admin") && <AdminAnalytics />}
      {isRole("writer")      && !isRole("admin") && !isRole("super_admin") && <WriterAnalytics />}
    </Layout>
  );
}
