import { OpenAI } from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

// Create OpenAI client configured for OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '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',
  defaultHeaders: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Chrome Home Extension'
  }
})

export async function POST(req) {
  try {
    const { messages } = await req.json()

    // Request the stream from OpenRouter using DeepSeek
    const response = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    })

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response)
    
    // Respond with the stream
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Failed to process chat request', { status: 500 })
  }
}