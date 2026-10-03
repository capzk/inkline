/**
 * 搜索页 DOM 渲染与交互：结果高亮、键盘导航、URL 同步、状态面板切换。
 */
import { marks, search, snippet } from './engine.js';

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 界面文案的内置兜底（简体中文）。
 * 正常情况下由 baseof 的 [data-theme-i18n] 注入，这里只是保证脚本被单独引用
 * 或跑单测时依旧可用。{shown} / {total} 由脚本自己替换。
 */
const FALLBACK_I18N = {
  searchLoading: '检索中…',
  searchStatusAll: '共 {total} 条结果',
  searchStatusPartial: '显示前 {shown} 条，共 {total} 条结果',
  searchNoResult: '没有找到相关内容',
  searchNoResultHint: '换个说法、少用几个字，或只保留关键词再试一次。',
  searchErrorTitle: '索引加载失败',
  searchErrorBody: '请确认站点已启用 SearchIndex 输出格式，然后刷新重试。',
};

/** 合并兜底与模板注入的文案；后者优先。 */
function resolveI18n(scope) {
  const out = Object.assign({}, FALLBACK_I18N);
  const node = (scope && scope.querySelector && scope.querySelector('[data-search-i18n]'))
    || document.querySelector('[data-theme-i18n]');
  if (node) {
    try {
      Object.assign(out, JSON.parse(node.textContent) || {});
    } catch (err) {
      // 注入内容损坏时静默退回兜底，不影响检索本身
    }
  }
  return out;
}

const fill = (tpl, vars) => Object.keys(vars).reduce(
  (acc, k) => acc.split('{' + k + '}').join(String(vars[k])),
  String(tpl),
);

/**
 * 先按关键词切分原文、逐段转义再拼装标记，
 * 避免「先转义后匹配」把 &amp; 之类的实体内容误标成命中。
 */
function highlight(text, needles) {
  const src = String(text == null ? '' : text);
  const uniq = (needles || []).filter(Boolean);
  if (!uniq.length) return escapeHtml(src);
  const re = new RegExp('(' + uniq.map(escapeRe).join('|') + ')', 'gi');
  let out = '';
  let last = 0;
  let m = re.exec(src);
  while (m) {
    out += escapeHtml(src.slice(last, m.index)) + '<mark>' + escapeHtml(m[0]) + '</mark>';
    last = m.index + m[0].length;
    m = re.exec(src);
  }
  return out + escapeHtml(src.slice(last));
}

function resultItem(doc, needles) {
  const chip = doc.cats.length
    ? '<span class="chip">' + escapeHtml(doc.cats[0]) + '</span>'
    : '';
  const tags = doc.tags
    .slice(0, 4)
    .map((t) => '<span class="stag">#' + escapeHtml(t) + '</span>')
    .join('');
  const meta = chip + tags;
  const excerpt = snippet(doc, needles);
  return (
    '<a class="sitem" href="' + escapeHtml(doc.url) + '">'
    + '<div class="srow"><h3>' + highlight(doc.title, needles) + '</h3>'
    + (doc.date ? '<time datetime="' + escapeHtml(doc.date) + '">' + escapeHtml(doc.date) + '</time>' : '')
    + '</div>'
    + (excerpt ? '<p class="ssnip">' + highlight(excerpt, needles) + '</p>' : '')
    + (meta ? '<div class="smeta">' + meta + '</div>' : '')
    + '</a>'
  );
}

/**
 * 挂载搜索页。
 * @param {HTMLElement} root 带 data-search 的容器
 * @param {(url:string) => Promise<object[]>} loadIndex 索引加载器（便于替换/测试）
 */
