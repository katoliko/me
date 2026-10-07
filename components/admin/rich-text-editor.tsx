"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Alignment,
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  Font,
  Heading,
  Italic,
  Link,
  List,
  Paragraph,
  Underline,
} from "ckeditor5";
import { useState } from "react";

export function RichTextEditor({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue: string;
  placeholder: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="overflow-hidden rounded-2xl border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
      <CKEditor
        editor={ClassicEditor}
        data={defaultValue}
        config={{
          licenseKey: "GPL",
          plugins: [
            Essentials,
            Paragraph,
            Heading,
            Bold,
            Italic,
            Underline,
            Font,
            Alignment,
            List,
            BlockQuote,
            Link,
          ],
          placeholder,
          toolbar: [
            "undo", "redo", "|", "heading", "|", "bold", "italic", "underline",
            "fontSize", "fontFamily", "fontColor", "|", "alignment",
            "bulletedList", "numberedList", "blockQuote", "link",
          ],
        }}
        onChange={(_, editor) => {
          setValue(editor.getData());
        }}
      />
      <input type="hidden" name={name} value={value} readOnly />
    </div>
  );
}
