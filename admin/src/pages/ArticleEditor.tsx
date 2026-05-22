
// import { useCallback, useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router";
// import { useEditor, EditorContent, type Editor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import TiptapImage from "@tiptap/extension-image";
// import Link from "@tiptap/extension-link";
// import Placeholder from "@tiptap/extension-placeholder";
// import CharacterCount from "@tiptap/extension-character-count";
// import TextAlign from "@tiptap/extension-text-align";
// import Underline from "@tiptap/extension-underline";
// import Highlight from "@tiptap/extension-highlight";
// import { Color, TextStyle } from "@tiptap/extension-text-style";
// import Subscript from "@tiptap/extension-subscript";
// import Superscript from "@tiptap/extension-superscript";
// import Youtube from "@tiptap/extension-youtube";

// import {
//   Bold, Italic, Underline as UnderlineIcon, Strikethrough,
//   Code, Heading1, Heading2, Heading3,
//   List, ListOrdered, Quote, Minus,
//   AlignLeft, AlignCenter, AlignRight, AlignJustify,
//   Link2, Link2Off, Image as ImageIcon,
//   Play as YoutubeIcon,
//   Undo, Redo, Highlighter,
//   Subscript as SubIcon, Superscript as SupIcon,
//   Save, Eye, Send, ChevronDown, X, Check, Clock,
//   AlertTriangle, FileText, Settings, Tag, Layers, Globe, Search,
// } from "lucide-react";

// import { useCategories } from "../hooks/useBlogs";
// import { useArticle, useCreateArticle, useUpdateArticle } from "../hooks/useArticles";

// import FeaturedImageUploader, { type UploadedImage } from "../components/Featuredimageuploader";
// import Layout from "../components/layout/Layout";
// import { Btn, Spinner } from "../components/ui";
// import type { ArticleStatus } from "../types";
// import toast from "react-hot-toast";

// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────
// interface ArticleForm {
//   title: string;
//   excerpt: string;
//   category: string;
//   tags: string[];
//   status: ArticleStatus;
//   isBreaking: boolean;
//   isFeatured: boolean;
//   isPinned: boolean;
//   allowComments: boolean;
//   scheduledAt: string;
//   // ✅ Store both url and fileId so deletion works correctly on the backend
//   featuredImageUrl: string;
//   featuredImageFileId: string;
//   featuredImageFile: File | null;
//   seo: {
//     metaTitle: string;
//     metaDescription: string;
//     canonicalUrl: string;
//     noIndex: boolean;
//   };
// }

// const EMPTY_FORM: ArticleForm = {
//   title: "",
//   excerpt: "",
//   category: "",
//   tags: [],
//   status: "draft",
//   isBreaking: false,
//   isFeatured: false,
//   isPinned: false,
//   allowComments: true,
//   scheduledAt: "",
//   featuredImageUrl: "",
//   featuredImageFileId: "",
//   featuredImageFile: null,
//   seo: { metaTitle: "", metaDescription: "", canonicalUrl: "", noIndex: false },
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Small shared UI atoms
// // ─────────────────────────────────────────────────────────────────────────────
// function ToolbarBtn({
//   onClick, active = false, disabled = false, title, children,
// }: {
//   onClick: () => void; active?: boolean; disabled?: boolean;
//   title: string; children: React.ReactNode;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       disabled={disabled}
//       title={title}
//       className={`
//         p-1.5 rounded transition-all duration-150 flex items-center justify-center
//         ${active ? "bg-red-600 text-white shadow-sm"
//           : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"}
//         ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
//       `}
//     >
//       {children}
//     </button>
//   );
// }

// function Divider() {
//   return <div className="w-px h-5 bg-zinc-700 mx-1 shrink-0" />;
// }

// function SideSection({ title, icon: Icon, children }: {
//   title: string; icon: React.ElementType; children: React.ReactNode;
// }) {
//   return (
//     <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
//       <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
//         <Icon size={13} className="text-red-400" />
//         <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
//           {title}
//         </span>
//       </div>
//       <div className="p-4 space-y-3">{children}</div>
//     </div>
//   );
// }

// function Toggle({ checked, onChange, label }: {
//   checked: boolean; onChange: (v: boolean) => void; label: string;
// }) {
//   return (
//     <label className="flex items-center justify-between cursor-pointer group">
//       <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
//         {label}
//       </span>
//       <div
//         onClick={() => onChange(!checked)}
//         className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${checked ? "bg-red-600" : "bg-zinc-700"
//           }`}
//       >
//         <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"
//           }`} />
//       </div>
//     </label>
//   );
// }

// function NativeSelect({ value, onChange, children }: {
//   value: string; onChange: (v: string) => void; children: React.ReactNode;
// }) {
//   return (
//     <div className="relative">
//       <select
//         value={value}
//         onChange={e => onChange(e.target.value)}
//         className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors pr-8 cursor-pointer"
//       >
//         {children}
//       </select>
//       <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Inline modals for Link / Image / YouTube
// // ─────────────────────────────────────────────────────────────────────────────
// function LinkModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
//   const [url, setUrl] = useState(editor.getAttributes("link").href ?? "");
//   const apply = () => {
//     if (!url) editor.chain().focus().unsetLink().run();
//     else editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
//     onClose();
//   };
//   return (
//     <div className="absolute z-50 top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl w-80">
//       <p className="text-xs text-zinc-400 mb-2 font-medium">Insert Link</p>
//       <input autoFocus value={url} onChange={e => setUrl(e.target.value)}
//         onKeyDown={e => e.key === "Enter" && apply()}
//         placeholder="https://…"
//         className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-red-500" />
//       <div className="flex gap-2 mt-2">
//         <button onClick={apply} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded transition-colors">Apply</button>
//         <button onClick={onClose} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded transition-colors">Cancel</button>
//       </div>
//     </div>
//   );
// }

// function ImageModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
//   const [url, setUrl] = useState("");
//   const [alt, setAlt] = useState("");
//   const apply = () => {
//     if (url) editor.chain().focus().setImage({ src: url, alt }).run();
//     onClose();
//   };
//   return (
//     <div className="absolute z-50 top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl w-80">
//       <p className="text-xs text-zinc-400 mb-2 font-medium">Insert Image</p>
//       <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Image URL…"
//         className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-red-500 mb-2" />
//       <input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Alt text (optional)…"
//         className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-red-500" />
//       <div className="flex gap-2 mt-2">
//         <button onClick={apply} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded transition-colors">Insert</button>
//         <button onClick={onClose} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded transition-colors">Cancel</button>
//       </div>
//     </div>
//   );
// }

