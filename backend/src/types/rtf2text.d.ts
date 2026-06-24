declare module 'rtf2text' {
  export function string(
    input: string,
    callback: (error: Error | null, text: string) => void,
  ): void;
}

