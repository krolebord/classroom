import type {
  SerializedSchema,
  SerializedStore,
  TLAnyShapeUtilConstructor,
  TLInstancePresence,
  TLRecord,
  TLStoreWithStatus,
} from "tldraw";
import { useEffect, useMemo, useState } from "react";
import { useHydrated } from "remix-utils/use-hydrated";
import {
  computed,
  createPresenceStateDerivation,
  createTLStore,
  defaultShapeUtils,
  defaultUserPreferences,
  getUserPreferences,
  InstancePresenceRecordType,
  react,
  setUserPreferences,
} from "tldraw";
import useYProvider from "y-partykit/react";
import { YKeyValue } from "y-utility/y-keyvalue";
import * as Y from "yjs";

import { useSession } from "~/root";

export function useYjsStore({
  hostUrl,
  version = 1,
  roomId,
  shapeUtils = [],
}: {
  hostUrl: string;
  version?: number;
  roomId?: string;
  shapeUtils?: TLAnyShapeUtilConstructor[];
}) {
  const hydrated = useHydrated();

  if (!hydrated) {
    throw new Error("useYjsStore must be used inside a client-only component");
  }

  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    });

    return store;
  });

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  const session = useSession();

  const props = useMemo(() => {
    const yDoc = new Y.Doc({ gc: true });
    const yArr = yDoc.getArray<{ key: string; val: TLRecord }>(`tl_${roomId}`);
    const yStore = new YKeyValue(yArr);
    const meta = yDoc.getMap<SerializedSchema>("meta");

    return {
      yDoc,
      yStore,
      meta,
    };
  }, [roomId]);
  const { yDoc, yStore, meta } = props;

  const room = useYProvider({
    host: hostUrl,
    party: "board",
    room: `${roomId}_${version}`,
    doc: props.yDoc,
    options: {
      params: { token: session.sessionToken },
    },
  });

  useEffect(() => {
    setStoreWithStatus({ status: "loading" });

    const unsubs: (() => void)[] = [];

    function handleSync() {
      // 1.
      // Connect store to yjs store and vis versa, for both the document and awareness

      /* -------------------- Document -------------------- */

      // Sync store changes to the yjs doc
      unsubs.push(
        store.listen(
          function syncStoreChangesToYjsDoc({ changes }) {
            yDoc.transact(() => {
              Object.values(changes.added).forEach((record) => {
                yStore.set(record.id, record);
              });

              Object.values(changes.updated).forEach(([_, record]) => {
                yStore.set(record.id, record);
              });

              Object.values(changes.removed).forEach((record) => {
                yStore.delete(record.id);
              });
            });
          },
          { source: "user", scope: "document" }, // only sync user's document changes
        ),
      );

      // Sync the yjs doc changes to the store
      const handleChange = (
        changes: Map<
          string,
          | { action: "delete"; oldValue: TLRecord }
          | { action: "update"; oldValue: TLRecord; newValue: TLRecord }
          | { action: "add"; newValue: TLRecord }
        >,
        transaction: Y.Transaction,
      ) => {
        if (transaction.local) return;

        const toRemove: TLRecord["id"][] = [];
        const toPut: TLRecord[] = [];

        changes.forEach((change, id) => {
          switch (change.action) {
            case "add":
            case "update": {
              const record = yStore.get(id);
              if (record) {
                toPut.push(record);
              }
              break;
            }
            case "delete": {
              toRemove.push(id as TLRecord["id"]);
              break;
            }
          }
        });

        // put / remove the records in the store
        store.mergeRemoteChanges(() => {
          if (toRemove.length) store.remove(toRemove);
          if (toPut.length) store.put(toPut);
        });
      };

      yStore.on("change", handleChange);
      unsubs.push(() => yStore.off("change", handleChange));

      /* -------------------- Awareness ------------------- */

      const yClientId = room.awareness.clientID.toString();
      setUserPreferences({ id: yClientId });

      const userPreferences = computed<{
        id: string;
        color: string;
        name: string;
      }>("userPreferences", () => {
        const user = getUserPreferences();
        return {
          id: user.id,
          color: user.color ?? defaultUserPreferences.color,
          name: user.name ?? defaultUserPreferences.name,
        };
      });

      // Create the instance presence derivation
      const presenceId = InstancePresenceRecordType.createId(yClientId);
      const presenceDerivation = createPresenceStateDerivation(
        userPreferences,
        presenceId,
      )(store);

      // Set our initial presence from the derivation's current value
      room.awareness.setLocalStateField("presence", presenceDerivation.get());

      // When the derivation change, sync presence to to yjs awareness
      unsubs.push(
        react("when presence changes", () => {
          const presence = presenceDerivation.get();
          requestAnimationFrame(() => {
            room.awareness.setLocalStateField("presence", presence);
          });
        }),
      );

      // Sync yjs awareness changes to the store
      const handleUpdate = (update: {
        added: number[];
        updated: number[];
        removed: number[];
      }) => {
        const states = room.awareness.getStates() as Map<
          number,
          { presence: TLInstancePresence }
        >;

        const toRemove: TLInstancePresence["id"][] = [];
        const toPut: TLInstancePresence[] = [];

        // Connect records to put / remove
        for (const clientId of update.added) {
          const state = states.get(clientId);
          if (state?.presence && state.presence.id !== presenceId) {
            toPut.push(state.presence);
          }
        }

        for (const clientId of update.updated) {
          const state = states.get(clientId);
          if (state?.presence && state.presence.id !== presenceId) {
            toPut.push(state.presence);
          }
        }

        for (const clientId of update.removed) {
          toRemove.push(
            InstancePresenceRecordType.createId(clientId.toString()),
          );
        }

        // put / remove the records in the store
        store.mergeRemoteChanges(() => {
          if (toRemove.length) store.remove(toRemove);
          if (toPut.length) store.put(toPut);
        });
      };

      const handleMetaUpdate = () => {
        const theirSchema = meta.get("schema");
        if (!theirSchema) {
          throw new Error("No schema found in the yjs doc");
        }
        // If the shared schema is newer than our schema, the user must refresh
        const newMigrations = store.schema.getMigrationsSince(theirSchema);

        if (!newMigrations.ok || newMigrations.value.length > 0) {
          window.alert("The schema has been updated. Please refresh the page.");
          yDoc.destroy();
        }
      };
      meta.observe(handleMetaUpdate);
      unsubs.push(() => meta.unobserve(handleMetaUpdate));

      room.awareness.on("update", handleUpdate);
      unsubs.push(() => room.awareness.off("update", handleUpdate));

      // 2.
      // Initialize the store with the yjs doc records—or, if the yjs doc
      // is empty, initialize the yjs doc with the default store records.
      if (yStore.yarray.length) {
        // Replace the store records with the yjs doc records
        const ourSchema = store.schema.serialize();
        const theirSchema = meta.get("schema");
        if (!theirSchema) {
          throw new Error("No schema found in the yjs doc");
        }

        const records = yStore.yarray
          .toJSON()
          .map(({ val }) => val as { id: keyof SerializedStore<TLRecord> });

        const migrationResult = store.schema.migrateStoreSnapshot({
          schema: theirSchema,
          store: Object.fromEntries(
            records.map((record: { id: string }) => [record.id, record]),
          ) as SerializedStore<TLRecord>,
        });
        if (migrationResult.type === "error") {
          // if the schema is newer than ours, the user must refresh
          console.error(migrationResult.reason);
          window.alert("The schema has been updated. Please refresh the page.");
          return;
        }

        yDoc.transact(() => {
          // delete any deleted records from the yjs doc
          for (const r of records) {
            if (!migrationResult.value[r.id]) {
              yStore.delete(r.id);
            }
          }
          for (const r of Object.values(migrationResult.value)) {
            yStore.set(r.id, r);
          }
          meta.set("schema", ourSchema);
        });

        store.loadSnapshot({
          store: migrationResult.value,
          schema: ourSchema,
        });
      } else {
        // Create the initial store records
        // Sync the store records to the yjs doc
        yDoc.transact(() => {
          for (const record of store.allRecords()) {
            yStore.set(record.id, record);
          }
          meta.set("schema", store.schema.serialize());
        });
      }

      setStoreWithStatus({
        store,
        status: "synced-remote",
        connectionStatus: "online",
      });
    }

    let hasConnectedBefore = false;

    function handleStatusChange({
      status,
    }: {
      status: "disconnected" | "connected";
    }) {
      // If we're disconnected, set the store status to 'synced-remote' and the connection status to 'offline'
      if (status === "disconnected") {
        setStoreWithStatus({
          store,
          status: "synced-remote",
          connectionStatus: "offline",
        });
        return;
      }

      room.off("synced", handleSync);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (status === "connected") {
        if (hasConnectedBefore) return;
        hasConnectedBefore = true;
        room.on("synced", handleSync);
        unsubs.push(() => room.off("synced", handleSync));
      }
    }

    room.on("status", handleStatusChange);
    unsubs.push(() => room.off("status", handleStatusChange));

    return () => {
      unsubs.forEach((fn) => fn());
      unsubs.length = 0;
    };
  }, [room, yDoc, store, yStore, meta]);

  return storeWithStatus;
}