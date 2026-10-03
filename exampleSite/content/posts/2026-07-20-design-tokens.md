---
title: "用设计令牌统一产品视觉"
date: 2026-07-20
slug: "2026-07-20-design-tokens"
author: "引线编辑部"
emoji: "🎨"
categories: ["设计"]
tags: ["设计系统", "Token", "前端"]
lead: "设计令牌（Design Tokens）是把颜色、间距、字号等抽象成变量的实践，让设计与代码保持一致。"
---

设计令牌是把视觉决策抽象成**可复用变量**的方法。

## 为什么需要令牌

- 颜色、间距、圆角集中管理
- 主题切换只需替换一组变量
- 设计与开发说同一种语言

```css
:root{
  --accent: #0f7a5a;
  --accent-soft: color-mix(in srgb, var(--accent) 14%, #fff);
}
```

> 好的令牌系统，应该让换肤变成一行配置的事。
