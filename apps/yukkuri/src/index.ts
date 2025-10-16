import { type Message, MessageSchema, StateSchema } from "@aikyo/server";
import { z } from "zod";
import WebSocket from "ws";

const receivedData: Message[] = [];

const requestSchema = z.union([
  StateSchema,
  MessageSchema,
]);

// WebSocketサーバーに接続
const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  console.log("WebSocket接続が確立されました");
});

ws.on("message", (data: WebSocket.Data) => {
  try {
    // 受信したデータをパース
    const rawMessage = JSON.parse(data.toString());

    // requestSchemaでバリデーション
    const validData = requestSchema.parse(rawMessage);

    switch (validData.method) {
      case "message.send": {
        receivedData.push(validData);
        console.log("メッセージを受信しました:", validData);
        break;
      }
      case "state.send": {
        console.log("状態更新を受信しました:", validData);
        if (validData.params.closing === "terminal") {
          console.log("終了状態を受信しました。WebSocket接続を閉じます。");
          ws.close();
        }
        break;
      }
    }
  } catch (error) {
    console.error(
      "メッセージのパースまたはバリデーションに失敗しました:",
      error,
    );
  }
});

ws.on("error", (error) => {
  console.error("WebSocketエラー:", error);
});

ws.on("close", () => {
  console.log("WebSocket接続が切断されました");
  console.log(`合計 ${receivedData.length} 件のメッセージを受信しました`);
});
