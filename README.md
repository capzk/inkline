# Inkline

> 现代杂志风格 Hugo 博客主题 —— 杂志式首页、分类渐变封面、悬浮卡片文章页、**中文友好的零依赖站内搜索**，内置完整 SEO 与可配置 URL。

<!--
主题展示图（提交到 themes.gohugo.io 需要，仓库里也能直接预览）：
  images/screenshot.png   1500 × 1000
  images/tn.png            900 ×  600
把站点截图放进 images/ 目录即可，README 会自动显示：
![screenshot](images/screenshot.png)
-->

Inkline 由静态 HTML 主题 demo `16-modern-magazine` 转换而来，CSS 与视觉语言原样保留，仅把写死的文字替换为 Hugo 模板变量。适合技术博客、运维笔记、个人杂志类站点。

- 仓库：<https://github.com/capzk/inkline>
- 演示站：<https://capzk.com/>
- 许可证：MIT

## 环境要求

| 项目 | 要求 |
| --- | --- |
| Hugo | **≥ 0.158.0**（extended 版，站内搜索的 `js.Build` 依赖内置 esbuild） |
| Go | 仅在使用 Hugo Modules 方式安装时需要 |
| Node | **不需要**，站内搜索没有 npm 依赖 |

> ⚠️ 必须 ≥ 0.158.0：模板用到 `.Site.Language.Locale`（v0.158.0 引入），同时该版本把配置项 `languageCode` 更名为 `locale`。用更低的版本构建会因找不到字段而报出难以定位的模板错误。

## 特性

- 📰 杂志式首页：公告条 → 大图 Hero（1 主卡 + 3 侧卡）→ 最新文章网格 → 编辑精选 → 页脚
- 🎯 Hero 主卡可指定：通过 front matter `featured: true` 控制首页大卡片展示哪篇文章
- 🎨 可配置强调色（改一个参数换全站配色）+ 按分类自动渐变封面色
- 📋 代码复制按钮：文章内每个代码块悬停显示「复制」按钮，一键复制
- 🔗 永久链接可定制（默认 `/posts/:slug/`，支持 `slug` / `url` / `aliases`）
- 🔎 **中文友好的站内搜索**：Hugo 构建期生成索引，前端零依赖零请求第三方，中文按二元切分，词序无关也能命中
- 🔍 完整 SEO：canonical、keywords、Open Graph、Twitter Card、JSON-LD 结构化数据、RSS、sitemap、favicon、theme-color
- 🌐 中文本地化：`hasCJKLanguage`、`enableEmoji`、代码高亮、脚注、定义列表
- 📱 响应式：桌面 3 列、平板 2 列、手机 1 列
- ♿ 语义化标签 + 键盘可达
- 📄 自定义 404 页面 + 干净的数字分页

## 快速开始

### 1. 安装主题

**方式一：Git 子模块（推荐，也是本仓库自身使用的方式）**

```bash
cd your-site
git submodule add https://github.com/capzk/inkline.git themes/inkline
git commit -m "chore: add inkline theme"
```

> 请使用 **HTTPS** 地址。Cloudflare Pages / Netlify / Vercel 这类平台构建时没有你的 SSH 私钥，写成 `git@github.com:...` 会导致拉取子模块失败。

**方式二：Hugo Modules**

```bash
hugo mod init github.com/yourname/your-site
hugo mod get github.com/capzk/inkline
```

然后在 `hugo.toml` 中把主题指向模块路径：

```toml
theme = "github.com/capzk/inkline"
```

这种安装方式会读取主题自带的 `module.toml`，Hugo 版本不满足时**直接构建失败并给出明确提示**。

**方式三：直接复制**

把本仓库的 `archetypes/`、`assets/`、`layouts/`、`static/` 复制到你的站点 `themes/inkline/` 下。缺点是后续无法平滑跟进上游更新。

### 2. 启用主题

在站点 `hugo.toml` 中指定：

```toml
theme = 'inkline'
```

### 3. 加上版本保护（强烈建议）

以子模块或复制方式安装时，Hugo **不会**读取主题的 `module.toml`，请在**站点**配置里自己声明一次最低版本：

