/**
 * quick-scrape.js — Scraping mínimo para v2.0.0
 * Solo extrae: URL, title, meta description
 */

/**
 * Scraping básico de una URL
 * @param {string} url - URL a scrapear
 * @returns {Promise<object>} Datos básicos del sitio
 */
export async function quickScrape(url) {
  console.log(`\n🔍 Quick scraping: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extraer información básica
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    console.log(`   ✅ Title: ${title.slice(0, 60)}...`);
    console.log(`   ✅ Description: ${description.slice(0, 60)}...`);

    return {
      url,
      title,
      description,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    console.warn(`   ⚠️ Scraping failed: ${error.message}`);

    // Fallback mínimo
    return {
      url,
      title: url,
      description: '',
      scrapedAt: new Date().toISOString()
    };
  }
}
