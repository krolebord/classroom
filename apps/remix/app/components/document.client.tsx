import { useEffect, useRef, useState } from "react";
import QuillCursors from "quill-cursors";
import ReactQuill, { Quill } from "react-quill";
import useYProvider from "y-partykit/react";
import { QuillBinding } from "y-quill";

import { useClientEnv, useSession } from "~/root";

Quill.register("modules/cursors", QuillCursors);

function getRandomColor() {
  const colors = ["red", "orange", "yellow", "green", "blue", "purple", "pink"];
  return colors[Math.floor(Math.random() * colors.length)];
}

type DocumentEditorProps = {
  documentId: string;
};
export default function DocumentEditor(props: DocumentEditorProps) {
  const { documentId } = props;

  const env = useClientEnv();

  const [text, setText] = useState("");
  const quill = useRef<ReactQuill>(null);

  const session = useSession();
  const provider = useYProvider({
    host: env.wsServerHost,
    party: "document",
    room: documentId,
    options: {
      params: {
        token: session.wsJwt,
      },
    },
  });

  const [userColor] = useState(() => getRandomColor());
  // Create an editor-binding which
  // "binds" the quill editor to a Y.Text type.
  useEffect(() => {
    if (!quill.current) return;
    const ytext = provider.doc.getText("quill");
    const editor = quill.current.getEditor();
    const binding = new QuillBinding(ytext, editor, provider.awareness);
    provider.awareness.setLocalStateField("user", {
      name: "Typing...",
      color: userColor,
    });
    return () => {
      binding.destroy();
    };
  }, [userColor, provider, quill]);

  return (
    <ReactQuill
      ref={quill}
      theme="snow"
      className="h-full w-full"
      value={text}
      onChange={setText}
      modules={{ cursors: true }}
    />
  );
}