```toml
[module]
  [module.hugoVersion]
    extended = true
    min = "0.158.0"
```

这样在构建机上 Hugo 版本太低时，日志里会出现一条一眼能看懂的警告，而不是晦涩的模板报错：

```
WARN  Module "project" is not compatible with this Hugo version: Min 0.158.0 extended
```

### 4. 本地预览

```bash
# 在你的站点根目录
hugo server

# 或预览主题自带的示例站点（在主题目录下执行）
hugo server --source exampleSite --themesDir ../..
```

浏览器打开 <http://localhost:1313/> 即可。

## 主题更新

上游发布新版本后，按安装方式对应操作：

**子模块安装**

```bash
# 更新到上游最新提交（会改动 themes/inkline 指向的 commit）
git submodule update --remote themes/inkline
git add themes/inkline
git commit -m "chore: bump inkline theme"
git push
```

子模块记录的是**确定的 commit**，所以主题更新不会在你没操作时突然改变线上站点，升级时机完全可控。想回滚就把 `themes/inkline` 切回上一个 commit 再提交。

> 如果你习惯全部用 SSH，可以只在本机做一次映射，仓库里的 URL 保持 HTTPS 不变：
> ```bash
> git config --global url."git@github.com:".insteadOf "https://github.com/"
> ```

**Hugo Modules 安装**

```bash
hugo mod get -u github.com/capzk/inkline   # 升级到最新
hugo mod get -u=patch                      # 只升补丁位
hugo mod tidy
```

**复制安装**：手动拉取上游改动，或用 `git subtree` 管理。

## 完整配置示例

以下是一份可直接使用的 `hugo.toml`（即 `exampleSite/hugo.toml` 的内容）：

```toml
baseURL = 'https://capzk.com/'
locale = 'zh-CN'
title = 'capzk'
theme = 'inkline'
hasCJKLanguage = true
enableEmoji = true
enableRobotsTXT = true

# 分页：每页 9 篇（Hugo 0.128+ 起改用 [pagination].pagerSize）
[pagination]
  pagerSize = 9

[taxonomies]
  category = 'categories'
  tag = 'tags'

# 站内搜索：构建期生成 /searchindex.json，前端零依赖检索
[outputs]
  home = ['HTML', 'RSS', 'SearchIndex']

[outputFormats.SearchIndex]
  mediaType = 'application/json'
  baseName = 'searchindex'
  isPlainText = true
  notAlternative = true

# 最低 Hugo 版本保护：版本过低时构建日志给出明确警告，而不是晦涩的模板报错
[module]
  [module.hugoVersion]
    extended = true
    min = '0.158.0'

# 文章 URL 固定为 /posts/:slug/
[permalinks]
  posts = '/posts/:slug/'

[params]
  description = 'capzk 博客，踩坑记录、书写心得与日常笔记'
  homeGridCount = 6

  [params.brand]
    name = 'capzk'

  [params.accent]
    primary = '#0f7a5a'

  [params.author]
    name = 'capzk'
    bio = '随便写写'

  [params.social]
    github = 'https://github.com/capzk'
    email = 'mailto:hi@capzk.com'

  [params.seo]
    robots = 'index,follow'
    title_suffix = ' · capzk'
    keywords = 'capzk, 运维, Docker, 技术博客, 静态博客, 自托管'
    og_image = '/images/og-default.png'
    google_analytics = ''

[markup]
  [markup.goldmark]
    [markup.goldmark.extensions]
      footnotes = true
      definitionList = true
    [markup.goldmark.renderer]
      unsafe = true
  [markup.highlight]
    noClasses = true
    codeFences = true
    lineNos = false
```

> ⚠️ **TOML 位置注意**：`enableEmoji`、`enableRobotsTXT` 等顶级参数必须写在任何 `[section]` 之前，否则会被吞进上一个表导致失效。

## 配置参数详解

