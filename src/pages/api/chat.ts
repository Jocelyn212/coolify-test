export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const { mensaje } = await request.json();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente IA amigable, útil y conciso. Responde en español. Sé breve y directo en tus respuestas.'
          },
          { role: 'user', content: mensaje }
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify({
      respuesta: data.choices[0].message.content
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (groqError) {
    console.warn('Groq falló, intentando OpenRouter...', groqError);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente IA amigable, útil y conciso. Responde en español. Sé breve y directo en tus respuestas.'
            },
            { role: 'user', content: mensaje }
          ],
          max_tokens: 512,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      return new Response(JSON.stringify({
        respuesta: data.choices[0].message.content
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (openRouterError) {
      console.error('OpenRouter también falló', openRouterError);
      return new Response(JSON.stringify({ error: 'Servicio no disponible' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
