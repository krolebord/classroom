import type { Editor } from "tldraw";
import { createContext, useContext, useState } from "react";

type TldrawContextType = {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
};

const TldrawContext = createContext<TldrawContextType>({
  editor: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setEditor: () => {},
});

export function useTldraw() {
  return useContext(TldrawContext);
}

export function TldrawProvider({ children }: { children: React.ReactNode }) {
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <TldrawContext.Provider
      value={{
        editor: editor,
        setEditor: setEditor,
      }}
    >
      {children}
    </TldrawContext.Provider>
  );
}
