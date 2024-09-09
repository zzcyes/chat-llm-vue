import axios, { AxiosResponse } from 'axios'
import Mock from 'mockjs'

interface Message {
  role: string
  content: string
}

interface ChatCompletionResponse {
  choices: {
    message: {
      role: string
      content: string
    }
  }[]
}

export const llmNode = async (messages: Message[]): Promise<Message> => {
  const completion: AxiosResponse<ChatCompletionResponse> = await axios.post('/api/chat', {
    messages,
    model: 'moonshot-v1-8k'
  })
  console.debug('completion', completion)
  return completion.data.choices[0].message
}

export const llmMock = async (): Promise<any> => {
  try {
    const completion: any = await axios.post('/api/chat-mock')
    console.debug('llmMock', completion)
    return completion?.data?.choices?.[0]?.message ?? mockMessage()
  } catch (e) {
    return mockMessage()
  }
}

function mockMessage() {
  return {
    role: 'assistant',
    content: Mock.mock(function () {
      const type = Mock.Random.pick(['text', 'markdown', 'code'])
      if (type === 'text') {
        return Mock.Random.sentence(5, 20)
      } else if (type === 'markdown') {
        return `# ${Mock.Random.title()}\n\n${Mock.Random.paragraph()}\n\n- ${Mock.Random.word()}\n- ${Mock.Random.word()}\n- ${Mock.Random.word()}`
      } else {
        return `\`\`\`python\n${Mock.Random.sentence()}\nprint("${Mock.Random.word()}")\n\`\`\``
      }
    })
  }
}
