import { useState } from "react";
import { useBroadcastPush } from "../hooks/useBlogs";
import Layout from "../components/layout/Layout";
import { Card, StatCard, FormGroup, Input, Textarea, Btn, SectionHead } from "../components/ui";
import type { PushBroadcastPayload } from "../types";
import { Bell, Send, Smartphone, CheckCircle2 } from "lucide-react";

const HISTORY = [
  { title: "Governor signs new education bill", devices: 1821, date: "3h ago", openRate: 42 },
  { title: "Weekly Digest — Top Stories",       devices: 1799, date: "Yesterday", openRate: 38 },
  { title: "BREAKING: Flood Alert in Ede",      devices: 1750, date: "2d ago", openRate: 71 },
];

export default function Push() {
  const broadcastMut = useBroadcastPush();
  const [form, setForm] = useState<PushBroadcastPayload>({ title: "", body: "", url: "" });

  const handleBroadcast = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    await broadcastMut.mutateAsync(form);
    setForm({ title: "", body: "", url: "" });
  };

  const preview = {
    title: form.title || "Notification Title",
    body:  form.body  || "Your message will appear here…",
  };

  return (
    <Layout title="Push Notifications">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Subscribers" value={1842} accent="bg-green-500" sub="Push-enabled devices" subColor="text-green-400" icon={Smartphone} />
        <StatCard label="Sent This Month" value={14}   accent="bg-blue-500" />
        <StatCard label="Expired Removed" value={38}   accent="bg-red-500"  sub="Auto-cleaned" />
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-5">
        {/* Compose */}
        <Card className="p-5">
          <SectionHead title="Send Push Broadcast" />

          <FormGroup label="Notification Title">
            <Input placeholder="e.g. Breaking: New development in Osun…"
              value={form.title} maxLength={80}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </FormGroup>

          <FormGroup label="Body">
            <Textarea rows={3} placeholder="Short description shown under the title…"
              value={form.body} maxLength={200}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          </FormGroup>

          <FormGroup label="Link URL (optional)">
            <Input placeholder="/articles/some-article-slug"
              value={form.url ?? ""} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </FormGroup>

          {/* Preview */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Preview</p>
            <div className="flex items-center gap-3 bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <Bell size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{preview.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{preview.body}</p>
              </div>
            </div>
          </div>

          <Btn variant="primary" onClick={handleBroadcast}
            loading={broadcastMut.isPending} className="w-full justify-center">
            <Send size={14} />
            {broadcastMut.isPending ? "Broadcasting…" : "Broadcast to 1,842 devices"}
          </Btn>

          <div className="mt-4 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
            <p className="text-xs text-blue-400 font-semibold mb-2">How push works</p>
            <ul className="text-xs text-zinc-500 space-y-1.5">
              <li>✦ When a writer publishes, all their followers get notified automatically</li>
              <li>✦ Breaking news alerts are sent to ALL push subscribers instantly</li>
              <li>✦ Works even when users have the site closed — like YouTube</li>
            </ul>
          </div>
        </Card>

        {/* History */}
        <Card className="p-5">
          <SectionHead title="Recent Broadcasts" />
          <div className="space-y-0">
            {HISTORY.map((h, i) => (
              <div key={i} className="flex items-start gap-3 py-4 border-b border-zinc-800 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={15} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-zinc-300 font-medium leading-snug line-clamp-2">{h.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-600">
                    <Smartphone size={10} />
                    <span>{h.devices.toLocaleString()} devices</span>
                    <span>·</span>
                    <span>{h.openRate}% open</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 mt-0.5">{h.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
