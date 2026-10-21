"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  Minus,
  RemoveFormatting,
  Code,
  CheckSquare,
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
  placeholder = "Tuliskan deskripsi lengkap, brief pengerjaan, checklist target, atau tempel link referensi di sini...",
  minHeight = "220px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
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

  const handleInsertLink = () => {
    const url = window.prompt("Masukkan URL / Tautan:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const handleInsertChecklist = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const checklistHtml = `<div><input type="checkbox" style="margin-right:8px;vertical-align:middle;accent-color:#ef4444;" /> <span>Target checklist...</span></div>`;
    document.execCommand("insertHTML", false, checklistHtml);
    handleInput();
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-500/10 transition">
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
          onClick={() => executeCommand("formatBlock", "<h1>")}
          title="Judul Besar (H1)"
          className="px-2 py-1 rounded-lg hover:bg-slate-200/70 text-xs font-black text-slate-800 transition"
        >
          H1
        </button>

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
          <CheckSquare className="h-3.5 w-3.5 text-red-600" />
          <span className="hidden sm:inline text-[11px]">Checklist</span>
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "<blockquote>")}
          title="Kutipan / Catatan Penting"
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 transition"
        >
          <Quote className="h-3.5 w-3.5" />
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
          style={{ minHeight }}
          className="w-full px-4 py-3 text-xs sm:text-sm text-slate-800 focus:outline-none overflow-y-auto leading-relaxed prose prose-sm max-w-none prose-slate"
        />
      </div>
    </div>
  );
}
