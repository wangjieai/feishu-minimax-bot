import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(200).send("OK");
    return;
  }

  const body = req.body;

  // 飞书第一次会校验
  if (body.challenge) {
    res.status(200).json({ challenge: body.challenge });
    return;
  }

  const text = body?.event?.message?.content?.text || "你好";

  const minimaxResp = await fetch(
    "https://api.minimax.chat/v1/text/chatcompletion_pro",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MINIMAX_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.MINIMAX_MODEL,
        messages: [{ role: "user", content: text }]
      })
    }
  );

  const data = await minimaxResp.json();
  const reply = data?.choices?.[0]?.message?.content || "我没想好怎么回答你 😅";

  res.status(200).json({
    msg_type: "text",
    content: { text: reply }
  });
}