// function YoutubeModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
//   const [url, setUrl] = useState("");
//   const apply = () => {
//     if (url) editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
//     onClose();
//   };
//   return (
//     <div className="absolute z-50 top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl w-80">
//       <p className="text-xs text-zinc-400 mb-2 font-medium">Embed YouTube Video</p>
//       <input value={url} onChange={e => setUrl(e.target.value)} placeholder="YouTube URL…"
//         className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-red-500" />
//       <div className="flex gap-2 mt-2">
//         <button onClick={apply} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded transition-colors">Embed</button>
//         <button onClick={onClose} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded transition-colors">Cancel</button>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Toolbar
// // ─────────────────────────────────────────────────────────────────────────────
// function EditorToolbar({ editor }: { editor: Editor }) {
//   const [linkOpen, setLinkOpen] = useState(false);
//   const [imageOpen, setImageOpen] = useState(false);
//   const [ytOpen, setYtOpen] = useState(false);
//   const closeAll = () => { setLinkOpen(false); setImageOpen(false); setYtOpen(false); };

//   return (
//     <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800">
//       {/* Row 1 */}
//       <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-zinc-800/60">
//         <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
//           <Undo size={14} />
//         </ToolbarBtn>
//         <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
//           <Redo size={14} />
//         </ToolbarBtn>
//         <Divider />

//         {([1, 2, 3] as const).map(level => {
//           const Icon = level === 1 ? Heading1 : level === 2 ? Heading2 : Heading3;
//           return (
//             <ToolbarBtn key={level} title={`Heading ${level}`}
//               active={editor.isActive("heading", { level })}
//               onClick={() => editor.chain().focus().toggleHeading({ level }).run()}>
//               <Icon size={14} />
//             </ToolbarBtn>
//           );
//         })}
//         <Divider />

//         <ToolbarBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Inline Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Subscript" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}><SubIcon size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Superscript" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}><SupIcon size={14} /></ToolbarBtn>
//       </div>

//       {/* Row 2 */}
//       <div className="flex flex-wrap items-center gap-0.5 px-3 py-2">
//         {(["left", "center", "right", "justify"] as const).map(align => {
//           const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : align === "right" ? AlignRight : AlignJustify;
//           return (
//             <ToolbarBtn key={align} title={`Align ${align}`}
//               active={editor.isActive({ textAlign: align })}
//               onClick={() => editor.chain().focus().setTextAlign(align).run()}>
//               <Icon size={14} />
//             </ToolbarBtn>
//           );
//         })}
//         <Divider />

//         <ToolbarBtn title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Code Block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><FileText size={14} /></ToolbarBtn>
//         <ToolbarBtn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={14} /></ToolbarBtn>
//         <Divider />

//         {/* Link */}
//         <div className="relative">
//           <ToolbarBtn title="Link" active={editor.isActive("link")} onClick={() => { closeAll(); setLinkOpen(v => !v); }}>
//             <Link2 size={14} />
//           </ToolbarBtn>
//           {linkOpen && <LinkModal editor={editor} onClose={() => setLinkOpen(false)} />}
//         </div>
//         {editor.isActive("link") && (
//           <ToolbarBtn title="Remove Link" onClick={() => editor.chain().focus().unsetLink().run()}>
//             <Link2Off size={14} />
//           </ToolbarBtn>
//         )}

//         {/* Image (embed by URL) */}
//         <div className="relative">
//           <ToolbarBtn title="Embed Image URL" onClick={() => { closeAll(); setImageOpen(v => !v); }}>
//             <ImageIcon size={14} />
//           </ToolbarBtn>
//           {imageOpen && <ImageModal editor={editor} onClose={() => setImageOpen(false)} />}
//         </div>

//         {/* YouTube */}
//         <div className="relative">
//           <ToolbarBtn title="YouTube" onClick={() => { closeAll(); setYtOpen(v => !v); }}>
//             <YoutubeIcon size={14} />
//           </ToolbarBtn>
//           {ytOpen && <YoutubeModal editor={editor} onClose={() => setYtOpen(false)} />}
//         </div>

//         <div className="ml-auto flex items-center gap-3 text-[11px] text-zinc-600 font-mono select-none">
//           <span>{editor.storage.characterCount?.words() ?? 0} words</span>
//           <span>{editor.storage.characterCount?.characters() ?? 0} chars</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tag input
// // ─────────────────────────────────────────────────────────────────────────────
// function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
//   const [input, setInput] = useState("");
//   const add = () => {
//     const v = input.trim().toLowerCase();
//     if (v && !tags.includes(v)) onChange([...tags, v]);
//     setInput("");
//   };
//   return (
//     <div>
//       <div className="flex gap-2 mb-2">
//         <input value={input} onChange={e => setInput(e.target.value)}
//           onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
//           placeholder="Add tag, press Enter…"
//           className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors" />
//         <button type="button" onClick={add}
//           className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded-lg transition-colors">
//           Add
//         </button>
//       </div>
//       <div className="flex flex-wrap gap-1.5">
//         {tags.map(t => (
//           <span key={t} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-full border border-zinc-700">
//             <Tag size={10} className="text-red-400" />{t}
//             <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}
//               className="ml-0.5 text-zinc-500 hover:text-red-400 transition-colors">
//               <X size={10} />
//             </button>
//           </span>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Main page
// // ─────────────────────────────────────────────────────────────────────────────
// export default function ArticleEditor() {
//   const navigate = useNavigate();
//   const { id } = useParams<{ id?: string }>();
//   const isEditing = Boolean(id);

//   const { data: categories = [], isLoading: catsLoading } = useCategories();
//   const { data: existingArticle, isLoading: articleLoading } = useArticle(id);

//   const createMut = useCreateArticle();
//   const updateMut = useUpdateArticle();

//   const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
//   const [savedId, setSavedId] = useState<string | undefined>(id);
//   const [tab, setTab] = useState<"write" | "preview">("write");
//   const [sideTab, setSideTab] = useState<"settings" | "seo">("settings");

//   const saving = createMut.isPending || updateMut.isPending;
//   const patchForm = (p: Partial<ArticleForm>) => setForm(f => ({ ...f, ...p }));
//   const patchSeo = (p: Partial<ArticleForm["seo"]>) =>
//     setForm(f => ({ ...f, seo: { ...f.seo, ...p } }));

