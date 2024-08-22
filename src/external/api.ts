import { FetchLike } from "../types";
import { generateUrl } from "../utils";
import { EggieError } from "../error";

interface EggieApiOptions {
  host: string;
  fetch?: FetchLike;
  headers?: Record<string, string>;
}

export class EggieApi {
  private host: string;
  private fetch: FetchLike;
  private defaultHeaders: Record<string, string>;

  constructor(options: EggieApiOptions) {
    this.host = options.host;
    this.fetch = options.fetch ?? globalThis.fetch;
    this.defaultHeaders = options.headers ?? {};
  }

  public async eggiePost<T extends Record<string, unknown>>(
    pathname: `/${string}`,
    body: Record<string, unknown>,
    fallbackErrorMessage: string,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    const url = generateUrl(this.host, pathname);
    const response = await this.fetch(url, {
      method: "POST",
      headers: extraHeaders
        ? {
            ...this.defaultHeaders,
            ...extraHeaders,
          }
        : this.defaultHeaders,
      body: JSON.stringify(body),
    });

    const json = await response.json<T | { error: string }>();

    if (!response.ok || "error" in json) {
      throw new EggieError({
        message:
          "error" in json ? JSON.stringify(json.error) : fallbackErrorMessage,
        code: "INTERNAL_SERVER_ERROR",
      });
    }

    return json;
  }
  public async eggieGet<T extends Record<string, unknown>>(
    pathname: `/${string}`,
    fallbackErrorMessage: string
  ): Promise<T> {
    try {
      const url = generateUrl(this.host, pathname);
      const response = await this.fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });

      const json = await response.json<T | { error: string }>();

      if (!response.ok || "error" in json) {
        throw new EggieError({
          message:
            "error" in json ? JSON.stringify(json.error) : fallbackErrorMessage,
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      return json;
    } catch (error) {
      throw new EggieError({
        message: fallbackErrorMessage,
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}
