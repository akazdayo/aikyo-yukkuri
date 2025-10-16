import * as fs from "node:fs";
import * as path from "node:path";
import { type Message, MessageSchema, StateSchema } from "@aikyo/server";
import WebSocket from "ws";
import { z } from "zod";

const receivedData: Message[] = [];

// CompanionとYMM4キャラクターの対応辞書
const companionToYmmCharacter: Record<string, string> = {
  companion_kyoko: "ゆっくり霊夢",
  companion_aya: "ゆっくり魔理沙",
};

const requestSchema = z.union([StateSchema, MessageSchema]);

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

  // YMM4台本CSV形式で出力
  if (receivedData.length > 0) {
    const outputPath = path.join(process.cwd(), "yukkuri_script.csv");

    // 各メッセージをCSV行に変換
    const csvLines: string[] = receivedData.map((msg) => {
      // 対応辞書を使ってキャラクター名を変換（辞書にない場合は元の名前を使用）
      const speaker =
        companionToYmmCharacter[msg.params.from] ?? msg.params.from;
      // セリフ内のダブルクォートをエスケープし、カンマや改行が含まれる場合はダブルクォートで囲む
      const message = msg.params.message.replace(/"/g, '""');
      const needsQuotes = /[,"\n]/.test(msg.params.message);
      const csvMessage = needsQuotes ? `"${message}"` : message;

      return `${speaker},${csvMessage}`;
    });

    // ファイルに書き込み
    const csvContent = csvLines.join("\n");
    fs.writeFileSync(outputPath, csvContent, "utf-8");

    console.log(`YMM4台本CSVを出力しました: ${outputPath}`);
  }
});