//   // ── Populate form when editing ─────────────────────────────────────────────
//   useEffect(() => {
//     if (!existingArticle) return;
//     const a = existingArticle;
//     setForm({
//       title: a.title,
//       excerpt: a.excerpt ?? "",
//       category: typeof a.category === "object" ? (a.category as any)._id : a.category,
//       tags: (a.tags as any[]).map(t => (typeof t === "object" ? t.name : t)),
//       status: a.status,
//       isBreaking: a.isBreaking,
//       isFeatured: a.isFeatured,
//       isPinned: a.isPinned,
//       allowComments: a.allowComments,
//       scheduledAt: a.scheduledAt ? a.scheduledAt.slice(0, 16) : "",
//       featuredImageUrl: a.featuredImage?.url ?? "",
//       featuredImageFileId: a.featuredImage?.fileId ?? "",
//       featuredImageFile: null,   // ✅ add this — no File on load, URL already saved
//       seo: {
//         metaTitle: a.seo?.metaTitle ?? "",
//         metaDescription: a.seo?.metaDescription ?? "",
//         canonicalUrl: a.seo?.canonicalUrl ?? "",
//         noIndex: a.seo?.noIndex ?? false,
//       },
//     });
//   }, [existingArticle]);

//   // ── Tiptap editor ──────────────────────────────────────────────────────────
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Underline,
//       TextStyle,
//       Color,
//       Highlight.configure({ multicolor: true }),
//       TextAlign.configure({ types: ["heading", "paragraph"] }),
//       Link.configure({ openOnClick: false, autolink: true }),
//       TiptapImage.configure({ inline: false, allowBase64: false }),
//       Subscript,
//       Superscript,
//       CharacterCount,
//       Youtube.configure({ controls: true }),
//       Placeholder.configure({
//         placeholder: "Start writing your article… Use the toolbar to format content.",
//       }),
//     ],
//     editorProps: {
//       attributes: {
//         class: [
//           "prose prose-invert prose-zinc max-w-none min-h-[480px] outline-none p-6",
//           "prose-headings:font-bold prose-headings:text-zinc-100",
//           "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
//           "prose-p:text-zinc-300 prose-p:leading-relaxed",
//           "prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline",
//           "prose-blockquote:border-l-red-500 prose-blockquote:text-zinc-400",
//           "prose-code:bg-zinc-800 prose-code:text-red-300 prose-code:px-1 prose-code:rounded",
//           "prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-700",
//           "prose-img:rounded-lg prose-img:border prose-img:border-zinc-700",
//           "prose-strong:text-zinc-100 prose-em:text-zinc-300",
//           "prose-li:text-zinc-300 prose-hr:border-zinc-700",
//         ].join(" "),
//       },
//     },
//     content: existingArticle?.content ?? "",
//   });

//   useEffect(() => {
//     if (editor && existingArticle?.content && editor.isEmpty) {
//       editor.commands.setContent(existingArticle.content);
//     }
//   }, [editor, existingArticle?.content]);

//   const wordCount = editor?.storage.characterCount?.words() ?? 0;
//   const readTime = Math.max(1, Math.ceil(wordCount / 200));

//   // ── Save handler ───────────────────────────────────────────────────────────
//   const handleSave = useCallback(
//     async (statusOverride?: ArticleStatus) => {
//       if (!form.title.trim()) { toast.error("Title is required."); return; }
//       if (!form.category) { toast.error("Please select a category."); return; }
//       if (!editor) return;

//       const html = editor.getHTML();
//       if (!html || html === "<p></p>") { toast.error("Content cannot be empty."); return; }

//       // ✅ Build FormData instead of a plain object
//       const fd = new FormData();

//       fd.append("title", form.title.trim());
//       fd.append("content", html);
//       fd.append("category", form.category);
//       fd.append("status", statusOverride ?? form.status);
//       fd.append("isBreaking", String(form.isBreaking));
//       fd.append("isFeatured", String(form.isFeatured));
//       fd.append("isPinned", String(form.isPinned));
//       fd.append("allowComments", String(form.allowComments));

//       if (form.excerpt) fd.append("excerpt", form.excerpt);
//       if (form.scheduledAt) fd.append("scheduledAt", form.scheduledAt);

//       // ✅ Tags: append each one individually so the backend gets a real array
//       form.tags.forEach(tag => fd.append("tags[]", tag));

//       // ✅ SEO
//       if (form.seo.metaTitle) fd.append("seo[metaTitle]", form.seo.metaTitle);
//       if (form.seo.metaDescription) fd.append("seo[metaDescription]", form.seo.metaDescription);
//       if (form.seo.canonicalUrl) fd.append("seo[canonicalUrl]", form.seo.canonicalUrl);
//       fd.append("seo[noIndex]", String(form.seo.noIndex));

//       // ✅ Featured image: if uploader gave us a File object, append as file;
//       //    otherwise pass the existing url+fileId so the backend keeps it
//       if (form.featuredImageFile) {
//         // new upload — send the actual file under req.files.featuredImage
//         fd.append("featuredImage", form.featuredImageFile);
//       } else if (form.featuredImageUrl) {
//         // already uploaded — tell the backend to keep the existing image
//         fd.append("featuredImageUrl", form.featuredImageUrl);
//         fd.append("featuredImageFileId", form.featuredImageFileId);
//       }
//       // if both are empty → backend treats featuredImage as null (deletion)

//       try {
//         if (isEditing && savedId) {
//           await updateMut.mutateAsync({ id: savedId, data: fd });
//           navigate("/articles");
//         } else {
//           const res = await createMut.mutateAsync(fd);
//           const newId = (res as any)?.data?.article?._id;
//           navigate("/articles");
//           if (newId) {
//             setSavedId(newId);
//             navigate(`/articles/${newId}/edit`, { replace: true });
//           }

//         }
//       } catch {
//         // errors toasted inside hook
//       }
//     },
//     [form, editor, isEditing, savedId, createMut, updateMut, navigate]
//   );

//   // ── Status badge colour ────────────────────────────────────────────────────
//   const statusColor: Record<ArticleStatus, string> = {
//     draft: "text-zinc-400 bg-zinc-800 border-zinc-700",
//     scheduled: "text-amber-400 bg-amber-950 border-amber-800",
//     published: "text-emerald-400 bg-emerald-950 border-emerald-800",
//     archived: "text-zinc-500 bg-zinc-900 border-zinc-800",
//   };

//   const titleLeft = 250 - form.title.length;

