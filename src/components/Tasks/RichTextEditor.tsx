"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link2,
  Minus,
  RemoveFormatting,
  CheckSquare,
  ImageIcon,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Tuliskan catatan revisi lengkap, atau tempel (Ctrl+V) screenshot bukti di sini...",
  minHeight = "180px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Sync initial or external value change
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
      checkIfEmpty();
    }
  }, [value]);

  const checkIfEmpty = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText.trim();
    const hasMedia = editorRef.current.querySelector("img, hr, iframe, a");
    setIsEmpty(text === "" && !hasMedia);
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      checkIfEmpty();
      onChange(html);
    }
  };

  // Support Pasting Screenshots directly from Clipboard (Cmd+V / Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          if (base64 && editorRef.current) {
            editorRef.current.focus();
            const imgHtml = `<p><img src="${base64}" alt="Screenshot Bukti Revisi" style="max-width:100%;max-height:420px;border-radius:12px;border:1px solid #e2e8f0;margin:8px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:block;" /></p><p><br></p>`;
            document.execCommand("insertHTML", false, imgHtml);
            handleInput();
          }
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  // Support Image File Selection from Toolbar
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64 && editorRef.current) {
        editorRef.current.focus();
        const imgHtml = `<p><img src="${base64}" alt="Screenshot Bukti Revisi" style="max-width:100%;max-height:420px;border-radius:12px;border:1px solid #e2e8f0;margin:8px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:block;" /></p><p><br></p>`;
        document.execCommand("insertHTML", false, imgHtml);
        handleInput();
      }
    };
    reader.readAsDataURL(file);

    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt("Masukkan URL / Tautan Referensi:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const handleInsertChecklist = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const checklistHtml = `<div><input type="checkbox" style="margin-right:8px;vertical-align:middle;accent-color:#e11d48;" /> <span>Poin revisi target...</span></div>`;
    document.execCommand("insertHTML", false, checklistHtml);
    handleInput();
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-500/10 transition">
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* WYSIWYG Toolbar */}
      <div className="flex items-center gap-1 flex-wrap border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-slate-700">
        <button
          type="button"
          onClick={() => executeCommand("bold")}
          title="Tebal (Ctrl+B)"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 transition"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("italic")}
          title="Miring (Ctrl+I)"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 transition"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("underline")}
          title="Garis Bawah (Ctrl+U)"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 transition"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("strikeThrough")}
          title="Coret"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 transition"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "<h2>")}
          title="Subjudul (H2)"
          className="px-2 py-1 rounded-lg hover:bg-slate-200/70 text-xs font-bold text-slate-700 transition"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "<p>")}
          title="Teks Biasa (Paragraph)"
          className="px-2 py-1 rounded-lg hover:bg-slate-200/70 text-[11px] font-medium text-slate-600 transition"
        >
          P
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("insertUnorderedList")}
          title="Bullet List"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 transition"
        >
          <List className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("insertOrderedList")}
          title="Numbered List"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 transition"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={handleInsertChecklist}
          title="Insert Checklist Item"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 transition flex items-center gap-1 text-[11px] font-semibold"
        >
          <CheckSquare className="h-3.5 w-3.5 text-rose-600" />
          <span className="hidden sm:inline text-[11px]">Checklist</span>
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        {/* Screenshot / Image Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Unggah Gambar / Screenshot Bukti"
          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700 transition flex items-center gap-1 text-[11px] font-bold"
        >
          <ImageIcon className="h-3.5 w-3.5 text-rose-600" />
          <span className="text-[11px]">Screenshot</span>
        </button>

        <button
          type="button"
          onClick={handleInsertLink}
          title="Sisipkan Link URL"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-blue-600 transition"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("insertHorizontalRule")}
          title="Garis Pembatas (Divider)"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 transition"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("removeFormat")}
          title="Hapus Format Teks"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 transition"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </button>

        <div className="ml-auto hidden sm:flex items-center text-[10px] text-slate-400 italic">
          Bisa paste (Ctrl+V) screenshot langsung
        </div>
      </div>

      {/* Editable Canvas / Worksheet */}
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-3 left-4 text-xs text-slate-400 pointer-events-none select-none italic">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          onPaste={handlePaste}
          style={{ minHeight }}
          className="w-full px-4 py-3 text-xs sm:text-sm text-slate-800 focus:outline-none overflow-y-auto leading-relaxed prose prose-sm max-w-none prose-slate"
        />
      </div>
    </div>
  );
}
