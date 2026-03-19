# Remote Code MCP Server

一个基于 Node.js 的 MCP (Model Context Protocol) 服务器，通过 HTTP Stream 传输方式提供远程代码操作功能。

## 功能特性

- 执行脚本命令
- 获取文件夹下的文件和目录列表
- 写入文件
- 读取文件
- 在项目中根据关键词搜索

## 安全特性

- 通过 Bearer Token 进行鉴权
- Token 通过环境变量 `AUTH_TOKEN` 配置
- 目录访问限制：所有文件操作（读取、写入、列表、搜索）都限制在指定的允许目录内
- 路径遍历防护：防止通过 `../` 等方式访问允许目录外的文件
- 允许目录通过环境变量 `ALLOWED_DIR` 配置，默认为当前工作目录

## 安装

```bash
cd /Users/mingbing/apps/agent/mcps/remote-code
npm install
```

## 配置

在启动服务前，需要设置以下环境变量：

```bash
export AUTH_TOKEN=your-secret-token-here
export ALLOWED_DIR=/path/to/allowed/directory
```

**环境变量说明：**

- `AUTH_TOKEN` (必需): 用于鉴权的 Bearer Token
- `ALLOWED_DIR` (可选): 允许操作的目录路径，默认为当前工作目录
- `PORT` (可选): HTTP 服务器端口，默认为 3000
- `MCP_TRANSPORT` (可选): 传输方式，`http` 或 `stdio`，默认为 `stdio`

## 使用方法

### 启动 HTTP 服务器

```bash
MCP_TRANSPORT=http ALLOWED_DIR=/path/to/allowed/directory npm start
```

服务器默认监听端口 3000，可以通过环境变量 `PORT` 修改：

```bash
MCP_TRANSPORT=http ALLOWED_DIR=/path/to/allowed/directory PORT=8080 npm start
```

### 启动 Stdio 服务器

```bash
ALLOWED_DIR=/path/to/allowed/directory npm start
```

## API 端点

### 健康检查

```
GET http://localhost:3000/health
```

### MCP 请求

```
POST http://localhost:3000/mcp
```

请求头需要包含 Bearer Token：

```
Authorization: Bearer your-secret-token-here
```

## 可用工具

**重要提示：** 以下文件操作工具（list_directory、write_file、read_file、search_files）都受到 `ALLOWED_DIR` 环境变量的限制，只能在指定的允许目录内操作。任何尝试访问允许目录外的操作都会被拒绝。

### 1. execute_command

执行 shell 命令。

**参数：**

- `command` (string, 必需): 要执行的命令
- `cwd` (string, 可选): 工作目录，默认为当前目录

**注意：** 此工具不受 `ALLOWED_DIR` 限制，可以在任意目录执行命令。

**示例：**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "execute_command",
    "arguments": {
      "command": "ls -la",
      "cwd": "/path/to/directory"
    }
  }
}
```

### 2. list_directory

列出指定路径下的文件和目录。

**参数：**

- `path` (string, 可选): 要列出的路径，默认为当前目录
- `recursive` (boolean, 可选): 是否递归列出，默认为 false

**示例：**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_directory",
    "arguments": {
      "path": "/path/to/directory",
      "recursive": true
    }
  }
}
```

### 3. write_file

写入内容到文件。

**参数：**

- `path` (string, 必需): 文件路径
- `content` (string, 必需): 要写入的内容

**示例：**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "write_file",
    "arguments": {
      "path": "/path/to/file.txt",
      "content": "Hello, World!"
    }
  }
}
```

### 4. read_file

读取文件内容。

**参数：**

- `path` (string, 必需): 文件路径

**示例：**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/path/to/file.txt"
    }
  }
}
```

### 5. search_files

在目录中搜索包含关键词的文件。

**参数：**

- `keyword` (string, 必需): 要搜索的关键词
- `path` (string, 可选): 搜索目录，默认为当前目录
- `filePattern` (string, 可选): 文件模式匹配（如 "_.js", "_.ts"）
- `maxResults` (number, 可选): 最大返回结果数，默认为 50

**示例：**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_files",
    "arguments": {
      "keyword": "function",
      "path": "/path/to/project",
      "filePattern": "*.js",
      "maxResults": 20
    }
  }
}
```

## 使用 curl 测试

### 获取可用工具列表

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### 执行命令

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "execute_command",
      "arguments": {
        "command": "ls -la"
      }
    }
  }'
```

### 测试目录限制

尝试访问允许目录外的文件将被拒绝：

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "read_file",
      "arguments": {
        "path": "/etc/passwd"
      }
    }
  }'
```

这将返回错误：`Access denied: Path is outside allowed directory: ...`

## 开发

使用 watch 模式进行开发：

```bash
npm run dev
```

## 依赖项

- @modelcontextprotocol/sdk: MCP SDK
- express: HTTP 服务器框架
- cors: CORS 中间件

## 许可证

MIT
