export type Argon2 = Rpc.WorkerEntrypointBranded & {
  hash: (input: string) => string;
  verify: (hash: string, input: string) => boolean;
};