export function mount(root, loadIndex) {
  const input = root.querySelector('[data-search-input]');
  const list = root.querySelector('[data-search-results]');
  const status = root.querySelector('[data-search-status]');
  const clear = root.querySelector('[data-search-clear]');
  const hint = root.querySelector('[data-search-hint]');
  const empty = root.querySelector('[data-search-empty]');
  if (!input || !list) return;

  const i18n = resolveI18n(root);
  const indexUrl = root.getAttribute('data-search-index') || '/searchindex.json';
  let timer = 0;
  let seq = 0;

  const panel = (name) => {
    if (hint) hint.hidden = name !== 'hint';
    if (empty) empty.hidden = name !== 'empty';
    list.hidden = name !== 'results';
  };

  const showEmpty = (title, message, term) => {
    list.innerHTML = '';
    list.hidden = true;
    if (hint) hint.hidden = true;
    if (!empty) return;
    empty.hidden = false;
    const t = empty.querySelector('[data-search-title]');
    const m = empty.querySelector('[data-search-message]');
    const q = empty.querySelector('[data-search-term]');
    if (t) t.textContent = title;
    if (m) m.textContent = message;
    if (q) q.textContent = term || '';
  };

  const idle = () => {
    list.innerHTML = '';
    if (status) status.textContent = '';
    if (clear) clear.hidden = true;
    panel('hint');
  };

  const render = (result, query) => {
    const needles = marks(result);
    if (!result.hits.length) {
      showEmpty(i18n.searchNoResult, i18n.searchNoResultHint, query);
      if (status) status.textContent = '';
      return;
    }
    list.innerHTML = result.hits.map((hit) => resultItem(hit.doc, needles)).join('');
    panel('results');
    if (status) {
      status.textContent = result.total > result.hits.length
        ? fill(i18n.searchStatusPartial, { shown: result.hits.length, total: result.total })
        : fill(i18n.searchStatusAll, { total: result.total });
    }
  };

  const syncUrl = (query) => {
    if (!window.history || !history.replaceState) return;
    history.replaceState(null, '', query ? location.pathname + '?q=' + encodeURIComponent(query) : location.pathname);
  };

  const run = async (query) => {
    const mine = ++seq;
    if (!query) {
      idle();
      return;
    }
    if (clear) clear.hidden = false;
    if (status) status.textContent = i18n.searchLoading;
    panel('results');
    let docs;
    try {
      docs = await loadIndex(indexUrl);
    } catch (err) {
      if (mine === seq) showEmpty(i18n.searchErrorTitle, i18n.searchErrorBody, '');
      return;
    }
    if (mine !== seq) return;
    render(search(docs, query), query);
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const query = input.value.trim();
      syncUrl(query);
      run(query);
    }, 130);
  };

  const items = () => Array.prototype.slice.call(list.querySelectorAll('.sitem'));
  const focusAt = (i) => {
    const all = items();
    if (!all.length) return;
    all[Math.min(Math.max(i, 0), all.length - 1)].focus();
  };

  input.addEventListener('input', schedule);
  if (clear) {
    clear.addEventListener('click', () => {
      input.value = '';
      syncUrl('');
      idle();
      input.focus();
    });
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusAt(0);
    } else if (e.key === 'Enter') {
      // 结果已是实时渲染的，回车直接进第一条，不再触发表单刷新
      const all = items();
      if (all.length) {
        e.preventDefault();
        all[0].click();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      input.value = '';
      syncUrl('');
      idle();
    }
  });

  // 结果已可聚焦，方向键在结果之间移动，回到顶部时跳回输入框
  list.addEventListener('keydown', (e) => {
    const all = items();
    const i = all.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusAt(i + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (i === 0) input.focus();
      else focusAt(i - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      input.focus();
    }
  });

  // 全站快捷键：/ 或 Cmd/Ctrl+K 聚焦搜索框，输入状态下不拦截
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    const tag = t && t.tagName ? t.tagName : '';
    if (e.metaKey || e.ctrlKey) {
      if ((e.key === 'k' || e.key === 'K') && !/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) {
        e.preventDefault();
        input.focus();
        input.select();
      }
      return;
    }
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(tag) && !(t && t.isContentEditable)) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  const initial = new URLSearchParams(location.search).get('q');
  if (initial) {
    input.value = initial;
    syncUrl(initial);
    run(initial);
  } else {
    idle();
  }
  input.focus({ preventScroll: true });
}
