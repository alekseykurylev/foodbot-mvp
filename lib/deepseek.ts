import OpenAI from "openai";

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
    messages: [{ role: "user", content: text }],
  });

  return completion.choices[0]?.message.content ?? "";
}
