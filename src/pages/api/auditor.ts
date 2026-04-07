export const prerender = false;

type AuditResult = {
  scores: {
    total: number;
    performance: number;
    mobile: number;
    seo: number;
    bestPractices: number;
  };
  metrics: {
    fcp: string;
    lcp: string;
    tbt: string;
    cls: string;
    si: string;
    inp: string;
    ttfb: string;
  };
  opportunities: string[];
  issues: string[];
  recommendations: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('La URL debe empezar por http:// o https://');
  }

  return parsed.toString();
}

type LighthouseAudit = {
  score?: number | null;
  displayValue?: string;
  numericValue?: number | null;
  title?: string;
  description?: string;
};

type LighthouseResult = {
  categories?: Record<string, { score?: number | null }>;
  audits?: Record<string, LighthouseAudit>;
  fetchTime?: string;
};

function scoreToNumber(score: number | null | undefined) {
  if (typeof score !== 'number') {
    return 0;
  }

  return clamp(Math.round(score * 100), 0, 100);
}

function pushUnique(items: string[], value: string) {
  if (!items.includes(value)) {
    items.push(value);
  }
}

function pushAuditFinding(
  audits: Record<string, LighthouseAudit>,
  auditId: string,
  issue: string,
  recommendation: string,
  issues: string[],
  recommendations: string[],
  prefix = ''
) {
  const audit = audits[auditId];

  if (!audit || (typeof audit.score === 'number' && audit.score >= 1)) {
    return;
  }

  const label = audit.displayValue ? `${audit.displayValue}` : '';
  issues.push(prefix ? `${prefix}${issue}${label ? ` (${label})` : ''}` : `${issue}${label ? ` (${label})` : ''}`);
  recommendations.push(recommendation);
}

