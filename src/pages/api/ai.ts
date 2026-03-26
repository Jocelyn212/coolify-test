export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const data = await request.json();
  const { texto, accion, metadata } = data as { texto: string; accion: string; metadata?: Record<string, string> };

  const prompts: Record<string, string> = {
    corregir: `Corrige únicamente la ortografía y gramática de este texto sin cambiar nada más. Devuelve solo el texto corregido sin explicaciones: "${texto}"`,
    mejorar: `Mejora la redacción de este texto haciéndolo más profesional y claro. Devuelve solo el texto mejorado sin explicaciones: "${texto}"`,
    resumir: `Resume este texto de forma concisa manteniendo las ideas principales. Devuelve solo el resumen sin explicaciones: "${texto}"`,
    email: `Genera un email profesional con el siguiente contenido y tono "${metadata?.tono || 'formal'}". Asunto: "${metadata?.asunto}". Contenido: "${texto}". Devuelve solo el cuerpo del email sin explicaciones adicionales.`,
    redes: `Adapta este texto para ${metadata?.plataforma || 'redes sociales'} manteniendo el mensaje principal. Considera los límites y estilo de la plataforma. Devuelve solo el texto adaptado: "${texto}"`,
    traducir: `Traduce este texto al ${metadata?.idioma || 'inglés'} de forma COHERENTE y NATURAL, no literal. Mantén el contexto, tono, significado real y expresividad del original. Evita traducciones palabra por palabra que pierdan el sentido. Adapta la expresión al estilo natural del ${metadata?.idioma || 'inglés'}. Devuelve SOLO la traducción sin explicaciones: "${texto}"`,
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompts[accion] }],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    const responseData = await response.json();

    return new Response(JSON.stringify({
      resultado: responseData.choices[0].message.content
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
          messages: [{ role: 'user', content: prompts[accion] }],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      const responseData = await response.json();

      return new Response(JSON.stringify({
        resultado: responseData.choices[0].message.content
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