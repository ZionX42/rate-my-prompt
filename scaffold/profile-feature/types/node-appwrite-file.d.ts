declare module 'node-appwrite/file' {
  import type { Readable } from 'node:stream';

  export class InputFile {
    static fromBuffer(buffer: Buffer, filename: string): InputFile;
    static fromPath(path: string, filename?: string): InputFile;
    static fromStream(stream: Readable, filename: string): InputFile;
  }
}
