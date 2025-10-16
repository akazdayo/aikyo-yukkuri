import { Firehose } from "@aikyo/firehose";
import { QueryResultSchema } from "@aikyo/server";
import WebSocket from "ws";
import { RequestSchema, speakDataSchema } from "./types/firehose";

const ws = new WebSocket("ws://localhost:8080");

export async function createFirehoseServer(port: number = 8080) {
  // Create a new Firehose server
  const firehose = new Firehose(port);
  await firehose.start();

  await firehose.subscribe("queries", (data) => {
    // Validate incoming data
    const speakData = speakDataSchema.parse(data);
    firehose.broadcastToClients(speakData);

    const queryResult = QueryResultSchema.parse({
      id: speakData.id,
      jsonrpc: "2.0",
      result: {
        success: true,
        body: { success: true },
      },
    });
    const result = RequestSchema.parse({
      topic: "queries",
      body: queryResult,
    });

    ws.send(JSON.stringify(result));
  });

  await firehose.subscribe("messages", (data) => {
    firehose.broadcastToClients(data);
  });

  await firehose.subscribe("states", (data) => {
    firehose.broadcastToClients(data);
  });

  return firehose;
}