//   if (isEditing && articleLoading) {
//     return (
//       <Layout title="Edit Article">
//         <div className="flex items-center justify-center py-20">
//           <Spinner />
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout
//       title={isEditing ? "Edit Article" : "New Article"}
//       action={
//         <div className="flex items-center gap-2">
//           <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColor[form.status]}`}>
//             {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
//           </span>
//           <Btn size="sm" onClick={() => handleSave("draft")} loading={saving}>
//             <Save size={13} /> Save Draft
//           </Btn>
//           {form.status === "scheduled"
//             ? <Btn size="sm" variant="primary" onClick={() => handleSave("scheduled")} loading={saving}>
//               <Clock size={13} /> Schedule
//             </Btn>
//             : <Btn size="sm" variant="primary" onClick={() => handleSave("published")} loading={saving}>
//               <Send size={13} /> Publish
//             </Btn>
//           }
//         </div>
//       }
//     >
//       <div className="flex gap-5 items-start">

//         {/* ── LEFT: Editor ─────────────────────────────────────────────────── */}
//         <div className="flex-1 min-w-0 space-y-4">

//           {/* Title + Excerpt */}
//           <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
//             <div className="px-6 pt-5 pb-3">
//               <textarea
//                 value={form.title}
//                 onChange={e => patchForm({ title: e.target.value })}
//                 placeholder="Article title…"
//                 maxLength={250}
//                 rows={2}
//                 className="w-full bg-transparent text-2xl font-bold text-zinc-100 outline-none resize-none placeholder:text-zinc-600 leading-snug"
//               />
//               <div className="flex justify-end mt-1">
//                 <span className={`text-xs font-mono ${titleLeft < 20 ? "text-red-400" : titleLeft < 50 ? "text-amber-400" : "text-zinc-600"
//                   }`}>
//                   {form.title.length}/250
//                 </span>
//               </div>
//             </div>
//             <div className="px-6 pb-4 border-t border-zinc-800/60 pt-3">
//               <textarea
//                 value={form.excerpt}
//                 onChange={e => patchForm({ excerpt: e.target.value })}
//                 placeholder="Short excerpt or summary (optional, max 500 chars)…"
//                 maxLength={500}
//                 rows={2}
//                 className="w-full bg-transparent text-sm text-zinc-400 outline-none resize-none placeholder:text-zinc-600 leading-relaxed"
//               />
//             </div>
//           </div>

//           {/* Editor */}
//           <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
//             <div className="flex border-b border-zinc-800">
//               {(["write", "preview"] as const).map(t => (
//                 <button key={t} onClick={() => setTab(t)}
//                   className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors capitalize
//                     ${tab === t ? "text-zinc-100 border-b-2 border-red-500 -mb-px" : "text-zinc-500 hover:text-zinc-300"}`}>
//                   {t === "write" ? <FileText size={13} /> : <Eye size={13} />}
//                   {t}
//                 </button>
//               ))}
//               <div className="ml-auto flex items-center gap-3 px-4 text-xs text-zinc-600">
//                 <span>{readTime} min read</span>
//                 <span>{wordCount} words</span>
//               </div>
//             </div>

//             {tab === "write" ? (
//               editor ? (
//                 <>
//                   <EditorToolbar editor={editor} />
//                   <EditorContent editor={editor} />
//                 </>
//               ) : <div className="p-8 flex justify-center"><Spinner /></div>
//             ) : (
//               <div
//                 className="prose prose-invert prose-zinc max-w-none p-6 min-h-50"
//                 dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? "" }}
//               />
//             )}
//           </div>
//         </div>

//         {/* ── RIGHT: Sidebar ───────────────────────────────────────────────── */}
//         <div className="w-72 shrink-0 space-y-4">

//           <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
//             {(["settings", "seo"] as const).map(t => (
//               <button key={t} onClick={() => setSideTab(t)}
//                 className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors
//                   ${sideTab === t ? "text-zinc-100 bg-zinc-800" : "text-zinc-500 hover:text-zinc-300"}`}>
//                 {t === "settings" ? <Settings size={12} /> : <Search size={12} />}
//                 {t === "settings" ? "Settings" : "SEO"}
//               </button>
//             ))}
//           </div>

//           {sideTab === "settings" ? (
//             <>
//               <SideSection title="Featured Image" icon={ImageIcon}>
//                 {/*
//                   ✅ FeaturedImageUploader now calls onChange with the full
//                   UploadedImage object (url + fileId), or null when cleared.
//                   We store both in form state so the backend can save/delete correctly.
//                 */}
//                 <FeaturedImageUploader
//                   value={form.featuredImageUrl}
//                   onChange={(image: UploadedImage | null, file?: File) => {  // ✅ accept file as 2nd arg
//                     patchForm({
//                       featuredImageUrl: image?.url ?? "",
//                       featuredImageFileId: image?.fileId ?? "",
//                       featuredImageFile: file ?? null,   // ✅ store the raw File
//                     });
//                   }}
//                   folder="/articles/featured"
//                 />
//               </SideSection>

//               <SideSection title="Status" icon={Layers}>
//                 <NativeSelect value={form.status} onChange={v => patchForm({ status: v as ArticleStatus })}>
//                   <option value="draft">Draft</option>
//                   <option value="published">Published</option>
//                   <option value="scheduled">Scheduled</option>
//                   <option value="archived">Archived</option>
//                 </NativeSelect>
//                 {form.status === "scheduled" && (
//                   <div>
//                     <label className="text-xs text-zinc-500 mb-1 block">Publish date & time</label>
//                     <input
//                       type="datetime-local"
//                       value={form.scheduledAt}
//                       onChange={e => patchForm({ scheduledAt: e.target.value })}
//                       className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors"
//                     />
//                   </div>
//                 )}
//               </SideSection>

//               <SideSection title="Category" icon={Layers}>
//                 {catsLoading ? <Spinner /> : (
//                   <NativeSelect value={form.category} onChange={v => patchForm({ category: v })}>
//                     <option value="">Select category…</option>
//                     {categories.map(c => (
//                       <option key={c._id} value={c._id}>{c.name}</option>
//                     ))}
//                   </NativeSelect>
//                 )}
//               </SideSection>

//               <SideSection title="Tags" icon={Tag}>
//                 <TagInput tags={form.tags} onChange={tags => patchForm({ tags })} />
//               </SideSection>

//               <SideSection title="Options" icon={Settings}>
//                 <Toggle checked={form.isBreaking} onChange={v => patchForm({ isBreaking: v })} label="Breaking News" />
//                 <Toggle checked={form.isFeatured} onChange={v => patchForm({ isFeatured: v })} label="Featured Article" />
//                 <Toggle checked={form.isPinned} onChange={v => patchForm({ isPinned: v })} label="Pin to Top" />
//                 <Toggle checked={form.allowComments} onChange={v => patchForm({ allowComments: v })} label="Allow Comments" />
//               </SideSection>

