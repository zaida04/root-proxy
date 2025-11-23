import { rootServer } from "@rootsdk/server-bot";
import Redis from "ioredis";

type RootRpcRequest = {
  id: string;
  path: string;
  args?: unknown[];
};

type RootRpcSuccessResponse = {
  id: string;
  ok: true;
  result: unknown;
};

type RootRpcErrorResponse = {
  id: string;
  ok: false;
  error: string;
  code?: string | number;
};

export type RootRpcResponse = RootRpcSuccessResponse | RootRpcErrorResponse;

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current == null || typeof current !== "object") return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (current as any)[key];
  }, obj);
}

/**
 * Set up a Redis-based RPC listener that allows external processes
 * to call Root APIs via the `rootServer` instance.
 *
 * Requests are received on the `yk-calls` channel, and responses are
 * published on the `yk-results` channel.
 */
export function setupRootCallHandler(redisUrl: string): void {
  const pub = new Redis(redisUrl);
  const sub = new Redis(redisUrl);

  sub.subscribe("yk-calls").catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to subscribe to yk-calls:", err);
  });

  sub.on("message", async (channel, message) => {
    if (channel !== "yk-calls") return;

    let req: RootRpcRequest;
    try {
      req = JSON.parse(message) as RootRpcRequest;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Invalid RPC request payload:", err);
      return;
    }

    const { id, path, args = [] } = req;
    if (!id || !path) {
      return;
    }

    const respond = async (response: RootRpcResponse): Promise<void> => {
      try {
        await pub.publish("yk-results", JSON.stringify(response));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to publish RPC response:", err);
      }
    };

    try {
      const target = getByPath(rootServer, path);
      if (typeof target !== "function") {
        throw new Error(`Target at path '${path}' is not a function`);
      }

      const result = await (target)(...(args));
      
      await respond({
        id,
        ok: true,
        result,
      });
    } catch (err) {
      const anyErr = err as any;
      await respond({
        id,
        ok: false,
        error: anyErr?.message ?? String(anyErr),
        code: anyErr?.errorCode ?? anyErr?.code,
      });
    }
  });
}


