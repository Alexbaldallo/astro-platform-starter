import Papa from 'papaparse';
import productosLocales from './productos.csv?raw';
import { GOOGLE_SHEETS_CSV_URL } from './sheetUrl.js';

// Acepta precios con punto o coma decimal ("84.99", "84,99", "1.234,56 €")
export function parsearPrecio(valor) {
    let s = String(valor ?? '')
        .trim()
        .replace(/[€\s]/g, '');
    const coma = s.lastIndexOf(',');
    const punto = s.lastIndexOf('.');
    if (coma > -1 && punto > -1) {
        // el separador que aparece más a la derecha es el decimal
        s = coma > punto ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else {
        s = s.replace(',', '.');
    }
    return parseFloat(s);
}

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
            currentPrice: parsearPrecio(row.currentPrice),
            originalPrice: parsearPrecio(row.originalPrice),
            image: row.image,
            features: row.features ? row.features.split('|').map((f) => f.trim()).filter(Boolean) : [],
            bestseller: row.bestseller?.toLowerCase() === 'true',
            flashSale: row.flashSale?.toLowerCase() === 'true',
            category: row.category,
            affiliateLink: row.affiliateLink
        }));
}
