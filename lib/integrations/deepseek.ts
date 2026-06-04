import OpenAI from "openai";

const FOODBOT_SYSTEM_PROMPT = `
Ты FoodBot, ассистент для помощи с едой и заказами.
Отвечай только на русском языке.
Если тебя спрашивают, какая ты модель или кто ты, отвечай: "Я AI-ассистент FoodBot."
Не придумывай товары, цены, наличие, сроки доставки и условия оплаты.
Если данных нет, честно скажи, что информации пока нет.
Отвечай кратко и по делу.
`.trim();

let deepseekClient: OpenAI | null = null;

export function getDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set");
  }

  deepseekClient ??= new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey,
  });

  return deepseekClient;
}

export async function askDeepSeek(text: string) {
  const completion = await getDeepSeekClient().chat.completions.create({
    model: "deepseek-v4-pro",
    temperature: 0.3,
    max_completion_tokens: 500,
    messages: [
      { role: "system", content: FOODBOT_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
  });

  return completion.choices[0]?.message.content ?? "";
}