在站点 `hugo.toml` 的 `[params]` 下：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `description` | — | 站点描述，写入 `<meta name="description">` 与 OG |
| `announcement` | — | 首页公告条文字（留空则不显示公告条） |
| `announcement_link` | `#` | 公告条「查看详情」链接 |
| `homeGridCount` | `6` | 首页「最新文章」卡片数量（桌面 3 列） |
| `brand.name` | 站点标题 | 顶栏品牌名（纯文字） |
| `accent.primary` | `#0f7a5a` | 全站强调色，支持任意 CSS 颜色 |
| `author.name` | — | 默认作者名（文章页作者卡片） |
| `author.bio` | — | 作者简介 |
| `social.github` | — | GitHub 链接 |
| `social.email` | — | 联系邮箱 |
| `social.x` | — | X / Twitter 主页（可选） |
| `seo.robots` | `index,follow` | 爬虫指令 |
| `seo.title_suffix` | ` · 站点标题` | 非首页标题后缀（首页只显示站点名） |
| `seo.keywords` | — | 站点关键词，写入 `<meta name="keywords">` |
| `seo.twitter_site` | — | Twitter Card 站点名 |
| `seo.og_image` | `/images/og-default.png` | 默认社交分享图（建议 1200×630 的 PNG/JPG，**不要用 SVG**，社交平台不解析）。文章可用 front matter 的 `image` 字段单独覆盖 |
| `seo.robots_disallow` | — | 数组，需要屏蔽的路径，写入 `robots.txt` |
| `seo.google_analytics` | — | 填入 GA4 测量 ID（如 `G-XXXXXXX`）即启用统计 |

### 换色示例

```toml
[params.accent]
primary = '#7c3aed'   # 改成紫色主题
```

支持任意合法 CSS 颜色值（`#hex`、`rgb()`、`hsl()` 等）。

## 文章 Front Matter

新建文章用 `hugo new posts/my-post.md`，会自动套用 `archetypes/default.md` 模板：

```markdown
---
title: "我的文章标题"
slug: "my-post"           # URL 路径，建议显式填写英文 slug
date: 2024-12-18
draft: false
author: "capzk"
author_bio: "随便写写"
categories: ["系统管理"]
tags: ["Docker", "Linux"]
lead: "一句话摘要（可选，留空则自动截取正文）"
description: "SEO 描述（可选）"
image: "/images/my-post.png"  # 可选，覆盖本篇文章的社交分享图
featured: false            # 设为 true → 上首页 Hero 大卡片
editors_pick: false        # 设为 true → 进首页「编辑精选」
---
```

### 字段说明

| 字段 | 作用 |
| --- | --- |
| `slug` | 覆盖 URL 路径最后一段（默认取文件名） |
| `featured` | `true` 时该文章显示在首页 Hero 大卡片（见下节） |
| `editors_pick` | `true` 时该文章进入首页「编辑精选」区 |
| `categories` | 分类数组，第一项决定封面渐变色 |
| `tags` | 标签数组 |
| `lead` | 文章导读摘要，显示在标题下方 |
| `description` | SEO 专用描述，留空则取 `lead` 或正文截取 |
| `image` | 本篇文章的社交分享图，覆盖站点默认 `seo.og_image` |
| `author` / `author_bio` | 文章页作者信息（留空则不显示作者卡片） |
| `searchExclude` | `true` 时该页面不进站内搜索索引 |

## Hero 大卡指定文章

首页左上角的大卡片（Hero 主卡）默认显示**最新一篇文章**。想指定某篇文章上 Hero，在该文章 front matter 加：

```yaml
featured: true
```

- 若多篇文章设了 `featured: true`，取第一篇（按日期倒序）
- 若没有任何文章设 `featured`，自动回退到最新一篇
- Hero 侧卡（右侧 3 张小卡）和「最新文章」网格会自动排除 Hero 主卡那篇，不重复

## URL 自定义

主题默认通过 `permalinks` 把文章固定为 `/posts/:slug/`：

```toml
[permalinks]
  posts = '/posts/:slug/'
```

每篇文章可用 front matter 进一步覆盖：

```markdown
---
slug: "my-first-post"          # → /posts/my-first-post/
# url: "/articles/my-post"     # 覆盖整条路径，优先级高于 slug
# aliases: ["/old-url"]        # 旧链接客户端重定向（自动带 canonical + noindex）
---
```

