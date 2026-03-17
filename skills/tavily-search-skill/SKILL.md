---
name: 'tavily-search-skill'
description: 'Search the web with LLM-optimized results via the Tavily CLI. Use this skill when the user wants to search the web, find articles, look up information, get recent news, discover sources, or says "search for", "find me", "look up", "what is the latest on", "find articles about", or needs current information from the internet. Returns relevant results with content snippets, relevance scores, and metadata — optimized for LLM consumption. Supports domain filtering, time ranges, and multiple search depths.'
env:
  requires:
    - TAVILY_API_KEY
---

# Tavily 搜索技能

## 功能描述

本技能使用 Tavily API 进行网络搜索，提供以下功能：

- 实时网络搜索
- 智能搜索结果排序
- 支持基础和高级搜索模式
- 返回结构化的搜索结果

## 何时调用

当用户需要以下内容时，应该调用本技能：

- 搜索网络信息
- 查找技术文档或资料
- 获取实时数据或新闻
- 研究特定主题
- 查找代码示例或解决方案
- 获取最新的行业动态

## 搜索流程

### 1. 执行搜索

使用 `scripts/search.js` 脚本进行搜索：

参数必须以json格式传递，如下：

```json
{
  "query": "搜索的关键词"
}
```

## 搜索结果格式

搜索结果返回一个数组，每个结果包含：

```javascript
;[
  {
    title: '结果标题',
    url: '结果链接',
    content: '内容摘要',
    score: 0.95,
    raw_content: '完整内容',
  },
]
```

## 故障排除

### 问题：搜索结果为空

**解决方案**：

- 尝试使用不同的查询词
- 检查查询词拼写