//               <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-2 gap-3">
//                 {[
//                   { label: "Words", value: wordCount },
//                   { label: "Read", value: `${readTime}m` },
//                   { label: "Title", value: `${form.title.length}/250` },
//                   { label: "Excerpt", value: `${form.excerpt.length}/500` },
//                 ].map(s => (
//                   <div key={s.label} className="text-center">
//                     <p className="text-lg font-bold text-zinc-100 font-mono">{s.value}</p>
//                     <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{s.label}</p>
//                   </div>
//                 ))}
//               </div>
//             </>
//           ) : (
//             <>
//               <SideSection title="SEO" icon={Search}>
//                 <div>
//                   <label className="text-xs text-zinc-500 mb-1 flex justify-between">
//                     Meta  Title headline that appears in Google search results <span className="font-mono">{form.seo.metaTitle.length}/70</span>
//                   </label>
//                   <input value={form.seo.metaTitle} maxLength={70}
//                     onChange={e => patchSeo({ metaTitle: e.target.value })}
//                     placeholder="SEO title…"
//                     className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors" />
//                 </div>
//                 <div>
//                   <label className="text-xs text-zinc-500 mb-1 flex justify-between">
//                     Meta Description related to the post article <span className="font-mono">{form.seo.metaDescription.length}/160</span>
//                   </label>
//                   <textarea value={form.seo.metaDescription} maxLength={160} rows={3}
//                     onChange={e => patchSeo({ metaDescription: e.target.value })}
//                     placeholder="SEO description…"
//                     className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors resize-none" />
//                 </div>
//                 <div>
//                   <label className="text-xs text-zinc-500 mb-1 block">Canonical URL copy a trending news article from another website</label>
//                   <input value={form.seo.canonicalUrl}
//                     onChange={e => patchSeo({ canonicalUrl: e.target.value })}
//                     placeholder="https://… "
//                     className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors" />
//                 </div>
//                 <Toggle checked={form.seo.noIndex} onChange={v => patchSeo({ noIndex: v })} label="No Index (hide from Google)" />
//               </SideSection>

//               <SideSection title="Search Preview" icon={Globe}>
//                 <div className="bg-zinc-800 rounded-lg p-3 space-y-0.5">
//                   <p className="text-[11px] text-zinc-500 truncate">
//                     yoursite.com › {categories.find(c => c._id === form.category)?.slug ?? "category"} › slug
//                   </p>
//                   <p className="text-sm text-blue-400 font-medium leading-snug line-clamp-2">
//                     {form.seo.metaTitle || form.title || "Article Title"}
//                   </p>
//                   <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
//                     {form.seo.metaDescription || form.excerpt || "Article description will appear here…"}
//                   </p>
//                 </div>

//                 <div className="space-y-1.5 mt-1">
//                   {[
//                     {
//                       label: "Title length (30–70)",
//                       ok: form.seo.metaTitle.length >= 30 && form.seo.metaTitle.length <= 70,
//                       warn: form.seo.metaTitle.length > 0 && form.seo.metaTitle.length < 30,
//                     },
//                     {
//                       label: "Description length (70–160)",
//                       ok: form.seo.metaDescription.length >= 70 && form.seo.metaDescription.length <= 160,
//                       warn: form.seo.metaDescription.length > 0 && form.seo.metaDescription.length < 70,
//                     },
//                     {
//                       label: "Excerpt provided",
//                       ok: form.excerpt.length > 0,
//                       warn: false,
//                     },
//                     {
//                       label: "Featured image set",
//                       ok: Boolean(form.featuredImageUrl),
//                       warn: false,
//                     },
//                   ].map(item => (
//                     <div key={item.label} className="flex items-center gap-2">
//                       {item.ok
//                         ? <Check size={11} className="text-emerald-400 shrink-0" />
//                         : item.warn
//                           ? <AlertTriangle size={11} className="text-amber-400 shrink-0" />
//                           : <X size={11} className="text-zinc-600 shrink-0" />}
//                       <span className="text-xs text-zinc-500">{item.label}</span>
//                     </div>
//                   ))}
//                 </div>
//               </SideSection>
//             </>
//           )}
//         </div>
//       </div>
//     </Layout>
//   );
// }



import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Youtube from "@tiptap/extension-youtube";

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link2, Link2Off, Image as ImageIcon,
  Play as YoutubeIcon,
  Undo, Redo, Highlighter,
  Subscript as SubIcon, Superscript as SupIcon,
  Save, Eye, Send, ChevronDown, X, Check, Clock,
  AlertTriangle, FileText, Settings, Tag, Layers, Globe, Search,
} from "lucide-react";

import { useCategories } from "../hooks/useBlogs";
import { useArticle, useCreateArticle, useUpdateArticle } from "../hooks/useArticles";

import FeaturedImageUploader, { type UploadedImage } from "../components/Featuredimageuploader";
import Layout from "../components/layout/Layout";
import { Btn, Spinner } from "../components/ui";
import type { ArticleStatus } from "../types";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ArticleForm {
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
  isBreaking: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  allowComments: boolean;
  scheduledAt: string;
  // CDN URL + fileId only — we never store the raw File object.
  // The uploader handles the CDN upload itself; by the time onChange fires,
  // the image is already on ImageKit. We just persist the result.
  featuredImageUrl: string;
  featuredImageFileId: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    noIndex: boolean;
  };
}

const EMPTY_FORM: ArticleForm = {
  title: "",
  excerpt: "",
  category: "",
  tags: [],
  status: "draft",
  isBreaking: false,
  isFeatured: false,
  isPinned: false,
  allowComments: true,
  scheduledAt: "",
  featuredImageUrl: "",
  featuredImageFileId: "",
  // ✂️ featuredImageFile removed — no longer in form state
  seo: { metaTitle: "", metaDescription: "", canonicalUrl: "", noIndex: false },
};

// ─────────────────────────────────────────────────────────────────────────────
// Small shared UI atoms  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick, active = false, disabled = false, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded transition-all duration-150 flex items-center justify-center
        ${active ? "bg-red-600 text-white shadow-sm"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-zinc-700 mx-1 shrink-0" />;
}

