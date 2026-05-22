import { useState } from "react";
import { useNewsletterSubscribers, useSendNewsletter } from "../hooks/useBlogs";
import Layout from "../components/layout/Layout";
import {
  Card, StatCard, Table, Th, Td, Badge, Btn,
  FormGroup, Input, Textarea, Toggle, Spinner, Empty, Pagination, SectionHead,
} from "../components/ui";
import type { SendNewsletterPayload } from "../types";
import { Send, Mail } from "lucide-react";
import { formatDate } from "../lib/utils";

export default function Newsletter() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNewsletterSubscribers(page);
  const sendMut = useSendNewsletter();

  const subscribers = data?.subscribers ?? [];
  const total       = data?.total ?? 0;
  const active      = subscribers.filter(s => s.isActive).length;

  const [sendPush, setSendPush] = useState(true);
  const [form, setForm] = useState<SendNewsletterPayload>({
    subject: "", html: "", pushTitle: "", pushBody: "", articleUrl: "",
  });

  const handleSend = async () => {
    if (!form.subject.trim()) return;
    if (!form.html.trim()) return;
    const payload = { ...form };
    if (!sendPush) { delete payload.pushTitle; delete payload.pushBody; delete payload.articleUrl; }
    await sendMut.mutateAsync(payload);
    setForm({ subject: "", html: "", pushTitle: "", pushBody: "", articleUrl: "" });
  };

  return (
    <Layout title="Newsletter">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Subscribers" value={total}            accent="bg-blue-500" icon={Mail} />
        <StatCard label="Active"            value={active}           accent="bg-green-500" sub="Receiving emails" subColor="text-green-400" />
        <StatCard label="Unsubscribed"      value={total - active}   accent="bg-red-500" />
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-5">
        {/* Compose */}
        <Card className="p-5">
          <SectionHead title="Compose Newsletter" />

          <FormGroup label="Subject Line">
            <Input placeholder="Weekly digest: Latest Osun News…"
              value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </FormGroup>

          <FormGroup label="HTML Body">
            <Textarea rows={10} placeholder="Write your newsletter HTML here…"
              value={form.html} onChange={e => setForm(f => ({ ...f, html: e.target.value }))}
              className="font-mono text-xs" />
          </FormGroup>

          {/* Push toggle */}
          <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-zinc-200">
                🔔 Also send browser push notification
              </span>
              <Toggle on={sendPush} onChange={setSendPush} />
            </div>
            {sendPush && (
              <div className="space-y-3">
                <FormGroup label="Push Title">
                  <Input placeholder="Breaking: New digest available…"
                    value={form.pushTitle ?? ""} onChange={e => setForm(f => ({ ...f, pushTitle: e.target.value }))} />
                </FormGroup>
                <FormGroup label="Push Body">
                  <Input placeholder="Check out this week's top stories"
                    value={form.pushBody ?? ""} onChange={e => setForm(f => ({ ...f, pushBody: e.target.value }))} />
                </FormGroup>
                <FormGroup label="Article URL (optional)">
                  <Input placeholder="https://osunnews.com/articles/weekly-digest"
                    value={form.articleUrl ?? ""} onChange={e => setForm(f => ({ ...f, articleUrl: e.target.value }))} />
                </FormGroup>
              </div>
            )}
          </div>

          <Btn variant="primary" onClick={handleSend} loading={sendMut.isPending} className="w-full justify-center">
            <Send size={14} />
            {sendMut.isPending ? "Sending…" : `Send to ${active.toLocaleString()} active subscribers`}
          </Btn>
        </Card>

        {/* Subscribers list */}
        <Card>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
            <Mail size={14} className="text-zinc-600" />
            <span className="text-sm font-semibold text-zinc-300">Subscribers</span>
            <span className="ml-auto text-xs text-zinc-600">{total.toLocaleString()} total</span>
          </div>

          {isLoading ? <Spinner /> : subscribers.length === 0 ? (
            <Empty message="No subscribers yet" />
          ) : (
            <>
              <Table>
                <thead>
                  <tr><Th>Email</Th><Th>Status</Th><Th>Joined</Th></tr>
                </thead>
                <tbody>
                  {subscribers.map(s => (
                    <tr key={s._id} className="hover:bg-zinc-800/30 transition-colors">
                      <Td className="text-xs font-mono">
                        {s.email.replace(/(.{2}).+(@.+)/, "$1***$2")}
                      </Td>
                      <Td>
                        <Badge color={s.isActive ? "active" : "banned"}>
                          {s.isActive ? "Active" : "Unsub"}
                        </Badge>
                      </Td>
                      <Td className="text-xs text-zinc-600 whitespace-nowrap">
                        {formatDate(s.createdAt)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pagination page={page} total={total} limit={30} onChange={setPage} />
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
}
