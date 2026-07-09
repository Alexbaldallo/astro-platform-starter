import Papa from 'papaparse';
import productosLocales from './productos.csv?raw';

// Hoja de Google Sheets publicada como CSV (Archivo → Compartir → Publicar en la web → CSV).
// Si creas una hoja nueva, sustituye esta URL por la de tu nueva hoja publicada.
const GOOGLE_SHEETS_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vTs3eBuMJJEBh3N2-CFQYVZLLiQr-1a9pMXENqsrCsfUPndP1Phd-r6u6GCHbHZzGVK2LRFbStCp6tH/pub?gid=865936206&single=true&output=csv';

export async function fetchBestsellers() {
    let csvText;

    try {
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        csvText = await response.text();
        // Si la hoja ya no está publicada, Google devuelve una página HTML en vez de CSV
        if (csvText.trim().startsWith('<')) throw new Error('la hoja ya no está publicada como CSV');
    } catch (error) {
        console.warn(`⚠️ No se pudo leer Google Sheets (${error.message}). Usando src/data/productos.csv como respaldo.`);
        csvText = productosLocales;
    }

    const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    return data
        .filter((row) => row.name)
        .map((row) => ({
            name: row.name,
            brand: row.brand,
            currentPrice: parseFloat(row.currentPrice),
            originalPrice: parseFloat(row.originalPrice),
            image: row.image,
            features: row.features?.split('|') || [],
            bestseller: row.bestseller?.toLowerCase() === 'true',
            flashSale: row.flashSale?.toLowerCase() === 'true',
            category: row.category,
            affiliateLink: row.affiliateLink
        }));
}
