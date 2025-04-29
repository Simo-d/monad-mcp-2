declare module 'node-fetch' {
  export default function fetch(
    url: string | Request,
    init?: RequestInit
  ): Promise<Response>;
  
  export class Request extends globalThis.Request {
    constructor(input: RequestInfo, init?: RequestInit);
  }
  
  export class Response extends globalThis.Response {
    constructor(body?: BodyInit | null, init?: ResponseInit);
  }
  
  export type RequestInfo = Request | string;
  export type RequestInit = {
    method?: string;
    headers?: Record<string, string> | Headers;
    body?: string | null;
    signal?: AbortSignal;
    redirect?: RequestRedirect;
    follow?: number;
    timeout?: number;
    compress?: boolean;
    size?: number;
    referrer?: string;
    referrerPolicy?: ReferrerPolicy;
  };
  
  export type RequestRedirect = 'follow' | 'error' | 'manual';
  export type HeadersInit = Headers | string[][] | Record<string, string>;
  export type BodyInit = ArrayBuffer | ArrayBufferView | string;
  export type ResponseInit = {
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
  };
}
