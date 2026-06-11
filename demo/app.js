/* 进秀电子 AI 智能选型助手 — 演示版
 * 双模式：内置规则引擎（离线可演示） / Claude API 实时对话（填入 API Key 后启用）
 */

// ---------- 通用 ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const STORAGE_KEY = "jx_demo_anthropic_key";
const CLAUDE_MODEL = "claude-opus-4-8";

function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

function refreshModeBadge() {
  const badge = $("#modeBadge");
  if (getApiKey()) {
    badge.textContent = "AI 模式（Claude 实时对话）";
    badge.className = "badge badge-ai";
  } else {
    badge.textContent = "演示模式（内置规则引擎）";
    badge.className = "badge badge-demo";
  }
}

// ---------- Tab 切换 ----------
$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $("#tab-" + tab.dataset.tab).classList.add("active");
  });
});

// ---------- 设置抽屉 ----------
$("#settingsBtn").addEventListener("click", () => {
  $("#apiKeyInput").value = getApiKey();
  $("#settingsDrawer").classList.remove("hidden");
});
$("#closeDrawerBtn").addEventListener("click", () => $("#settingsDrawer").classList.add("hidden"));
$("#saveKeyBtn").addEventListener("click", () => {
  const key = $("#apiKeyInput").value.trim();
  if (key) localStorage.setItem(STORAGE_KEY, key);
  refreshModeBadge();
  $("#settingsDrawer").classList.add("hidden");
});
$("#clearKeyBtn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  $("#apiKeyInput").value = "";
  refreshModeBadge();
});
$("#settingsDrawer").addEventListener("click", (e) => {
  if (e.target === $("#settingsDrawer")) $("#settingsDrawer").classList.add("hidden");
});

// ---------- 产品库渲染 ----------
function renderCatalog() {
  $("#catalogGrid").innerHTML = PRODUCTS.map(
    (p) => `
    <div class="catalog-card">
      <span class="cat">${p.category}</span>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      ${p.inner ? `<p>内部尺寸：${p.inner.l}×${p.inner.w}×${p.inner.h} mm</p>` : ""}
      ${p.noiseReduction ? `<p>隔音量：≈${p.noiseReduction} dB</p>` : ""}
      <p class="price">${p.priceRange}</p>
      <p>交期：${p.leadTime}</p>
    </div>`
  ).join("");
}
renderCatalog();

// ---------- CPQ 报价（演示规则，价格为虚构示例） ----------
const CPQ_RULES = {
  // 基础单价：元 / 立方米（按产品类型与隔音等级，示例数据）
  basePricePerM3: {
    box: { 25: 12000, 35: 18000, 45: 28000 },
    room: { 25: 8000, 35: 12000, 45: 18000 },
    anechoic: { 25: 20000, 35: 30000, 45: 45000 },
    line: { 25: 15000, 35: 22000, 45: 34000 },
  },
  minPrice: { box: 6000, room: 60000, anechoic: 120000, line: 50000 },
  options: {
    optWindow: { name: "隔音观察窗", price: 1500 },
    optVent: { name: "排风消音通道", price: 3500 },
    optPanel: { name: "线缆接口板", price: 800 },
    optWheel: { name: "移动脚轮", price: 600 },
    optLight: { name: "内置照明", price: 400 },
  },
  leadTimeWeeks: { box: [2, 4], room: [6, 8], anechoic: [8, 12], line: [5, 7] },
  qtyDiscount: (qty) => (qty >= 10 ? 0.85 : qty >= 5 ? 0.92 : qty >= 3 ? 0.96 : 1),
};

const fmt = (n) => "¥" + Math.round(n).toLocaleString("zh-CN");

function calcQuote({ type, l, w, h, db, qty, opts }) {
  const volume = (l / 1000) * (w / 1000) * (h / 1000);
  const unitBase = Math.max(volume * CPQ_RULES.basePricePerM3[type][db], CPQ_RULES.minPrice[type]);
  const optItems = opts.map((id) => CPQ_RULES.options[id]);
  const optTotal = optItems.reduce((s, o) => s + o.price, 0);
  const discount = CPQ_RULES.qtyDiscount(qty);
  const unitPrice = (unitBase + optTotal) * discount;
  const total = unitPrice * qty;
  return {
    volume, unitBase, optItems, optTotal, discount, unitPrice, total,
    range: [total * 0.9, total * 1.15],
    leadTime: CPQ_RULES.leadTimeWeeks[type],
  };
}

