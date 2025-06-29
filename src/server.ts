import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";

const execAsync = promisify(exec);

// MCPサーバーの作成
const server = new McpServer({
  name: "terminal-server",
  version: "1.0.0",
});

// ターミナルツールの登録
server.tool(
  "run_command",
  {
    command: z.string().describe("The command to execute in the terminal"),
  },
  async ({ command }) => {
    try {
      // コマンドの実行
      const { stdout, stderr } = await execAsync(command);

      // 結果の返却 - Pythonコードのような構造化された出力
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                stdout: stdout || "",
                stderr: stderr || "",
                return_code: 0, // execAsyncは成功時に0を返す
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      // エラーハンドリング - エラーの場合もPythonと同様の構造で返す
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // execAsyncはエラー時にcode属性を持つことがある
      const returnCode = (error as any).code || -1;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                stdout: "",
                stderr: `Error executing command: ${errorMessage}`,
                return_code: returnCode,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// README ファイルリソースの登録
server.resource(
  "mcpreadme",
  new ResourceTemplate("file:///mcpreadme", { list: undefined }),
  async (uri) => {
    try {
      // ユーザーのホームディレクトリを取得
      const homedir = require("os").homedir();
      // デスクトップのパスを構築
      const desktopPath = path.join(homedir, "Desktop");
      // ファイルのフルパス
      const filePath = path.join(desktopPath, "mcpreadme.md");

      const content = await fs.readFile(filePath, "utf-8");

      return {
        contents: [
          {
            uri: uri.href,
            text: content,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        contents: [
          {
            uri: uri.href,
            text: `Error reading mcpreadme.md: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// サーバーの起動
const transport = new StdioServerTransport();

async function main() {
  await server.connect(transport);
}

main().catch(console.error);
