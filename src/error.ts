import { Json } from "./types";

const ERROR_CODES = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
} as const;

type ErrorCode = keyof typeof ERROR_CODES;
type ErrorOptions<T> = {
  code: keyof typeof ERROR_CODES;
  message?: string;
  cause?: unknown;
  data?: T;
};

export interface SerializedError {
  code: ErrorCode;
  message: string;
  data?: Json;
}

const handleErrorMessage = (cause?: unknown, fallback?: string) => {
  if (typeof cause === "string") return cause;
  if (cause instanceof Error) return cause.message;
  if (
    cause &&
    typeof cause === "object" &&
    "message" in cause &&
    typeof cause.message === "string"
  ) {
    return cause.message;
  }

  return fallback ?? "Unknown error occured";
};

export class EggieError<
  TShape extends Json = { message: string }
> extends Error {
  public readonly code: ErrorCode;
  public readonly cause?: unknown;
  public readonly data?: TShape;

  constructor(init: ErrorOptions<TShape> | string) {
    const opts: ErrorOptions<TShape> =
      typeof init === "string"
        ? { code: "INTERNAL_SERVER_ERROR", message: init }
        : init;
    const message = opts.message ?? handleErrorMessage(opts.cause, opts.code);

    super(message);
    this.code = opts.code;
    this.data = opts.data;
  }

  public static toObject(error: EggieError): SerializedError {
    return {
      code: error.code,
      message: error.message,
      data: error.data,
    };
  }

  public static serialize() {
    return JSON.stringify(EggieError.toObject);
  }
}
