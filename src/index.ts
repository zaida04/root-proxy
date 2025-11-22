import { ChannelMessageEvent, rootServer, type RootBotStartState } from "@rootsdk/server-bot";
// import { initializeExample } from "./example.example";
import Redis from "ioredis";
import { existsSync } from "fs";

async function main(): Promise<void> {
    if (!existsSync("root-manifest.json")) {
        throw new Error("root-manifest.json not found. Please mount it with: -v /path/to/root-manifest.json:/app/root-manifest.json");
    }
    
    await rootServer.lifecycle.start(botStarting);
}

async function botStarting(state: RootBotStartState): Promise<void> {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const client = new Redis(redisUrl);

    async function forwardEvent(event: Record<string, unknown>): Promise<void> {
        await client.publish("rp-events", JSON.stringify(event));
    }
    
    rootServer.community.channelMessages.on(ChannelMessageEvent.ChannelMessageCreated, forwardEvent);
    rootServer.community.channelMessages.on(ChannelMessageEvent.ChannelMessageEdited, forwardEvent);
    rootServer.community.channelMessages.on(ChannelMessageEvent.ChannelMessageDeleted, forwardEvent);
}


main().catch(console.error);