> 💡 建议给每篇文章显式设置 `slug`（英文），避免 Hugo 用标题生成中文 URL。

详见官方文档：<https://gohugo.io/content-management/urls/>

## 分类渐变封面色

文章封面渐变色按 `categories` 第一项自动匹配，内置配色：

| 分类 | 配色 | 分类 | 配色 |
| --- | --- | --- | --- |
| 科技 | 绿 | 系统管理 | 青绿 |
| 商业 | 红 | 应用部署 | 橙 |
| 设计 | 紫 | 资源分享 | 靛蓝 |
| 工具 | 绿 | Linux | 琥珀 |
| 观察 | 橙 | windows | 天蓝 |
| 生活 | 蓝 | 文章示例 | 石板灰 |
| 随笔 | 青 | *其他* | 默认绿 |

未匹配的分类会回退到默认绿色。要新增分类配色，编辑 `layouts/partials/cover-gradient.html`。

## 站内搜索

主题内置一套**零依赖的中文友好全文检索**：Hugo 在构建期把全部内容导出成 `/searchindex.json`，浏览器本地检索。不引入 npm 构建步骤、不加载任何 CDN 脚本、不把用户输入发给第三方，`hugo server` 开发模式也能正常预览。

### 启用

主题需要三个文件，站点侧只需两处：

1. **`hugo.toml` 加上输出格式**（见上方「完整配置示例」的 `[outputs]` 与 `[outputFormats.SearchIndex]`）
2. **建一个搜索页** `content/search.md`：

```markdown
---
title: "搜索"
description: "在本站检索文章与笔记，中文按词匹配，无需逐字精确。"
layout: "search"
searchExclude: true     # 别把自己也搜出来
robots: "noindex,follow" # 功能页不需要被搜索引擎收录
sitemap:
  disable: true          # 也不进 sitemap
---
```

顶栏会自动出现一个搜索图标（无需改配置）。构建后应有 `/searchindex.json`；若没有，多半是 `hugo.toml` 的 `[outputs]` 没写对。

### 为什么对中文友好

中文没有空格分词。lunr.js / Fuse.js 的默认行为会把一整段中文当成一个词，用户得逐字精确匹配才搜得到——这就是社区里存在 `hugo-lunr-zh` 这类中文补丁的原因。本主题改用检索领域的通用轻量方案 **二元切分（bigram）**：

```
「系统管理」 → 系统 / 统管 / 管理
```

查询串走同一套规则，两边只要共享任意一个二元片段就能命中。因此：

| 搜索词 | 行为 |
| --- | --- |
| `系统管理` | ✅ 命中标题为「linux 系统服务管理」的文章 |
| `管理系统` | ✅ 词序颠倒，结果完全一致 |
| `统管` | ✅ 跨词片段也能召回 |
| `docker 部署` | ✅ 英文数字必须全部命中，中文片段命中过半即可 |
| `HYPRL` | ✅ 英文忽略大小写，天然支持前缀 |
| `Ｄｏｃｋｅｒ` | ✅ 全角自动转半角 |

排序按字段加权：标题 > 标签 > 分类 > 正文，标题整串命中额外加分，同一词元在正文中的计数有上限（避免长文靠堆词霸榜）。单篇文章正文超过若干字不再计入的部分不影响使用，索引体积随文章数线性增长——本站 59 篇约 175 KB（gzip 后 ~55 KB），仅在搜索页开始输入时才拉取。

### 交互

| 操作 | 效果 |
| --- | --- |
| `/` 或 `Ctrl`/`Cmd` + `K` | 聚焦搜索框 |
| `↓` / `↑` | 在结果之间移动焦点 |
| `Enter` | 直接打开第一条结果 |
| `Esc` | 清空关键词 |
| 分享 `?q=关键词` | 打开即出结果，URL 随输入实时同步 |

检索在浏览器本地完成，需要 JavaScript；未开启时页面会给出明确提示。

### 自定义