function parseLighthouseResult(lighthouse: LighthouseResult, finalUrl: string): AuditResult {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const audits = lighthouse.audits || {};
  const categories = lighthouse.categories || {};

  const performance = scoreToNumber(categories.performance?.score);
  const seo = scoreToNumber(categories.seo?.score);
  const accessibility = scoreToNumber(categories.accessibility?.score);
  const bestPractices = scoreToNumber(categories['best-practices']?.score);

  const mobileSignals = ['viewport', 'tap-targets', 'font-size', 'content-width'];
  const mobileValues = mobileSignals
    .map((id) => audits[id]?.score)
    .filter((score): score is number => typeof score === 'number');
  const mobile = mobileValues.length > 0
    ? clamp(Math.round(mobileValues.reduce((sum, value) => sum + value, 0) / mobileValues.length * 100), 0, 100)
    : accessibility;

  pushAuditFinding(audits, 'server-response-time', 'El servidor responde despacio.', 'Reduce el tiempo de respuesta del servidor, activa cache y revisa consultas lentas.', issues, recommendations, 'Rendimiento: ');
  pushAuditFinding(audits, 'render-blocking-resources', 'Hay recursos que bloquean el pintado inicial.', 'Retrasa scripts no criticos y extrae CSS esencial para que la pagina se vea antes.', issues, recommendations, 'Rendimiento: ');
  pushAuditFinding(audits, 'unused-javascript', 'Hay JavaScript que no se usa en la carga inicial.', 'Elimina o difiere scripts que no sean necesarios al primer render.', issues, recommendations, 'Rendimiento: ');
  pushAuditFinding(audits, 'uses-optimized-images', 'Algunas imagenes pueden estar mejor optimizadas.', 'Convierte imagenes pesadas a formatos mas ligeros y usa tamanos adaptativos.', issues, recommendations, 'Rendimiento: ');
  pushAuditFinding(audits, 'modern-image-formats', 'Se pueden servir imagenes en formatos mas modernos.', 'Usa WebP o AVIF cuando sea posible para bajar el peso total.', issues, recommendations, 'Rendimiento: ');
  pushAuditFinding(audits, 'total-byte-weight', 'El peso total de la pagina es elevado.', 'Reduce el peso de recursos, comprime assets y revisa contenido cargado de mas.', issues, recommendations, 'Rendimiento: ');
  pushAuditFinding(audits, 'largest-contentful-paint-element', 'El elemento principal tarda demasiado en mostrarse.', 'Prioriza el contenido visible y reduce el bloqueo de recursos arriba del pliegue.', issues, recommendations, 'Rendimiento: ');

  pushAuditFinding(audits, 'viewport', 'La configuracion responsive no es correcta.', 'Anade una meta viewport valida para adaptar el diseno a pantallas moviles.', issues, recommendations, 'Movil: ');
  pushAuditFinding(audits, 'tap-targets', 'Hay elementos tactiles demasiado pequenos o juntos.', 'Aumenta el espacio entre botones y enlaces para mejorar la navegacion en movil.', issues, recommendations, 'Movil: ');
  pushAuditFinding(audits, 'font-size', 'El tamanio de texto puede ser dificil de leer en movil.', 'Usa tamanos de fuente mas claros y evita textos demasiado pequenos.', issues, recommendations, 'Movil: ');
  pushAuditFinding(audits, 'content-width', 'Parte del contenido no encaja bien en pantallas pequenas.', 'Revisa anchos fijos y usa diseno fluido para evitar scroll horizontal.', issues, recommendations, 'Movil: ');

  pushAuditFinding(audits, 'document-title', 'El titulo de la pagina no esta bien optimizado.', 'Crea un title unico, claro y orientado a la busqueda principal.', issues, recommendations, 'SEO: ');
  pushAuditFinding(audits, 'meta-description', 'La meta description falta o no es suficientemente util.', 'Escribe una descripcion breve y persuasiva con el valor principal de la pagina.', issues, recommendations, 'SEO: ');
  pushAuditFinding(audits, 'image-alt', 'Hay imagenes sin texto alternativo descriptivo.', 'Anade alt informativo en las imagenes relevantes para accesibilidad y SEO.', issues, recommendations, 'SEO: ');
  pushAuditFinding(audits, 'is-crawlable', 'Hay señales de rastreo que pueden estar limitando a Google.', 'Revisa robots, canonicals y bloqueos accidentales para no frenar el indexado.', issues, recommendations, 'SEO: ');
  pushAuditFinding(audits, 'link-text', 'Algunos enlaces no describen bien a donde llevan.', 'Usa textos de enlace descriptivos para que usuarios y buscadores entiendan el destino.', issues, recommendations, 'SEO: ');
  pushAuditFinding(audits, 'canonical', 'La canonical puede no estar bien definida.', 'Añade una canonical correcta para evitar problemas de contenido duplicado.', issues, recommendations, 'SEO: ');
  pushAuditFinding(audits, 'robots-txt', 'El archivo robots.txt no esta disponible o no es util.', 'Configura robots.txt para orientar mejor el rastreo de buscadores.', issues, recommendations, 'SEO: ');

  if (finalUrl.startsWith('http://')) {
    issues.push('La web sigue cargando por HTTP y no por HTTPS.');
    recommendations.push('Activa HTTPS para mejorar confianza, seguridad y rendimiento percibido.');
  }

  const metricValue = (id: string) => audits[id]?.displayValue || 'N/D';
  const metrics = {
    fcp: metricValue('first-contentful-paint'),
    lcp: metricValue('largest-contentful-paint'),
    tbt: metricValue('total-blocking-time'),
    cls: metricValue('cumulative-layout-shift'),
    si: metricValue('speed-index'),
    inp: metricValue('interaction-to-next-paint') !== 'N/D' ? metricValue('interaction-to-next-paint') : metricValue('max-potential-fid'),
    ttfb: typeof audits['server-response-time']?.numericValue === 'number'
      ? `${Math.round(audits['server-response-time']!.numericValue as number)} ms`
      : metricValue('server-response-time'),
  };

  const opportunities = [
    'render-blocking-resources',
    'server-response-time',
    'unused-javascript',
    'uses-optimized-images',
    'modern-image-formats',
    'total-byte-weight',
    'largest-contentful-paint-element',
  ]
    .map((id) => audits[id])
    .filter((audit): audit is LighthouseAudit => Boolean(audit) && (typeof audit?.score !== 'number' || audit.score < 1))
    .slice(0, 5)
    .map((audit) => audit.displayValue ? `${audit.title || 'Oportunidad detectada'} (${audit.displayValue})` : `${audit.title || 'Oportunidad detectada'}`);

  const lcpMs = audits['largest-contentful-paint']?.numericValue;
  if (typeof lcpMs === 'number' && lcpMs > 4000) {
    pushUnique(issues, `Rendimiento: El contenido principal tarda demasiado en mostrarse (${metrics.lcp}).`);
    pushUnique(recommendations, 'Prioriza el contenido principal visible y optimiza recursos criticos para bajar el LCP.');
    pushUnique(opportunities, `Mejorar LCP del contenido principal (${metrics.lcp})`);
  }

  const fcpMs = audits['first-contentful-paint']?.numericValue;
  if (typeof fcpMs === 'number' && fcpMs > 1800) {
    pushUnique(issues, `Rendimiento: El primer contenido visible aparece tarde (${metrics.fcp}).`);
    pushUnique(recommendations, 'Reduce bloqueo inicial de CSS/JS y mejora tiempos de respuesta para mostrar contenido antes.');
    pushUnique(opportunities, `Reducir tiempo de primer contenido visible (${metrics.fcp})`);
  }

  const clsValue = audits['cumulative-layout-shift']?.numericValue;
  if (typeof clsValue === 'number' && clsValue > 0.1) {
    pushUnique(issues, `Rendimiento: Hay inestabilidad visual durante la carga (${metrics.cls}).`);
    pushUnique(recommendations, 'Reserva espacio para imagenes y bloques dinamicos para evitar saltos de contenido.');
    pushUnique(opportunities, `Reducir saltos visuales durante la carga (${metrics.cls})`);
  }

  const ttfbMs = audits['server-response-time']?.numericValue;
  if (typeof ttfbMs === 'number' && ttfbMs > 800) {
    pushUnique(issues, `Rendimiento: El servidor responde mas lento de lo recomendado (${metrics.ttfb}).`);
    pushUnique(recommendations, 'Optimiza backend, cache y base de datos para reducir el tiempo inicial de respuesta.');
    pushUnique(opportunities, `Reducir tiempo de respuesta del servidor (${metrics.ttfb})`);
  }

  const total = clamp(Math.round((performance + mobile + seo) / 3), 0, 100);

  if (issues.length === 0) {
    issues.push('No se detectaron problemas destacados en Lighthouse para esta URL.');
    recommendations.push('Mantén revisiones periódicas para conservar rendimiento, SEO y experiencia móvil.');
  }

  return {
    scores: {
      total,
      performance,
      mobile,
      seo,
      bestPractices,
    },
    metrics,
    opportunities,
    issues,
    recommendations,
  };
}

