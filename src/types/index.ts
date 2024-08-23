//TODO - remove un-needed

export type JsonValue = string | number | boolean | null | undefined;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue | JsonArray | JsonObject };
export type Json = JsonValue | JsonObject | JsonArray;

export type ErrorMessage<TError extends string> = TError;
export type Simplify<TType> = { [TKey in keyof TType]: TType[TKey] } & {};

export type Either<TData, TError> =
  | {
      data: TData;
      error: null;
    }
  | { data: null; error: TError };

export type EitherSimple<TData, TError> = TData | TError;

export type MaybeUrl = string | URL;
export type MaybePromise<TType> = TType | Promise<TType>;

export interface NodeFetchRequestInitLike {
  body?: string;
}

export interface ResponseLike {
  status: number;
  ok: boolean;
  json: <T = unknown>() => Promise<T>;
  text: () => Promise<string>;
  blob: () => Promise<Blob>;
  headers: Headers;
  clone: () => ResponseLike;
}

export interface RequestInitLike {
  body?: FormData | ReadableStream | string | null;
  headers?: [string, string][] | Record<string, string>;
  method?: string;
  signal?: AbortSignal | null;
}

export type FetchLike = (
  input: MaybeUrl,
  init?: RequestInitLike
) => Promise<ResponseLike>;