- **排除某篇内容**：front matter 加 `searchExclude: true`
- **索引字段**：编辑 `layouts/index.searchindex.json`（单字母字段名是为了压体积）
- **分词与排序**：`assets/js/search/` 下按职责拆分——`tokenize.js`（分词归一）、`engine.js`（打分排序）、`ui.js`（渲染交互）、`main.js`（入口）。这几个模块都不依赖 DOM，可以单独在 Node 里跑测试或替换

## SEO 说明

主题已在 `<head>` 输出以下标签（无需额外配置）：

- `<link rel="canonical">` 规范链接
- `<meta name="description">` + `<meta name="keywords">`
- `<meta name="robots">` 爬虫指令
- Open Graph：`og:type` / `og:title` / `og:description` / `og:url` / `og:image` / `og:locale` / `article:*`
- Twitter Card：`summary_large_image` + 标题/描述/图
- JSON-LD：`WebSite`（首页）/ `BlogPosting`（文章），含发布时间、作者、出版方、关键词
- `<link rel="alternate" type="application/rss+xml">` RSS
- `<link rel="sitemap" href="/sitemap.xml">` 站点地图（Hugo 自动生成）
- `robots.txt`（自动带上 `Sitemap:` 地址，需站点开启 `enableRobotsTXT = true`）
- `<meta name="theme-color">`、favicon、`<html lang>`

## 代码复制按钮

文章内每个代码块（`<pre>`）悬停时右上角显示「复制」按钮，点击即复制代码到剪贴板，2 秒内显示「已复制」反馈。无需配置，开箱即用。

## 部署

### 本地构建

```bash
hugo --minify
```

生成的静态文件在 `public/` 目录，可直接上传到任意静态托管。

### 部署到 GitHub Pages

在仓库 `.github/workflows/deploy.yml` 创建 GitHub Action：

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: 'latest'
          extended: true
      - name: Build
        run: hugo --minify
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

> 若主题用 submodule 安装，`submodules: true` 必须开启。

### 部署到 Cloudflare Pages

- 构建命令：`hugo --minify`
- 输出目录：`public`
- 环境变量：`HUGO_VERSION = 0.167.0`（**必须 ≥ 0.158.0**，且 extended 版；Cloudflare 默认版本很旧，不设这个变量大概率构建失败）

### 部署到 Vercel

- 框架预设：Hugo
- 构建命令：留空（自动识别）
- 输出目录：`public`

### 部署到 Netlify

在站点根目录创建 `netlify.toml`：

```toml
[build]
  command = "hugo --minify"
  publish = "public"

[build.environment]
  HUGO_VERSION = "0.167.0"
```

> 部署前确认 `hugo.toml` 的 `baseURL` 已改为你的正式域名。

## 目录结构

```
inkline/
├── archetypes/
│   └── default.md            # 新建文章模板（含 featured/editors_pick 等字段）
├── assets/
│   ├── css/style.css         # 主题样式（设计令牌 + 全部组件样式）
│   └── js/search/            # 站内搜索（仅搜索页加载，经 js.Build 打包）
│       ├── tokenize.js       # 中文二元切分、全角半角归一
│       ├── engine.js         # 打分排序、摘要截取、索引加载
│       ├── ui.js             # 结果渲染、高亮、键盘导航
│       └── main.js           # 入口
├── layouts/
│   ├── _default/
│   │   ├── baseof.html       # 基础模板（含 head 注入块与代码复制 JS）
│   │   ├── list.html         # 列表页（分类/标签/文章归档）
│   │   ├── search.html       # 搜索页
│   │   ├── single.html       # 文章详情页
│   │   └── terms.html        # 分类/标签总览页
│   ├── partials/
│   │   ├── header.html       # 顶栏导航（含搜索入口）
│   │   ├── footer.html       # 页脚
│   │   ├── hero-main.html    # 首页 Hero 主卡
│   │   ├── hero-side.html    # 首页 Hero 侧卡
│   │   ├── post-card.html    # 文章卡片
│   │   ├── editor-card.html  # 编辑精选卡片
│   │   ├── cover-gradient.html  # 分类渐变色映射
│   │   ├── pagination.html   # 自定义数字分页
│   │   ├── seo.html          # SEO meta 标签
│   │   └── title.html        # 页面标题
│   ├── 404.html              # 404 页面
│   ├── index.searchindex.json # 搜索索引模板（输出 /searchindex.json）
│   ├── robots.txt            # robots.txt 模板（含 sitemap 地址）
│   └── index.html            # 首页
├── static/
│   ├── favicon.svg
│   └── images/og-default.png # 默认社交分享图（og-default.svg 为矢量源文件）
├── exampleSite/              # 可运行的示例站点
├── images/                   # 主题展示图：screenshot.png 1500×1000 + tn.png 900×600
├── theme.toml                # 主题元信息（名称/许可/标签/最低版本）
├── module.toml               # Hugo Modules 版本门槛声明
├── .gitattributes            # 统一换行符
├── .gitignore
├── LICENSE
└── README.md
```

