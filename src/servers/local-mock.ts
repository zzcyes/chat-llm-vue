import Mock from 'mockjs'

export const localMock = async (): Promise<any> => {
  return mockMessage()
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
