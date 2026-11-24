import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Link as LinkIcon, List as ListIcon, ListOrdered, Maximize, Minimize, RemoveFormatting, Underline as UnderlineIcon, X } from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "../../properties/components/CustomDropdown";
import { sanitizeDescriptionHtml } from "../utils/agentListingUtils";

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

  return (
    <div className={`agent-description-editor${fullscreen ? " is-fullscreen" : ""}`}>
      <div className="agent-description-toolbar" aria-label="Description formatting">
        <CustomDropdown
          className="agent-description-style-dropdown"
          buttonClassName="agent-description-style-button"
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
        <span className="agent-description-toolbar-divider" />
        <button type="button" aria-label="Bold" title="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")}><Bold size={16} /></button>
        <button type="button" aria-label="Italic" title="Italic" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")}><Italic size={16} /></button>
        <button type="button" aria-label="Underline" title="Underline" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("underline")}><UnderlineIcon size={16} /></button>
        <span className="agent-description-toolbar-divider" />
        <button type="button" aria-label="Numbered list" title="Numbered list" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")}><ListOrdered size={17} /></button>
        <button type="button" aria-label="Bulleted list" title="Bulleted list" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")}><ListIcon size={17} /></button>
        <button type="button" aria-label="Add link" title="Add link" onMouseDown={(event) => event.preventDefault()} onClick={() => setLinkOpen((open) => !open)}><LinkIcon size={16} /></button>
        <button type="button" aria-label="Clear formatting" title="Clear formatting" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("removeFormat")}><RemoveFormatting size={17} /></button>
        <span className="agent-description-toolbar-spacer" />
        <button type="button" aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"} title={fullscreen ? "Exit fullscreen" : "Fullscreen"} onMouseDown={(event) => event.preventDefault()} onClick={() => setFullscreen((expanded) => !expanded)}>{fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}</button>
      </div>
      {linkOpen && (
        <div className="agent-description-link-form">
          <input type="url" aria-label="Link URL" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://example.com" />
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={applyLink}>Insert link</button>
          <button type="button" aria-label="Cancel adding link" onMouseDown={(event) => event.preventDefault()} onClick={() => setLinkOpen(false)}><X size={15} /></button>
        </div>
      )}
      <div
        ref={editorRef}
        className="agent-description-editable"
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