### 目录规范说明

| 目录 | 作用 | 是否必需 |
| --- | --- | --- |
| `layouts/` | 模板。站点同路径文件会覆盖主题同名文件，改版式时优先在站点侧覆盖，不要直接改主题 | ✅ |
| `assets/` | 需要 Hugo Pipes 处理的资源（这里放了 CSS 与搜索 JS，构建时压缩 + 指纹化） | — |
| `static/` | 原样拷贝到发布根目录的文件 | — |
| `archetypes/` | `hugo new` 的 front matter 模板 | — |
| `exampleSite/` | 可运行的演示站点，也是主题的活文档与回归验证环境 | 强烈建议 |
| `images/` | 主题展示图，提交 themes.gohugo.io 时需要 | 提交展示时必需 |
| `i18n/` | 多语言文案。本主题全部为中文硬编码，未使用 | — |

## 常见问题

**Q：首页 Hero 想换一篇文章怎么办？**
A：给目标文章 front matter 加 `featured: true`。

**Q：文章 URL 是中文怎么办？**
A：给文章 front matter 加 `slug: "english-slug"`，用英文做路径。

**Q：怎么关闭公告条？**
A：`hugo.toml` 里不设 `announcement` 参数即可自动隐藏。

**Q：代码高亮没颜色？**
A：确认 `hugo.toml` 有 `[markup.highlight]` 配置（`noClasses = true` + `codeFences = true`）。

**Q：想加新分类的封面色？**
A：编辑 `layouts/partials/cover-gradient.html`，在 `dict` 里加 `"分类名" "linear-gradient(...)"`。

**Q：搜索页没反应 / 一直提示「索引加载失败」？**
A：确认 `hugo.toml` 里有 `[outputs] home = ['HTML', 'RSS', 'SearchIndex']` 和对应的 `[outputFormats.SearchIndex]`，构建产物根目录应存在 `searchindex.json`。另外运行 Hugo 的必须是 **extended** 版本（`js.Build` 依赖内置 esbuild）。

**Q：搜索支持其他语言吗？**
A：分词器对中日韩统一按二元切分，对拉丁文字按单词 + 前缀匹配，日文、韩文同样适用；欧陆语言的词形变化（复数、变格）目前不做词干还原。

**Q：构建报 `can't evaluate field Locale in type ...`？**
A：Hugo 版本低于 0.158.0。升级即可；若在用 Cloudflare Pages，去 Settings → Variables and Secrets 把 `HUGO_VERSION` 调到 0.158.0 以上，然后 retry 部署。

**Q：线上样式/脚本 404，或主题完全没生效？**
A：多半是子模块没拉下来。本地执行 `git submodule update --init --recursive`；托管平台上确认 `.gitmodules` 里是 **HTTPS** 地址（平台没有你的 SSH 私钥）。

**Q：想保留自己的定制，又不想每次升级都冲突？**
A：不要直接改 `themes/inkline/` 下的文件。把要改的文件按**相同相对路径**复制到站点根目录的 `layouts/`、`assets/`、`static/` 下，Hugo 会优先用站点侧版本。这样 `git submodule update --remote` 就能放心执行。

## 许可证

[MIT](LICENSE)
