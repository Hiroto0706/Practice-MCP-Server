# Node.jsをベースイメージとして使用
FROM node:22-slim

# 作業ディレクトリの設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー（キャッシュ効率化のため）
COPY package.json package-lock.json ./

# 依存関係のインストール
# キャッシングを活用してビルド高速化
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# TypeScriptの設定ファイルをコピー
COPY tsconfig.json ./

# ソースコードをコピー
COPY src ./src

# TypeScriptコードをコンパイル
RUN npm run build

# アプリケーション実行
CMD ["node", "dist/server.js"]