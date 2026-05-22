import { useAnalyticsOverview, useTopArticles, useArticlesByDay } from "../hooks/useAnalytics";
import Layout from "../components/layout/Layout";
import {
  StatCard, Card, BarRow, SectionHead, Spinner, Badge,
} from "../components/ui";
import AreaChart from "../components/charts/AreaChart";
import { useAuth } from "../context/AuthContext";
import type { SuperAdminOverview, AdminOverview, WriterOverview } from "../types";
import { Newspaper, Users, BookOpen, AlertTriangle } from "lucide-react";

const SPARKS = [12, 18, 14, 28, 22, 30, 24, 32, 20, 28, 35, 40];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: overview, isLoading } = useAnalyticsOverview();
  const { data: topArticles = [] } = useTopArticles();
  const { data: chartData = [] } = useArticlesByDay(14);

  if (isLoading) {
    return <Layout title="Powerful insights at your fingertips"><Spinner /></Layout>;
  }

  const isWriter = user?.role === "writer";
  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "super_admin";

  // Early return if no overview
  if (!overview) {
    return <Layout title="Powerful insights at your fingertips">No data available</Layout>;
  }

  return (
    <Layout title="Powered By Management">
      {/* ── Stats Grid ── */}
      <div className={`grid gap-4 mb-6 ${isWriter ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
        {isSuperAdmin && (
          <>
            <StatCard 
              label="Total Articles" 
              value={(overview as SuperAdminOverview).articles.total}
              sub={`${(overview as SuperAdminOverview).articles.published} published`} 
              subColor="text-green-400"
              accent="bg-red-500" 
              icon={Newspaper} 
              sparkData={SPARKS} 
            />
            <StatCard 
              label="Registered Users" 
              value={(overview as SuperAdminOverview).users.total}
              sub={`+${(overview as SuperAdminOverview).users.newThisMonth} this month`} 
              subColor="text-green-400"
              accent="bg-green-500" 
              icon={Users} 
              sparkData={SPARKS.map(v => v * 2)} 
            />
            <StatCard 
              label="Community Blogs" 
              value={(overview as SuperAdminOverview).blogs.total}
              sub="All published by users" 
              subColor="text-zinc-400"
              accent="bg-blue-500" 
              icon={BookOpen} 
              sparkData={SPARKS.map(v => Math.round(v * 0.5))} 
            />
            <StatCard 
              label="Total Views" 
              value={(overview as SuperAdminOverview).totalViews}
              sub="Across all content" 
              accent="bg-amber-500"
              sparkData={SPARKS.map(v => v * 30)} 
            />
          </>
        )}

        {isAdmin && (
          <>
            <StatCard 
              label="My Writers" 
              value={(overview as AdminOverview).writers} 
              sub="Under your management" 
              accent="bg-blue-500" 
              icon={Users} 
            />
            <StatCard 
              label="Team Articles" 
              value={(overview as AdminOverview).articles.total} 
              sub={`${(overview as AdminOverview).articles.published} published`} 
              subColor="text-green-400" 
              accent="bg-red-500" 
              icon={Newspaper} 
            />
            <StatCard 
              label="Total Views" 
              value={(overview as AdminOverview).totalViews} 
              sub="From your team's content" 
              accent="bg-amber-500" 
            />
          </>
        )}

        {isWriter && (
          <>
            <StatCard 
              label="My Articles" 
              value={(overview as WriterOverview).articles.total} 
              sub={`${(overview as WriterOverview).articles.published} published`} 
              subColor="text-green-400" 
              accent="bg-red-500" 
              icon={Newspaper} 
            />
            <StatCard 
              label="Drafts" 
              value={(overview as WriterOverview).articles.draft} 
              sub="In progress" 
              accent="bg-amber-500" 
            />
            <StatCard 
              label="Total Views" 
              value={(overview as WriterOverview).totalViews} 
              sub="Across all your articles" 
              accent="bg-blue-500" 
            />
          </>
        )}
      </div>

      {/* ── Chart + Top Articles ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <Card className="p-5">
          <SectionHead title="Articles Published — Last 14 Days" />
          {chartData.length > 0 ? (
            <AreaChart data={chartData} height={220} />
          ) : (
            <div className="h-55 flex items-center justify-center text-zinc-600 text-sm">
              No data yet
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionHead title="Top Articles by Views" />
          {topArticles.length > 0 ? (
            topArticles.slice(0, 5).map((a: any) => (
              <BarRow 
                key={a._id} 
                label={a.title.slice(0, 22) + "…"} 
                value={a.views} 
                max={topArticles[0]?.views || 1} 
              />
            ))
          ) : (
            <p className="text-xs text-zinc-600 text-center py-6">No articles yet</p>
          )}
        </Card>
      </div>

      {/* ── Super Admin Only Extra Panels ── */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5">
            <SectionHead title="Audience" />
            <BarRow 
              label="Newsletter subs" 
              value={(overview as SuperAdminOverview).newsletter.subscribers} 
              max={(overview as SuperAdminOverview).newsletter.subscribers || 1} 
              color="bg-blue-500" 
            />
            <BarRow 
              label="Pending comments" 
              value={(overview as SuperAdminOverview).comments.pending} 
              max={(overview as SuperAdminOverview).comments.total || 1} 
              color="bg-amber-500" 
            />
            <BarRow 
              label="Total comments" 
              value={(overview as SuperAdminOverview).comments.total} 
              max={(overview as SuperAdminOverview).comments.total || 1} 
              color="bg-green-500" 
            />
          </Card>

          {/* Security Card */}
          <Card className="p-5">
            <SectionHead title="Security (30 days)" />
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <AlertTriangle size={14} className="text-amber-400" />
                Suspicious Actions
              </div>
              <Badge color={(overview as SuperAdminOverview).security.suspiciousLast30Days > 20 ? "critical" : "info"}>
                {(overview as SuperAdminOverview).security.suspiciousLast30Days}
              </Badge>
            </div>
            <p className="text-xs text-zinc-600 mt-3">
              Monitor the Activity Log for details on flagged events.
            </p>
          </Card>

          {/* Content Summary */}
          <Card className="p-5">
            <SectionHead title="Content Summary" />
            {[
              { label: "Published Articles", value: (overview as SuperAdminOverview).articles.published, color: "text-green-400" },
              { label: "Total Blogs", value: (overview as SuperAdminOverview).blogs.total, color: "text-blue-400" },
              { label: "Total Comments", value: (overview as SuperAdminOverview).comments.total, color: "text-amber-400" },
              { label: "Newsletter Subs", value: (overview as SuperAdminOverview).newsletter.subscribers, color: "text-zinc-300" },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-zinc-800 last:border-0">
                <span className="text-sm text-zinc-500">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>
                  {item.value?.toLocaleString()}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </Layout>
  );
}