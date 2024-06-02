import type { Editor } from "tldraw";
import { Tldraw } from "tldraw";

import { useClientEnv, useUser } from "~/root";
import { useTldrawYjsStore } from "~/utils/use-y-js-store";

type BoardProps = {
  boardId: string;
};
export default function Board(props: BoardProps) {
  const { boardId } = props;

  const env = useClientEnv();

  const store = useTldrawYjsStore({
    roomId: boardId,
    hostUrl: env.wsServerHost,
  });

  const user = useUser();

  const handleMount = (editor: Editor) => {
    editor.user.updateUserPreferences({
      name: user.name,
    });
  };

  return <Tldraw store={store} onMount={handleMount} />;
}
