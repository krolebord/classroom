import type { Editor } from "tldraw";
import { InstancePresenceRecordType, Tldraw } from "tldraw";

import { useUser } from "~/root";
import { useYjsStore } from "~/utils/use-y-js-store";
import { useTldraw } from "./tldraw-context";

type BoardProps = {
  boardId: string;
};
export default function Board(props: BoardProps) {
  const { boardId } = props;
  const { setEditor } = useTldraw();

  const store = useYjsStore({
    roomId: boardId,
    hostUrl: "localhost:1999",
  });

  const user = useUser();

  const handleMount = (editor: Editor) => {
    setEditor(editor);
    editor.user.updateUserPreferences({
      id: user.id,
      name: user.name,
    });
    editor.store.put([
      InstancePresenceRecordType.create({
        id: InstancePresenceRecordType.createId(editor.store.id),
        currentPageId: editor.getCurrentPageId(),
        userId: "peer-1",
        userName: user.name,
        chatMessage: "Hello",
        lastActivityTimestamp: Date.now(),
      }),
    ]);
  };

  return <Tldraw store={store} onMount={handleMount} />;
}