function SideSection({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
        <Icon size={13} className="text-red-400" />
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
        {label}
      </span>
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${checked ? "bg-red-600" : "bg-zinc-700"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
    </label>
  );
}

function NativeSelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors pr-8 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline modals (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function LinkModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState(editor.getAttributes("link").href ?? "");
  const apply = () => {
    if (!url) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
    onClose();
  };
  return (
    <div className="absolute z-50 top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl w-80">
      <p className="text-xs text-zinc-400 mb-2 font-medium">Insert Link</p>
      <input autoFocus value={url} onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === "Enter" && apply()}
        placeholder="https://…"
        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-red-500" />
      <div className="flex gap-2 mt-2">
        <button onClick={apply} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded transition-colors">Apply</button>
        <button onClick={onClose} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function ImageModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const apply = () => {
    if (url) editor.chain().focus().setImage({ src: url, alt }).run();
    onClose();
  };
  return (
    <div className="absolute z-50 top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl w-80">
      <p className="text-xs text-zinc-400 mb-2 font-medium">Insert Image</p>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Image URL…"
        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-red-500 mb-2" />
      <input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Alt text (optional)…"
        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-red-500" />
      <div className="flex gap-2 mt-2">
        <button onClick={apply} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded transition-colors">Insert</button>
        <button onClick={onClose} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function YoutubeModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const apply = () => {
    if (url) editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
    onClose();
  };
  return (
    <div className="absolute z-50 top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl w-80">
      <p className="text-xs text-zinc-400 mb-2 font-medium">Embed YouTube Video</p>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="YouTube URL…"
        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-red-500" />
      <div className="flex gap-2 mt-2">
        <button onClick={apply} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded transition-colors">Embed</button>
        <button onClick={onClose} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function EditorToolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [ytOpen, setYtOpen] = useState(false);
  const closeAll = () => { setLinkOpen(false); setImageOpen(false); setYtOpen(false); };

  return (
    <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800">
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-zinc-800/60">
        <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo size={14} /></ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo size={14} /></ToolbarBtn>
        <Divider />
        {([1, 2, 3] as const).map(level => {
          const Icon = level === 1 ? Heading1 : level === 2 ? Heading2 : Heading3;
          return (
            <ToolbarBtn key={level} title={`Heading ${level}`} active={editor.isActive("heading", { level })}
              onClick={() => editor.chain().focus().toggleHeading({ level }).run()}><Icon size={14} /></ToolbarBtn>
          );
        })}
        <Divider />
        <ToolbarBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></ToolbarBtn>
        <ToolbarBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></ToolbarBtn>
        <ToolbarBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></ToolbarBtn>
        <ToolbarBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></ToolbarBtn>
        <ToolbarBtn title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter size={14} /></ToolbarBtn>
        <ToolbarBtn title="Inline Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={14} /></ToolbarBtn>
        <ToolbarBtn title="Subscript" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}><SubIcon size={14} /></ToolbarBtn>
        <ToolbarBtn title="Superscript" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}><SupIcon size={14} /></ToolbarBtn>
      </div>

      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2">
        {(["left", "center", "right", "justify"] as const).map(align => {
          const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : align === "right" ? AlignRight : AlignJustify;
          return (
            <ToolbarBtn key={align} title={`Align ${align}`} active={editor.isActive({ textAlign: align })}
              onClick={() => editor.chain().focus().setTextAlign(align).run()}><Icon size={14} /></ToolbarBtn>
          );
        })}
        <Divider />
        <ToolbarBtn title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></ToolbarBtn>
        <ToolbarBtn title="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></ToolbarBtn>
        <ToolbarBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></ToolbarBtn>
        <ToolbarBtn title="Code Block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><FileText size={14} /></ToolbarBtn>
        <ToolbarBtn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={14} /></ToolbarBtn>
        <Divider />

        <div className="relative">
          <ToolbarBtn title="Link" active={editor.isActive("link")} onClick={() => { closeAll(); setLinkOpen(v => !v); }}><Link2 size={14} /></ToolbarBtn>
          {linkOpen && <LinkModal editor={editor} onClose={() => setLinkOpen(false)} />}
        </div>
        {editor.isActive("link") && (
          <ToolbarBtn title="Remove Link" onClick={() => editor.chain().focus().unsetLink().run()}><Link2Off size={14} /></ToolbarBtn>
        )}
        <div className="relative">
          <ToolbarBtn title="Embed Image URL" onClick={() => { closeAll(); setImageOpen(v => !v); }}><ImageIcon size={14} /></ToolbarBtn>
          {imageOpen && <ImageModal editor={editor} onClose={() => setImageOpen(false)} />}
        </div>
        <div className="relative">
          <ToolbarBtn title="YouTube" onClick={() => { closeAll(); setYtOpen(v => !v); }}><YoutubeIcon size={14} /></ToolbarBtn>
          {ytOpen && <YoutubeModal editor={editor} onClose={() => setYtOpen(false)} />}
        </div>

        <div className="ml-auto flex items-center gap-3 text-[11px] text-zinc-600 font-mono select-none">
          <span>{editor.storage.characterCount?.words() ?? 0} words</span>
          <span>{editor.storage.characterCount?.characters() ?? 0} chars</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag input (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim().toLowerCase();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          placeholder="Add tag, press Enter…"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors" />
        <button type="button" onClick={add}
          className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded-lg transition-colors">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-full border border-zinc-700">
            <Tag size={10} className="text-red-400" />{t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}
              className="ml-0.5 text-zinc-500 hover:text-red-400 transition-colors"><X size={10} /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function ArticleEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: existingArticle, isLoading: articleLoading } = useArticle(id);

  const createMut = useCreateArticle();
  const updateMut = useUpdateArticle();

  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const [savedId, setSavedId] = useState<string | undefined>(id);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [sideTab, setSideTab] = useState<"settings" | "seo">("settings");

  const saving = createMut.isPending || updateMut.isPending;
  const patchForm = (p: Partial<ArticleForm>) => setForm(f => ({ ...f, ...p }));
  const patchSeo = (p: Partial<ArticleForm["seo"]>) =>
    setForm(f => ({ ...f, seo: { ...f.seo, ...p } }));

  // ── Populate form when editing ─────────────────────────────────────────────
  useEffect(() => {
    if (!existingArticle) return;
    const a = existingArticle;
    setForm({
      title:       a.title,
      excerpt:     a.excerpt ?? "",
      category:    typeof a.category === "object" ? (a.category as any)._id : a.category,
      tags:        (a.tags as any[]).map(t => (typeof t === "object" ? t.name : t)),
      status:      a.status,
      isBreaking:  a.isBreaking,
      isFeatured:  a.isFeatured,
      isPinned:    a.isPinned,
      allowComments: a.allowComments,
      scheduledAt: a.scheduledAt ? a.scheduledAt.slice(0, 16) : "",
      featuredImageUrl:    a.featuredImage?.url    ?? "",
      featuredImageFileId: a.featuredImage?.fileId ?? "",
      // ✂️ no featuredImageFile — we never store the raw File
      seo: {
        metaTitle:       a.seo?.metaTitle       ?? "",
        metaDescription: a.seo?.metaDescription ?? "",
        canonicalUrl:    a.seo?.canonicalUrl    ?? "",
        noIndex:         a.seo?.noIndex         ?? false,
      },
    });
  }, [existingArticle]);

  // ── Tiptap editor ──────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      TiptapImage.configure({ inline: false, allowBase64: false }),
      Subscript,
      Superscript,
      CharacterCount,
      Youtube.configure({ controls: true }),
      Placeholder.configure({
        placeholder: "Start writing your article… Use the toolbar to format content.",
      }),
    ],
    editorProps: {
      attributes: {
        class: [
          "prose prose-invert prose-zinc max-w-none min-h-[480px] outline-none p-6",
          "prose-headings:font-bold prose-headings:text-zinc-100",
          "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
          "prose-p:text-zinc-300 prose-p:leading-relaxed",
          "prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline",
          "prose-blockquote:border-l-red-500 prose-blockquote:text-zinc-400",
          "prose-code:bg-zinc-800 prose-code:text-red-300 prose-code:px-1 prose-code:rounded",
          "prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-700",
          "prose-img:rounded-lg prose-img:border prose-img:border-zinc-700",
          "prose-strong:text-zinc-100 prose-em:text-zinc-300",
          "prose-li:text-zinc-300 prose-hr:border-zinc-700",
        ].join(" "),
      },
    },
    content: existingArticle?.content ?? "",
  });

  useEffect(() => {
    if (editor && existingArticle?.content && editor.isEmpty) {
      editor.commands.setContent(existingArticle.content);
    }
  }, [editor, existingArticle?.content]);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = useCallback(
    async (statusOverride?: ArticleStatus) => {
      if (!form.title.trim())  { toast.error("Title is required.");          return; }
      if (!form.category)      { toast.error("Please select a category.");   return; }
      if (!editor)             return;

      const html = editor.getHTML();
      if (!html || html === "<p></p>") { toast.error("Content cannot be empty."); return; }

      const fd = new FormData();

      // ── Scalar fields ──────────────────────────────────────────────────────
      fd.append("title",         form.title.trim());
      fd.append("content",       html);
      fd.append("category",      form.category);
      fd.append("status",        statusOverride ?? form.status);
      fd.append("isBreaking",    String(form.isBreaking));
      fd.append("isFeatured",    String(form.isFeatured));
      fd.append("isPinned",      String(form.isPinned));
      fd.append("allowComments", String(form.allowComments));

      if (form.excerpt)     fd.append("excerpt",     form.excerpt);
      if (form.scheduledAt) fd.append("scheduledAt", form.scheduledAt);

      // ── Tags ───────────────────────────────────────────────────────────────
      form.tags.forEach(tag => fd.append("tags[]", tag));

      // ── SEO ────────────────────────────────────────────────────────────────
      if (form.seo.metaTitle)       fd.append("seo[metaTitle]",       form.seo.metaTitle);
      if (form.seo.metaDescription) fd.append("seo[metaDescription]", form.seo.metaDescription);
      if (form.seo.canonicalUrl)    fd.append("seo[canonicalUrl]",    form.seo.canonicalUrl);
      fd.append("seo[noIndex]", String(form.seo.noIndex));

      // ── Featured image ─────────────────────────────────────────────────────
      // The CDN upload already happened inside FeaturedImageUploader / useImageUpload.
      // We only ever send the resulting URL + fileId as plain text — never a File.
      // This means multer will never see a binary for featuredImage, so
      // req.files.featuredImage is always undefined, and the controller takes
      // the body.featuredImageUrl branch (no server-side ImageKit call → no timeout).
      if (form.featuredImageUrl) {
        fd.append("featuredImageUrl",    form.featuredImageUrl);
        fd.append("featuredImageFileId", form.featuredImageFileId ?? "");
      } else {
        // Explicit empty string signals the controller to clear the image
        fd.append("featuredImageUrl", "");
      }
      // ✂️ REMOVED — this was the bug that caused the timeout:
      // if (form.featuredImageFile) fd.append("featuredImage", form.featuredImageFile);

      try {
        if (isEditing && savedId) {
          await updateMut.mutateAsync({ id: savedId, data: fd });
          navigate("/articles");
        } else {
          const res   = await createMut.mutateAsync(fd);
          const newId = (res as any)?.data?.article?._id;
          navigate("/articles");
          if (newId) {
            setSavedId(newId);
            navigate(`/articles/${newId}/edit`, { replace: true });
          }
        }
      } catch {
        // errors are toasted inside the mutation hooks
      }
    },
    [form, editor, isEditing, savedId, createMut, updateMut, navigate]
  );

  // ── Status badge colour ────────────────────────────────────────────────────
  const statusColor: Record<ArticleStatus, string> = {
    draft:     "text-zinc-400 bg-zinc-800 border-zinc-700",
    scheduled: "text-amber-400 bg-amber-950 border-amber-800",
    published: "text-emerald-400 bg-emerald-950 border-emerald-800",
    archived:  "text-zinc-500 bg-zinc-900 border-zinc-800",
  };

  const titleLeft = 250 - form.title.length;

  if (isEditing && articleLoading) {
    return (
      <Layout title="Edit Article">
        <div className="flex items-center justify-center py-20"><Spinner /></div>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEditing ? "Edit Article" : "New Article"}
      action={
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColor[form.status]}`}>
            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
          </span>
          <Btn size="sm" onClick={() => handleSave("draft")} loading={saving}>
            <Save size={13} /> Save Draft
          </Btn>
          {form.status === "scheduled"
            ? <Btn size="sm" variant="primary" onClick={() => handleSave("scheduled")} loading={saving}>
                <Clock size={13} /> Schedule
              </Btn>
            : <Btn size="sm" variant="primary" onClick={() => handleSave("published")} loading={saving}>
                <Send size={13} /> Publish
              </Btn>
          }
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-5 items-start">

        {/* ── LEFT: Editor ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <textarea
                value={form.title}
                onChange={e => patchForm({ title: e.target.value })}
                placeholder="Article title…"
                maxLength={250}
                rows={2}
                className="w-full bg-transparent text-2xl font-bold text-zinc-100 outline-none resize-none placeholder:text-zinc-600 leading-snug"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs font-mono ${titleLeft < 20 ? "text-red-400" : titleLeft < 50 ? "text-amber-400" : "text-zinc-600"}`}>
                  {form.title.length}/250
                </span>
              </div>
            </div>
            <div className="px-6 pb-4 border-t border-zinc-800/60 pt-3">
              <textarea
                value={form.excerpt}
                onChange={e => patchForm({ excerpt: e.target.value })}
                placeholder="Short excerpt or summary (optional, max 500 chars)…"
                maxLength={500}
                rows={2}
                className="w-full bg-transparent text-sm text-zinc-400 outline-none resize-none placeholder:text-zinc-600 leading-relaxed"
              />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex border-b border-zinc-800">
              {(["write", "preview"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors capitalize
                    ${tab === t ? "text-zinc-100 border-b-2 border-red-500 -mb-px" : "text-zinc-500 hover:text-zinc-300"}`}>
                  {t === "write" ? <FileText size={13} /> : <Eye size={13} />}
                  {t}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-3 px-4 text-xs text-zinc-600">
                <span>{readTime} min read</span>
                <span>{wordCount} words</span>
              </div>
            </div>

            {tab === "write" ? (
              editor ? (
                <>
                  <EditorToolbar editor={editor} />
                  <EditorContent editor={editor} />
                </>
              ) : <div className="p-8 flex justify-center"><Spinner /></div>
            ) : (
              <div
                className="prose prose-invert prose-zinc max-w-none p-6 min-h-50"
                dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? "" }}
              />
            )}
          </div>
        </div>

        {/* ── RIGHT: Sidebar ─────────────────────────────────────────────── */}
        <div className="w-full md:w-80 shrink-0 space-y-4">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {(["settings", "seo"] as const).map(t => (
              <button key={t} onClick={() => setSideTab(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors
                  ${sideTab === t ? "text-zinc-100 bg-zinc-800" : "text-zinc-500 hover:text-zinc-300"}`}>
                {t === "settings" ? <Settings size={12} /> : <Search size={12} />}
                {t === "settings" ? "Settings" : "SEO"}
              </button>
            ))}
          </div>

          {sideTab === "settings" ? (
            <>
              <SideSection title="Featured Image" icon={ImageIcon}>
                {/*
                  onChange receives UploadedImage | null — no File arg.
                  The CDN upload is fully handled inside FeaturedImageUploader.
                  We only store url + fileId in form state.
                */}
                <FeaturedImageUploader
                  value={form.featuredImageUrl}
                  onChange={(image: UploadedImage | null) => {
                    patchForm({
                      featuredImageUrl:    image?.url    ?? "",
                      featuredImageFileId: image?.fileId ?? "",
                      // ✂️ no featuredImageFile
                    });
                  }}
                  folder="/articles/featured"
                />
              </SideSection>

              <SideSection title="Status" icon={Layers}>
                <NativeSelect value={form.status} onChange={v => patchForm({ status: v as ArticleStatus })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </NativeSelect>
                {form.status === "scheduled" && (
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Publish date & time</label>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={e => patchForm({ scheduledAt: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                )}
              </SideSection>

              <SideSection title="Category" icon={Layers}>
                {catsLoading ? <Spinner /> : (
                  <NativeSelect value={form.category} onChange={v => patchForm({ category: v })}>
                    <option value="">Select category…</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </NativeSelect>
                )}
              </SideSection>

              <SideSection title="Tags" icon={Tag}>
                <TagInput tags={form.tags} onChange={tags => patchForm({ tags })} />
              </SideSection>

              <SideSection title="Options" icon={Settings}>
                <Toggle checked={form.isBreaking}    onChange={v => patchForm({ isBreaking: v })}    label="Breaking News" />
                <Toggle checked={form.isFeatured}    onChange={v => patchForm({ isFeatured: v })}    label="Featured Article" />
                <Toggle checked={form.isPinned}      onChange={v => patchForm({ isPinned: v })}      label="Pin to Top" />
                <Toggle checked={form.allowComments} onChange={v => patchForm({ allowComments: v })} label="Allow Comments" />
              </SideSection>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Words",   value: wordCount },
                  { label: "Read",    value: `${readTime}m` },
                  { label: "Title",   value: `${form.title.length}/250` },
                  { label: "Excerpt", value: `${form.excerpt.length}/500` },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-lg font-bold text-zinc-100 font-mono">{s.value}</p>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <SideSection title="SEO" icon={Search}>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 flex justify-between">
                    Meta Title <span className="font-mono">{form.seo.metaTitle.length}/70</span>
                  </label>
                  <input value={form.seo.metaTitle} maxLength={70}
                    onChange={e => patchSeo({ metaTitle: e.target.value })}
                    placeholder="SEO title…"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 flex justify-between">
                    Meta Description <span className="font-mono">{form.seo.metaDescription.length}/160</span>
                  </label>
                  <textarea value={form.seo.metaDescription} maxLength={160} rows={3}
                    onChange={e => patchSeo({ metaDescription: e.target.value })}
                    placeholder="SEO description…"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors resize-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Canonical URL</label>
                  <input value={form.seo.canonicalUrl}
                    onChange={e => patchSeo({ canonicalUrl: e.target.value })}
                    placeholder="https://…"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 transition-colors" />
                </div>
                <Toggle checked={form.seo.noIndex} onChange={v => patchSeo({ noIndex: v })} label="No Index (hide from Google)" />
              </SideSection>

              <SideSection title="Search Preview" icon={Globe}>
                <div className="bg-zinc-800 rounded-lg p-3 space-y-0.5">
                  <p className="text-[11px] text-zinc-500 truncate">
                    yoursite.com › {categories.find(c => c._id === form.category)?.slug ?? "category"} › slug
                  </p>
                  <p className="text-sm text-blue-400 font-medium leading-snug line-clamp-2">
                    {form.seo.metaTitle || form.title || "Article Title"}
                  </p>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {form.seo.metaDescription || form.excerpt || "Article description will appear here…"}
                  </p>
                </div>

                <div className="space-y-1.5 mt-1">
                  {[
                    { label: "Title length (30–70)",       ok: form.seo.metaTitle.length >= 30 && form.seo.metaTitle.length <= 70,             warn: form.seo.metaTitle.length > 0 && form.seo.metaTitle.length < 30 },
                    { label: "Description length (70–160)", ok: form.seo.metaDescription.length >= 70 && form.seo.metaDescription.length <= 160, warn: form.seo.metaDescription.length > 0 && form.seo.metaDescription.length < 70 },
                    { label: "Excerpt provided",           ok: form.excerpt.length > 0,        warn: false },
                    { label: "Featured image set",         ok: Boolean(form.featuredImageUrl), warn: false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      {item.ok
                        ? <Check size={11} className="text-emerald-400 shrink-0" />
                        : item.warn
                          ? <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                          : <X size={11} className="text-zinc-600 shrink-0" />}
                      <span className="text-xs text-zinc-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </SideSection>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}