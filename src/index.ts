import {
  ChannelMessageEvent,
  rootServer,
  type RootBotStartState,
} from "@rootsdk/server-bot";
import Redis from "ioredis";
import { existsSync } from "fs";
import { setupRootCallHandler } from "./call";

async function main(): Promise<void> {
    if (!existsSync("root-manifest.json")) {
        throw new Error("root-manifest.json not found. Please mount it with: -v /path/to/root-manifest.json:/app/root-manifest.json");
    }
    
    await rootServer.lifecycle.start(botStarting);
}

async function botStarting(state: RootBotStartState): Promise<void> {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const client = new Redis(redisUrl);

    async function forwardEvent(eventName: string, event: Record<string, unknown>): Promise<void> {
        await client.publish("rp-events", JSON.stringify({ rootEventName: eventName, rootEvent: event }));
    }
    
    rootServer.community.channelMessages.on(ChannelMessageEvent.ChannelMessageCreated, (event) => forwardEvent("channelMessageCreated", event));
    rootServer.community.channelMessages.on(ChannelMessageEvent.ChannelMessageEdited, (event) => forwardEvent("channelMessageEdited", event));
    rootServer.community.channelMessages.on(ChannelMessageEvent.ChannelMessageDeleted, (event) => forwardEvent("channelMessageDeleted", event));

    // Set up RPC handler for incoming calls
    setupRootCallHandler(redisUrl);
}

main().catch(console.error);