$("#cpqForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const opts = ["optWindow", "optVent", "optPanel", "optWheel", "optLight"].filter((id) => $("#" + id).checked);
  const q = calcQuote({
    type: $("#cpqType").value,
    l: +$("#cpqL").value, w: +$("#cpqW").value, h: +$("#cpqH").value,
    db: +$("#cpqDb").value,
    qty: +$("#cpqQty").value,
    opts,
  });
  const typeName = $("#cpqType").selectedOptions[0].textContent;
  $("#cpqResult").innerHTML = `
    <h2>估算结果</h2>
    <p class="muted">${typeName} · 内部 ${$("#cpqL").value}×${$("#cpqW").value}×${$("#cpqH").value} mm · 隔音 ≈${$("#cpqDb").value}dB · ${$("#cpqQty").value} 台</p>
    <div class="total">${fmt(q.range[0])} – ${fmt(q.range[1])}</div>
    <table>
      <tr><td>箱体基础价（${q.volume.toFixed(2)} m³）</td><td>${fmt(q.unitBase)}</td></tr>
      ${q.optItems.map((o) => `<tr><td>选配：${o.name}</td><td>${fmt(o.price)}</td></tr>`).join("")}
      ${q.discount < 1 ? `<tr><td>批量折扣</td><td>×${q.discount}</td></tr>` : ""}
      <tr><td><b>单台估算</b></td><td><b>${fmt(q.unitPrice)}</b></td></tr>
    </table>
    <p class="lead-time">预计交期：${q.leadTime[0]}–${q.leadTime[1]} 周</p>
    <p class="muted small">最终价格以工程评估后的正式报价单为准。点击"智能选型对话"可继续咨询技术细节。</p>
  `;
});

// ---------- 聊天 ----------
const chatLog = $("#chatLog");
const history = []; // Claude 模式的多轮对话历史

function appendMsg(role, html) {
  const div = document.createElement("div");
  div.className = "msg msg-" + role;
  div.innerHTML = `<div class="msg-body">${html}</div>`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div.querySelector(".msg-body");
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function productCard(p) {
  return `<div class="prod-card"><b>${p.name}</b>${p.desc}<br/>
    ${p.inner ? `内部尺寸：${p.inner.l}×${p.inner.w}×${p.inner.h} mm · ` : ""}
    ${p.noiseReduction ? `隔音量 ≈${p.noiseReduction}dB · ` : ""}交期 ${p.leadTime}<br/>
    <span class="price">${p.priceRange}</span></div>`;
}

// --- 规则引擎（演示模式） ---
function ruleEngineReply(text) {
  const t = text.toUpperCase();
  // 关键词打分匹配
  const scored = PRODUCTS.map((p) => ({
    p,
    score: p.keywords.reduce((s, k) => s + (t.includes(k.toUpperCase()) ? 1 : 0), 0),
  })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

  // 提取尺寸（米或毫米）与分贝
  const mm = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(米|m|mm|毫米)/gi)].map((m) =>
    /米|^m$/i.test(m[2]) && !/mm|毫米/i.test(m[2]) ? parseFloat(m[1]) * 1000 : parseFloat(m[1])
  );
  const dbMatch = text.match(/(\d{2})\s*分?贝?dB?/i);
  const needDb = dbMatch ? parseInt(dbMatch[1], 10) : null;

  if (!scored.length) {
    return `感谢咨询！为了精准推荐，请补充一些信息：
<ul><li>测试对象是什么？（如喇叭、风机、整机、接口板…）</li>
<li>大致的尺寸要求或安装场景（桌面 / 工位 / 独立房间 / 产线在线）</li>
<li>目标隔音量（dB）或测试标准</li></ul>
您也可以直接切换到"隔音箱快速报价"标签页，按参数生成预算。`;
  }

  let picks = scored.slice(0, 2).map((x) => x.p);

  // 尺寸过滤：有箱体内尺寸要求时优先满足
  if (mm.length && picks.some((p) => p.inner)) {
    const need = Math.max(...mm);
    const fit = PRODUCTS.filter((p) => p.inner && Math.min(p.inner.l, p.inner.w) >= need);
    if (fit.length) picks = [fit[0], ...picks.filter((p) => p.id !== fit[0].id)].slice(0, 2);
    else picks = [PRODUCTS.find((p) => p.id === "JX-AR"), picks[0]]; // 超出标准箱体 → 定制静音房
  }
  // 隔音量过滤
  if (needDb) {
    const fit = picks.filter((p) => !p.noiseReduction || p.noiseReduction >= needDb);
    if (fit.length) picks = fit;
  }

  let reply = `根据您的需求，推荐以下方案：`;
  picks.forEach((p) => (reply += productCard(p)));
  reply += `<br/>下一步建议：
<ul><li>声学类产品可在"隔音箱快速报价"页输入具体尺寸生成预算区间</li>
<li>留下联系方式或致电 021-33730078，工程师将在 1 个工作日内提供正式方案</li></ul>`;
  return reply;
}

