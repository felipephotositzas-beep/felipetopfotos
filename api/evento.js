export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  
  let eventName = 'FelipePhotos';
  let eventCover = 'https://felipetopfotos.vercel.app/pwa-512x512.png';
  let eventDesc = 'Encontre suas melhores fotos nos eventos que você viveu.';
  
  // 1. Buscar os dados reais do evento da API
  try {
    if (id) {
      const response = await fetch(`https://painel.topfotos.com.br/api/eventos/public/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.cover_url) {
          eventCover = data.cover_url;
          eventName = data.name || eventName;
          eventDesc = `Confira as fotos de ${eventName}`;
        }
      }
    }
  } catch(e) {
    console.error('Erro ao buscar dados do evento para OG tags:', e);
  }

  // 2. Buscar o index.html original do próprio Vercel (baseURL)
  const host = req.headers.host || 'felipetopfotos.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  try {
    const htmlRes = await fetch(`${protocol}://${host}/index.html`);
    let html = await htmlRes.text();
    
    // 3. Injetar as tags Open Graph Dinâmicas
    // Substituir as tags padrão pelo conteúdo dinâmico
    html = html.replace('<title>FelipePhotos</title>', `<title>${eventName} - FelipePhotos</title>`);
    
    // Substituir tags
    html = html.replace(/<meta property="og:title" content="[^"]*" \/>/g, `<meta property="og:title" content="${eventName} - FelipePhotos" />`);
    html = html.replace(/<meta property="og:description" content="[^"]*" \/>/g, `<meta property="og:description" content="${eventDesc}" />`);
    html = html.replace(/<meta property="og:image" content="[^"]*" \/>/g, `<meta property="og:image" content="${eventCover}" />`);
    html = html.replace(/<meta name="twitter:image" content="[^"]*" \/>/g, `<meta name="twitter:image" content="${eventCover}" />`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).send(html);
  } catch(e) {
    console.error('Erro ao injetar OG tags:', e);
    res.status(500).send('Erro interno do servidor ao gerar preview.');
  }
}
