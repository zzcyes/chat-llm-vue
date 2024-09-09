import OpenAI from 'openai'

const $MOONSHOT_API_KEY = import.meta.env.VITE_MOONSHOT_API_KEY

const client = new OpenAI({
  apiKey: $MOONSHOT_API_KEY, // This is the default and can be omitted
  dangerouslyAllowBrowser: true,
  baseURL: 'https://api.moonshot.cn/v1'
})

export const moonshotAi = async (messages: any) => {
  const completion = await client.chat.completions.create({
    model: 'moonshot-v1-8k',
    messages,
    temperature: 0.3
  })
  console.debug('completion', completion)
  return completion.choices[0].message
}

export const moonshotAiStream = async (messages: any) => {
  const stream = await client.chat.completions.create({
    model: 'moonshot-v1-8k',
    messages,
    temperature: 0.3,
    stream: true
  })
  return stream
}