export async function POST({ request }: { request: Request }) {
  try {
    const requestBody = await request.json();
    const rawUrl = String(requestBody?.url || '');

    if (!rawUrl.trim()) {
      return new Response(JSON.stringify({ error: 'Debes introducir una URL.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = normalizeUrl(rawUrl);

    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', targetUrl);
    apiUrl.searchParams.set('strategy', 'mobile');
    apiUrl.searchParams.append('category', 'performance');
    apiUrl.searchParams.append('category', 'accessibility');
    apiUrl.searchParams.append('category', 'seo');
    apiUrl.searchParams.append('category', 'best-practices');
    apiUrl.searchParams.set('locale', 'es_ES');

    const apiKey = import.meta.env.PAGE_SPEED_API_KEY || import.meta.env.PAGESPEED_API_KEY;
    if (apiKey) {
      apiUrl.searchParams.set('key', apiKey);
    }

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'No se pudo obtener el informe de Lighthouse.';

      try {
        const errorBody = await response.json();
        const details = errorBody?.error?.message || errorBody?.error?.errors?.[0]?.message;
        if (details) {
          errorMessage = details;
        }
      } catch {
        // Ignorar errores al leer el cuerpo de error.
      }

      if (response.status === 429) {
        errorMessage = 'PageSpeed ha agotado la cuota disponible. Añade una clave API válida en PAGE_SPEED_API_KEY para evitar el límite por defecto.';
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: response.status === 429 ? 429 : 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pageSpeedData = await response.json();

    if (pageSpeedData?.error) {
      return new Response(JSON.stringify({ error: pageSpeedData.error.message || 'Lighthouse no devolvió un informe válido.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lighthouse = pageSpeedData?.lighthouseResult as LighthouseResult | undefined;
    if (!lighthouse) {
      return new Response(JSON.stringify({ error: 'No se encontró un informe Lighthouse para esta URL.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = parseLighthouseResult(lighthouse, pageSpeedData?.id || targetUrl);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al analizar la web.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
