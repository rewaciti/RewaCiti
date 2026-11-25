import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Link as LinkIcon, List as ListIcon, ListOrdered, Maximize, Minimize, RemoveFormatting, Underline as UnderlineIcon, X } from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import { sanitizeDescriptionHtml } from "@/features/agentPortal/common/utils/agentListingUtils";

const AgentDescriptionEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialValue = useRef(value);
  const savedSelection = useRef<Range | null>(null);
  const [format, setFormat] = useState("p");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = sanitizeDescriptionHtml(initialValue.current);
  }, []);

  const rememberSelection = () => {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (selection?.rangeCount && editor?.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      savedSelection.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (selection && savedSelection.current && editor.contains(savedSelection.current.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(savedSelection.current);
    }
  };

  const syncValue = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = sanitizeDescriptionHtml(editor.innerHTML);
    onChange(next);
  };

  const runCommand = (command: string, commandValue?: string) => {
    restoreSelection();
    document.execCommand(command, false, commandValue);
    rememberSelection();
    syncValue();
  };

  const applyLink = () => {
    const input = linkUrl.trim();
    if (!input) return;
    try {
      const url = new URL(input);
      if (url.protocol !== "http:" && url.protocol !== "https:" && url.protocol !== "mailto:") {
        throw new Error("Unsupported link type");
      }
      runCommand("createLink", url.href);
      setLinkOpen(false);
      setLinkUrl("");
    } catch {
      toast.error("Enter a valid web or email link.");
    }
  };

  const iconButtonClass = "grid h-[31px] w-[31px] shrink-0 cursor-pointer place-items-center rounded-[4px] border-0 bg-transparent text-[#4b5563] outline-none hover:bg-[#703bf7]/10 hover:text-[#703bf7] focus-visible:bg-[#703bf7]/10 focus-visible:text-[#703bf7] dark:text-[#9ca3af] dark:hover:bg-[#b79bff]/15 dark:hover:text-[#b79bff] dark:focus-visible:bg-[#b79bff]/15 dark:focus-visible:text-[#b79bff] max-[700px]:h-7 max-[700px]:w-7";
  const linkButtonClass = "inline-flex min-h-[34px] cursor-pointer items-center justify-center rounded-[5px] border border-[#e5e7eb] bg-white px-2.5 text-[10px] text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white";

  return (
    <div
      className={`border border-[#e5e7eb] bg-white dark:border-white/10 dark:bg-[#1a1a1a] ${
        fullscreen
          ? "fixed inset-5 z-20 flex flex-col rounded-lg shadow-[0_15px_60px_rgb(0_0_0/30%)]"
          : "overflow-hidden rounded-[6px]"
      }`}
    >
      <div className="flex min-h-[46px] flex-wrap items-center gap-[5px] border-b border-[#e5e7eb] bg-[#f3f4f6] px-2 py-[5px] dark:border-white/10 dark:bg-[#232323] max-[700px]:flex-wrap" aria-label="Description formatting">
        <CustomDropdown
          className="w-[128px] shrink-0 max-[700px]:w-[110px]"
          buttonClassName="w-full min-h-[42px] rounded-[6px] border border-[#e5e7eb] bg-white! px-2 text-left text-[12px] text-[#111827]! hover:border-[#703bf7] dark:border-white/10 dark:bg-[#1a1a1a]! dark:text-white! max-[700px]:min-h-[33px]"
          menuClassName="w-[128px] rounded-[6px] border border-[#e5e7eb] bg-white! p-1 text-[12px] text-[#111827]! shadow-lg dark:border-white/10 dark:bg-[#1a1a1a]! dark:text-white!"
          menuItemClassName="block w-full rounded px-2 py-1.5 text-left hover:bg-[#703bf7]/10 dark:hover:bg-[#b79bff]/15"
          placeholder="Normal"
          value={format}
          options={[
            { label: "Normal", value: "p" },
            { label: "Heading 2", value: "h2" },
            { label: "Heading 3", value: "h3" },
          ]}
          onChange={(value) => {
            setFormat(value);
            runCommand("formatBlock", value);
          }}
        />
        <span className="mx-[3px] h-[22px] w-px shrink-0 bg-[#e5e7eb] dark:bg-white/10 max-[700px]:mx-0" />
        <button type="button" aria-label="Bold" title="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")} className={iconButtonClass}><Bold size={16} /></button>
        <button type="button" aria-label="Italic" title="Italic" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")} className={iconButtonClass}><Italic size={16} /></button>
        <button type="button" aria-label="Underline" title="Underline" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("underline")} className={iconButtonClass}><UnderlineIcon size={16} /></button>
        <span className="mx-[3px] h-[22px] w-px shrink-0 bg-[#e5e7eb] dark:bg-white/10 max-[700px]:mx-0" />
        <button type="button" aria-label="Numbered list" title="Numbered list" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")} className={iconButtonClass}><ListOrdered size={17} /></button>
        <button type="button" aria-label="Bulleted list" title="Bulleted list" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")} className={iconButtonClass}><ListIcon size={17} /></button>
        <button type="button" aria-label="Add link" title="Add link" onMouseDown={(event) => event.preventDefault()} onClick={() => setLinkOpen((open) => !open)} className={iconButtonClass}><LinkIcon size={16} /></button>
        <button type="button" aria-label="Clear formatting" title="Clear formatting" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("removeFormat")} className={iconButtonClass}><RemoveFormatting size={17} /></button>
        <span className="flex-1" />
        <button type="button" aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"} title={fullscreen ? "Exit fullscreen" : "Fullscreen"} onMouseDown={(event) => event.preventDefault()} onClick={() => setFullscreen((expanded) => !expanded)} className={iconButtonClass}>{fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}</button>
      </div>
      {linkOpen && (
        <div className="flex gap-[7px] border-b border-[#e5e7eb] p-[9px] dark:border-white/10">
          <input type="url" aria-label="Link URL" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://example.com" className="min-w-0 flex-1 rounded-[5px] border border-[#e5e7eb] bg-white px-[9px] text-[11px] text-[#111827] outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white" />
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={applyLink} className={`${linkButtonClass} border-[#703bf7]! bg-[#703bf7]! text-white!`}>Insert link</button>
          <button type="button" aria-label="Cancel adding link" onMouseDown={(event) => event.preventDefault()} onClick={() => setLinkOpen(false)} className={linkButtonClass}><X size={15} /></button>
        </div>
      )}
      <div
        ref={editorRef}
        className={`min-h-[205px] wrap-anywhere px-4 py-[15px] text-[12px] leading-[1.7] text-[#111827] outline-none empty:before:pointer-events-none empty:before:text-[#6b7280] empty:before:content-[attr(data-placeholder)] dark:text-white dark:empty:before:text-[#9ca3af] [&_h2]:my-[10px] [&_h2]:text-[#111827] dark:[&_h2]:text-white [&_h3]:my-[10px] [&_h3]:text-[#111827] dark:[&_h3]:text-white [&_ol]:pl-6 [&_ul]:pl-6 max-[700px]:min-h-[180px] ${
          fullscreen ? "flex-1 overflow-y-auto" : ""
        }`}
        contentEditable
        role="textbox"
        aria-label="Property description"
        aria-multiline="true"
        data-placeholder="Describe the property, the neighbourhood and the terms..."
        onInput={syncValue}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onBlur={() => {
          rememberSelection();
          syncValue();
        }}
        suppressContentEditableWarning
      />
    </div>
  );
};


export default AgentDescriptionEditor;
