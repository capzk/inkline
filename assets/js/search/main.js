/**
 * 搜索页入口：只在 /search/ 页面加载（由布局按页注入）。
 */
import { loadIndex } from './engine.js';
import { mount } from './ui.js';

const root = document.querySelector('[data-search]');
if (root) mount(root, loadIndex);
