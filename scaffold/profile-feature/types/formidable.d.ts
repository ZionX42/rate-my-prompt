declare module 'formidable' {
  import type { IncomingMessage } from 'node:http';

  export interface File {
    filepath: string;
    mimetype?: string;
    size?: number;
    originalFilename?: string | null;
  }

  export interface Fields {
    [key: string]: string | string[];
  }

  export interface Files {
    [key: string]: File | File[];
  }

  export interface FormidableOptions {
    multiples?: boolean;
    maxFileSize?: number;
  }

  export type ParseResult = [Fields, Files];

  export interface FormidableInstance {
    parse(req: IncomingMessage): Promise<ParseResult>;
  }

  export default function formidable(options?: FormidableOptions): FormidableInstance;
}
