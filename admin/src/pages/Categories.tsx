import { useState } from "react";
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from "../hooks/useBlogs";
import type { CategoryPayload } from "../hooks/useBlogs";
import Layout from "../components/layout/Layout";
import {
  Card, Table, Th, Td, Badge, Btn, Input, Textarea,
  FormGroup, Modal, Spinner, Empty,
} from "../components/ui";
import type { Category } from "../types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const EMPTY_FORM: CategoryPayload = { name: "", description: "", color: "#c0392b", order: 0 };

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();

  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form,    setForm]    = useState<CategoryPayload>(EMPTY_FORM);

  const saving = createMut.isPending || updateMut.isPending;

  const open = (cat?: Category) => {
    setEditing(cat ?? null);
    setForm(cat
      ? { name: cat.name, description: cat.description ?? "", color: cat.color, order: cat.order }
      : EMPTY_FORM
    );
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required."); return; }

    const payload: CategoryPayload = {
      name:        form.name.trim(),
      description: form.description,
      color:       form.color,
      order:       form.order,
    };

    if (editing) {
      await updateMut.mutateAsync({ id: editing._id, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setModal(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Articles using it will lose their category.`)) return;
    deleteMut.mutate(id);
  };

  return (
    <Layout
      title="Categories"
      action={<Btn variant="primary" size="sm" onClick={() => open()}><Plus size={14} /> New Category</Btn>}
    >
      <Card>
        {isLoading ? <Spinner /> : categories.length === 0 ? <Empty message="No categories yet" /> : (
          <Table>
            <thead>
              <tr><Th>Name</Th><Th>Slug</Th><Th>Color</Th><Th>Order</Th><Th>Status</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c._id} className="hover:bg-zinc-800/30 transition-colors">
                  <Td>
                    <span className="text-zinc-100 font-semibold">{c.name}</span>
                  </Td>
                  <Td>
                    <code className="text-[12px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                      /{c.slug}
                    </code>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ background: c.color }} />
                      <span className="text-xs text-zinc-500 font-mono">{c.color}</span>
                    </div>
                  </Td>
                  <Td className="text-zinc-500 text-sm">{c.order}</Td>
                  <Td>
                    <Badge color={c.isActive ? "active" : "draft"}>
                      {c.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Btn size="xs" onClick={() => open(c)}><Pencil size={12} /></Btn>
                      <Btn size="xs" variant="danger"
                        onClick={() => handleDelete(c._id, c.name)}
                        disabled={deleteMut.isPending}>
                        <Trash2 size={12} />
                      </Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit Category" : "New Category"}
        footer={<>
          <Btn onClick={() => setModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} loading={saving}>
            {editing ? "Update" : "Create"}
          </Btn>
        </>}
      >
        <FormGroup label="Name">
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Politics"
          />
        </FormGroup>
        <FormGroup label="Description">
          <Textarea
            rows={2}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Short description…"
          />
        </FormGroup>
        <FormGroup label="Color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="w-10 h-10 rounded-lg border border-zinc-700 cursor-pointer bg-zinc-900 p-0.5"
            />
            <Input
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="flex-1 font-mono"
              placeholder="#c0392b"
            />
          </div>
        </FormGroup>
        <FormGroup label="Sort Order">
          <Input
            type="number"
            value={form.order}
            onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
          />
        </FormGroup>
      </Modal>
    </Layout>
  );
}