// --- Claude 模式（浏览器直连 Messages API，流式） ---
const SYSTEM_PROMPT = `你是上海进秀电子科技有限公司（声学设备及工装治具非标定制制造商）的售前智能选型助手。

你的职责：
1. 根据客户描述的测试对象、尺寸、隔音量、产线场景，从下方产品库中推荐最合适的产品（最多2个），说明推荐理由
2. 给出价格区间和交期（来自产品库），并说明"最终以工程评估报价为准"
3. 需求超出标准品时引导至定制方案（静音房/消音室/定制治具），并询问场地尺寸、目标指标等关键参数
4. 信息不足时，一次最多追问3个关键问题
5. 适时引导客户留下联系方式，或致电 021-33730078 / 发邮件 jx@jinxiutec.com

要求：用简体中文，回答简洁专业（150字以内为宜），像有经验的声学设备销售工程师。不要编造产品库以外的型号和价格。

产品库（价格为演示用示例数据）：
${JSON.stringify(PRODUCTS, null, 0)}`;

async function claudeReply(userText, bodyEl) {
  history.push({ role: "user", content: userText });
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: history,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    history.pop();
    throw new Error(err?.error?.message || `API 请求失败（HTTP ${resp.status}）`);
  }

  // 解析 SSE 流
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  bodyEl.classList.add("typing");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // 留下不完整的一行
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      let evt;
      try { evt = JSON.parse(line.slice(6)); } catch { continue; }
      if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
        fullText += evt.delta.text;
        bodyEl.textContent = fullText;
        chatLog.scrollTop = chatLog.scrollHeight;
      }
    }
  }
  bodyEl.classList.remove("typing");
  history.push({ role: "assistant", content: fullText });
}

// --- 发送处理 ---
let busy = false;
async function handleSend(text) {
  if (busy || !text.trim()) return;
  busy = true;
  appendMsg("user", esc(text));
  $("#chatText").value = "";

  if (getApiKey()) {
    const bodyEl = appendMsg("bot", "");
    bodyEl.classList.add("typing");
    try {
      await claudeReply(text, bodyEl);
    } catch (err) {
      bodyEl.classList.remove("typing");
      bodyEl.innerHTML = `⚠ AI 模式调用失败：${esc(err.message)}<br/>已自动回退到内置规则引擎：<br/><br/>` + ruleEngineReply(text);
    }
  } else {
    const bodyEl = appendMsg("bot", "");
    bodyEl.classList.add("typing");
    await new Promise((r) => setTimeout(r, 500)); // 模拟思考
    bodyEl.classList.remove("typing");
    bodyEl.innerHTML = ruleEngineReply(text);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  busy = false;
}

$("#chatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  handleSend($("#chatText").value);
});

$$(".chip").forEach((chip) =>
  chip.addEventListener("click", () => handleSend(chip.textContent))
);

refreshModeBadge();
