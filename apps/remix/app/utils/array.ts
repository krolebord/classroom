export function reverseMap<T, U>(arr: T[], selector: (x: T) => U) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return arr.map((_, i, array) => selector(array[array.length - 1 - i]!));
}
