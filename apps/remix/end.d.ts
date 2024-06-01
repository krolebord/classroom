declare module "__STATIC_CONTENT_MANIFEST" {
  const manifest: string;
  export default manifest;
}

type OmitDisposable<T extends Disposable> = {
  [P in Exclude<keyof T, keyof Disposable>]: T[P];
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
} & unknown;
