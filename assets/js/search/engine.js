/**
 * 检索内核：文档加工、打分排序、摘要截取。
 * 索引体积很小（本站 59 篇 ≈ 100KB 纯文本），因此直接线性扫描，
 * 不做倒排表——少一堆状态，代码好维护，性能在这个量级完全够用。
 * 本文件不依赖 DOM，可单独在 Node 里跑测试。
 */
import { collapse, countOccurrences, fold, isCJK, segment, tokenize } from './tokenize.js';

const MAX_RESULTS = 30;
// 字段权重：标题 > 标签 > 分类 > 正文
const W_TITLE = 26;
const W_TAG = 14;
const W_CAT = 11;
const W_BODY = 1.6;
// 单个词元在正文中的计数上限，避免长文靠反复出现同一个词霸榜
const BODY_CAP = 6;
// 命中多少个词元才算候选；多词元查询要求过半，压住长尾噪音
const hitThreshold = (n) => Math.max(1, Math.ceil(n / 2));

/** 把 /searchindex.json 的原始数据加工成可检索文档（展示串与匹配串分开存）。 */export function buildDocs(raw) {
  return (raw || [])
    .filter((d) => d && d.u)
    .map((d) => {
      const title = collapse(d.t);
      const body = collapse(d.x);
      return {
        title,
        body,
        cats: String(d.c || '').split(/\s+/).filter(Boolean),
        tags: String(d.g || '').split(/\s+/).filter(Boolean),
        url: d.u,
        date: d.d || '',
        titleKey: fold(d.t),
        bodyKey: fold(d.x),
        catsKey: fold(d.c),
        tagsKey: fold(d.g),
        time: d.d ? Date.parse(d.d) || 0 : 0,
      };
    });
}

/**
 * 执行检索。
 *
 * 两套门槛，因为中英文的召回特性完全不同：
 *   - 英文数字是强信号（"docker" 命中就是命中），要求**全部**出现；
 *   - 中文二元片段是弱信号（"管理" 遍地都是），只要求**过半**出现，
 *     否则「系统的管理和维护」就搜不到「系统管理」。
 * @returns {{hits: Array<{doc:object, score:number}>, total:number, terms:string[], phrases:string[]}}
 *   terms   用于匹配的二元/整词词元
 *   phrases 原始查询片段，用于把结果高亮成完整关键词而不是碎片
 */
export function search(docs, query) {
  const key = fold(query);
  if (!key) return { hits: [], total: 0, terms: [], phrases: [] };
  const terms = [...new Set(tokenize(key))];
  if (!terms.length) return { hits: [], total: 0, terms: [], phrases: [] };
  const phrases = segment(key);
  const need = hitThreshold(terms.length);
  const wordCount = phrases.filter((p) => !isCJK(p[0])).length;
  const scored = [];

  for (const doc of docs) {
    let score = 0;
    let matched = 0;
    let wordMatched = 0;
    let titleHits = 0;
    for (const term of terms) {
      const inTitle = countOccurrences(doc.titleKey, term);
      const inTags = countOccurrences(doc.tagsKey, term);
      const inCats = countOccurrences(doc.catsKey, term);
      const inBody = countOccurrences(doc.bodyKey, term);
      if (!inTitle && !inTags && !inCats && !inBody) continue;
      matched += 1;
      if (!isCJK(term[0])) wordMatched += 1;
      if (inTitle) titleHits += 1;
      score += inTitle * W_TITLE
        + inTags * W_TAG
        + inCats * W_CAT
        + Math.min(inBody, BODY_CAP) * W_BODY;
    }
    if (wordMatched < wordCount || matched < need) continue;
    score += (matched / terms.length) * 42 + titleHits * 12;
    if (doc.titleKey.includes(key)) score += 60; // 标题整串命中
    else if (doc.tagsKey.includes(key) || doc.catsKey.includes(key)) score += 18;
    score += Math.log1p(doc.time / 1e10); // 极弱的新旧倾向，只用于同分排序
    scored.push({ doc, score });
  }

  scored.sort((a, b) => b.score - a.score || b.doc.time - a.doc.time);
  return {
    hits: scored.slice(0, MAX_RESULTS),
    total: scored.length,
    terms,
    phrases,
  };
}

/** 拼出用于高亮的匹配串：优先完整查询片段，其次二元碎片，长的排前面。 */
export function marks(result) {
  return [...new Set([...result.phrases, ...result.terms])].sort((a, b) => b.length - a.length);
}

/** 从正文里截一段包含命中的上下文作为摘要。 */
export function snippet(doc, needles, before = 46, after = 96) {
  const body = doc.body;
  if (!body) return '';
  let at = -1;
  let len = 0;
  for (const n of needles) {
    const p = doc.bodyKey.indexOf(n);
    if (p < 0) continue;
    if (at < 0 || p < at || (p === at && n.length > len)) {
      at = p;
      len = n.length;
    }
  }
  if (at < 0) {
    const head = body.slice(0, before + after);
    return head + (body.length > head.length ? '…' : '');
  }
  const start = Math.max(0, at - before);
  const end = Math.min(body.length, at + len + after);
  return (start > 0 ? '…' : '') + body.slice(start, end) + (end < body.length ? '…' : '');
}

let inflight = null;

/** 首次检索时才拉取索引，不给搜索页首屏增加负担；失败后允许下次重试。 */
export function loadIndex(url) {
  if (!inflight) {
    inflight = fetch(url, { credentials: 'same-origin' })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(buildDocs)
      .catch((err) => {
        inflight = null;
        throw err;
      });
  }
  return inflight;
}
