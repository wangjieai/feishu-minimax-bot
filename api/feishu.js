import fetch from "node-fetch";

async function getTenantAccessToken() {
  const resp = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: process.env.FEISHU_APP_ID,
        app_secret: process.env.FEISHU_APP_SECRET
      })
    }
  );
  const data = await resp.json();
  return data.tenant_access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(200).send("OK");
    return;
  }

  const body = req.body;

  // 飞书 challenge 校验
  if (body.challenge) {
    res.status(200).json({ challenge: body.challenge });
    return;
  }

  const userText =
    body?.event?.message?.content?.text || "你好";

  const minimaxResp = await fetch(
    "https://api.minimax.chat/v1/text/chatcompletion_pro",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.MINIMAX_MODEL,
        messages: [{ role: "user", content: userText }]
      })
    }
  );

  const minimaxData = await minimaxResp.json();
  const reply =
    minimaxData?.choices?.[0]?.message?.content || "我还没想好怎么回 🤔";

  const token = await getTenantAccessToken();

  await fetch(
    `https://open.feishu.cn/open-apis/im/v1/messages/${body.event.message.message_id}/reply`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        msg_type: "text",
        content: { text: reply }
      })
    }
  );

  res.status(200).json({ ok: true });
}
