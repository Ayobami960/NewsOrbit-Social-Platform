import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useArticles, useDeleteArticle } from "../hooks/useArticles";
import Layout from "../components/layout/Layout";
import { Card, Btn, Badge, Table, Th, Td, Input, Select, Spinner, Empty, Pagination } from "../components/ui";
import type { ArticleListItem, ArticleFilters } from "../types";
import { formatDate } from "../lib/utils";
import { Plus, Pencil, Trash2, Flame } from "lucide-react";
import toast from "react-hot-toast";

export default function Articles() {
  const navigate = useNavigate();
  const { user: me, isRole } = useAuth();           // Get current user
  const deleteMut = useDeleteArticle();

  const [filters, setFilters] = useState<ArticleFilters>({
    page: 1,
    limit: 20,
    status: "",
    search: "",
  });

  const [search, setSearch] = useState("");

  const { data, isLoading } = useArticles(filters);

  const articles = data?.articles ?? [];
  const pagination = data?.pagination;

  const isWriter = isRole("writer");
  const isAdmin = isRole("super_admin", "admin");

  const canCreate = isWriter;
  const canDelete = isWriter || isAdmin;

  const runSearch = () => {
    setFilters((f) => ({ ...f, search, page: 1 }));
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    deleteMut.mutate(id);
  };

  // New Handler for Edit Button
  const handleEdit = (article: ArticleListItem) => {
    const isOwner = article.author?._id === me?._id;

    if (isWriter && !isOwner) {
      toast.error("You can only edit your own articles.");
      return;
    }

    // Allow navigation for owners and admins
    navigate(`/articles/edit/${article._id}`);
  };

  return (
    <Layout
      title="Articles"
      action={
        canCreate && (
          <Btn variant="primary" size="sm" onClick={() => navigate("/New-articles")}>
            <Plus size={14} /> New Article
          </Btn>
        )
      }
    >
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Input
            className="max-w-60"
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />

          <Select
            className="w-40"
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value as any, page: 1 }))
            }
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </Select>

          <Btn size="sm" onClick={runSearch}>Search</Btn>

          {pagination && (
            <span className="ml-auto text-xs text-zinc-600">
              {pagination.total.toLocaleString()} articles
            </span>
          )}
        </div>

        {isLoading ? (
          <Spinner />
        ) : articles.length === 0 ? (
          <Empty message="No articles found" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Author</Th>
                <Th>Status</Th>
                <Th>Views</Th>
                <Th>Published</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a: ArticleListItem) => {
                const isOwner = a.author?._id === me?._id;
                const canEditThis = isAdmin || isOwner;

                return (
                  <tr key={a._id} className="hover:bg-zinc-800/30 transition-colors">
                    <Td className="max-w-80">
                      <div>
                        <p className="text-zinc-100 font-medium text-[13.5px] leading-snug line-clamp-2">
                          {a.title}
                        </p>
                        {a.isBreaking && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 mt-1">
                            <Flame size={10} /> Breaking
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>{a.category && <Badge color="info">{a.category.name}</Badge>}</Td>
                    <Td className="text-zinc-400">{a.author?.name}</Td>
                    <Td><Badge color={a.status}>{a.status}</Badge></Td>
                    <Td className="text-zinc-500 font-mono text-xs">
                      {a.views?.toLocaleString() ?? "0"}
                    </Td>
                    <Td className="text-zinc-500 text-xs whitespace-nowrap">
                      {a.publishedAt ? formatDate(a.publishedAt) : "—"}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Btn
                          size="xs"
                          onClick={() => handleEdit(a)}
                          disabled={!canEditThis && isWriter}
                          title={!canEditThis && isWriter ? "You can only edit your own articles" : ""}
                        >
                          <Pencil size={12} />
                        </Btn>

                        {canDelete && (
                          <Btn
                            size="xs"
                            variant="danger"
                            onClick={() => handleDelete(a._id, a.title)}
                            disabled={deleteMut.isPending}
                          >
                            <Trash2 size={12} />
                          </Btn>
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
    </Layout>
  );
}
