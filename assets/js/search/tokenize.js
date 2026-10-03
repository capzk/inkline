/**
 * 中文友好的检索分词层。
 *
 * 中文没有天然的空格分词，轻量且可靠的通用做法是「二元切分（bigram）」：
 *   「系统管理」→ 相邻两字组合 → "系统" "统管" "管理"
 * 查询时用同一套规则切分，两边只要共享任意一个二元片段就能命中，
 * 于是「系统管理」「管理系统」「统管」「理的」都能找到同一篇文章，
 * 而纯按空格切词的 lunr / Fuse.js 默认行为会把整段中文当成一个词，几乎搜不到东西。
 *
 * 英文与数字按连续串整体切分，配合子串匹配天然获得前缀检索能力（搜 dock 命中 Docker）。
 * 本文件不依赖 DOM，可单独在 Node 里跑测试。
 */

const CJK_RANGES = '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\u3040-\\u30ff\\uac00-\\ud7af';
const CJK_RE = new RegExp('[' + CJK_RANGES + ']');
// 中日韩文字之间夹的空白多半来自 Markdown 换行，会切断二元片段，需要抹掉
const CJK_GAP_RE = new RegExp('([' + CJK_RANGES + '])\\s+(?=[' + CJK_RANGES + '])', 'g');
const ASCII_ALNUM_RE = /[0-9a-z]/i;
// 全角与半角字符码位相差 0xFEE0，统一成半角后再比较，避免「Ｄｏｃｋｅｒ」搜不到 Docker
const FULLWIDTH_RE = /[\uff01-\uff5e]/g;
const ODD_SPACE_RE = /[\u3000\u00a0\u2000-\u200b\ufeff]/g;

/** 是否中日韩文字（含常见扩展区、假名、谚文）。 */
export const isCJK = (ch) => CJK_RE.test(ch);

/**
 * 展示用归一：折叠空白 + 抹掉中日韩字间空白。
 * 不改大小写、不做全/半角转换，保留原文排版直接用于渲染。
 */
export function collapse(input) {
  return String(input == null ? '' : input)
    .replace(ODD_SPACE_RE, ' ')
    .replace(CJK_GAP_RE, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 匹配用归一：在 collapse 基础上再做全角→半角、统一小写。 */
export function fold(input) {
  return collapse(input)
    .replace(FULLWIDTH_RE, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase();
}

/** 按「连续同类字符」切段：中日韩片段整体保留，英文数字片段整体保留。 */
export function segment(key) {
  const out = [];
  let buf = '';
  let bufCJK = false;
  const flush = () => {
    if (buf) {
      out.push(buf);
      buf = '';
    }
  };
  for (const ch of key) {
    if (!isCJK(ch) && !ASCII_ALNUM_RE.test(ch)) {
      flush();
      continue;
    }
    const cjk = isCJK(ch);
    if (buf && cjk !== bufCJK) flush();
    buf += ch;
    bufCJK = cjk;
  }
  flush();
  return out;
}

/** 把查询串切成检索词元：中日韩片段做二元切分，其余片段原样保留。 */
export function tokenize(key) {
  const out = [];
  for (const seg of segment(key)) {
    if (!isCJK(seg[0])) {
      out.push(seg);
    } else if (seg.length === 1) {
      out.push(seg);
    } else {
      for (let i = 0; i < seg.length - 1; i += 1) out.push(seg.slice(i, i + 2));
    }
  }
  return out;
}

/** 统计 needle 在 haystack 中不重叠出现的次数。 */
export function countOccurrences(haystack, needle) {
  if (!haystack || !needle) return 0;
  let n = 0;
  let at = 0;
  for (;;) {
    const p = haystack.indexOf(needle, at);
    if (p < 0) return n;
    n += 1;
    at = p + needle.length;
  }
}
