# agentic-commerce

面向制造业的 AI 售前智能化（agentic commerce）项目。

## 当前内容

### 1. 进秀电子 · AI 智能选型助手（演示版）

针对[上海进秀电子科技有限公司](https://www.jinxiutec.cn/)（声学设备及工装治具非标定制制造商）制作的售前智能化演示，位于 [`demo/`](demo/)。

**功能：**

- **智能选型对话** — 客户用自然语言描述需求（测试对象、尺寸、隔音量），自动匹配产品并给出预算区间
  - 演示模式：内置规则引擎，无需联网即可演示
  - AI 模式：在"设置"中填入 Anthropic API Key，切换为 Claude（`claude-opus-4-8`）实时流式对话
- **隔音箱快速报价（CPQ）** — 按尺寸/隔音等级/选配件参数化估算预算区间与交期
- **产品库** — 声学产品、测试卡、工装治具示例数据

**运行方式：** 纯静态页面，无构建步骤。

```bash
cd demo
python3 -m http.server 8000
# 打开 http://localhost:8000
```

也可直接双击打开 `demo/index.html`（AI 模式需通过 http 协议访问）。

> ⚠ 演示中所有产品价格均为虚构示例数据，仅用于展示选型/报价逻辑。

### 2. 合作方案书

[`docs/jinxiu-proposal.md`](docs/jinxiu-proposal.md) — 可直接修改后发送给客户的售前数字化合作方案（AI 选型助手 → CPQ 报价 → 售后维保三阶段路线）。
