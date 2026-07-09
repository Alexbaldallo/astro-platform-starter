/**
 * Oferta del día — automatización de Chronux
 *
 * Uso:
 *   node automation/oferta-diaria.mjs generar   → elige la oferta del día y genera la imagen para Instagram
 *   node automation/oferta-diaria.mjs publicar  → publica la imagen en Instagram (Graph API de Meta)
 *
 * Variables de entorno (se configuran como Secrets en GitHub Actions):
 *   IG_USER_ID       ID de la cuenta de Instagram de empresa
 *   IG_ACCESS_TOKEN  Token de acceso de la Graph API de Meta
 *   SITE_URL         (opcional) URL pública de la web; por defecto https://chronux.shop
 */
import fs from 'node:fs';
import Papa from 'papaparse';
import { GOOGLE_SHEETS_CSV_URL } from '../src/data/sheetUrl.js';

const SITE_URL = process.env.SITE_URL || 'https://chronux.shop';
const GRAPH_API = 'https://graph.facebook.com/v21.0';

const HOY = new Date().toISOString().slice(0, 10);
const IMG_DIR = 'public/ig';
const IMG_NAME = `oferta-${HOY}.jpg`;
const ESTADO_PATH = 'automation/.oferta-hoy.json';

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

// Acepta precios con punto o coma decimal ("84.99", "84,99", "1.234,56 €")
function parsearPrecio(valor) {
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

// ---------- Datos ----------

async function cargarProductos() {
    let csvText;
    try {
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        csvText = await response.text();
        if (csvText.trim().startsWith('<')) throw new Error('la hoja ya no está publicada como CSV');
    } catch (error) {
        console.warn(`⚠️ No se pudo leer Google Sheets (${error.message}). Usando src/data/productos.csv como respaldo.`);
        csvText = fs.readFileSync('src/data/productos.csv', 'utf8');
    }

    const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    return data
        .filter((row) => row.name)
        .map((row) => {
            const currentPrice = parsearPrecio(row.currentPrice);
            const originalPrice = parsearPrecio(row.originalPrice);
            return {
                name: row.name,
                brand: row.brand,
                currentPrice,
                originalPrice,
                discount: originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0,
                image: row.image,
                flashSale: row.flashSale?.toLowerCase() === 'true',
                affiliateLink: row.affiliateLink
            };
        });
}

function elegirOfertaDelDia(productos) {
    // Prioridad: ofertas flash → productos con descuento → cualquiera.
    // Rotación determinista por día del año para no repetir siempre el mismo.
    const candidatos = productos.filter((p) => p.flashSale).length
        ? productos.filter((p) => p.flashSale)
        : productos.filter((p) => p.discount > 0).length
          ? productos.filter((p) => p.discount > 0)
          : productos;

    const diaDelAno = Math.floor((Date.now() - Date.parse(new Date().getFullYear() + '-01-01')) / 86400000);
    return candidatos[diaDelAno % candidatos.length];
}

function textoDelPost(p) {
    const lineas = [
        `⌚ ${p.brand} ${p.name} — Oferta del día`,
        p.discount > 0
            ? `💰 Ahora ${euros.format(p.currentPrice)} (antes ${euros.format(p.originalPrice)}, −${p.discount}%)`
            : `💰 ${euros.format(p.currentPrice)}`,
        `🛒 Enlace en la bio → chronux.shop`,
        '',
        'Como Afiliado de Amazon, obtenemos ingresos por las compras adscritas. El precio puede variar en Amazon.',
        '',
        '#relojes #reloj #ofertas #amazon #descuento #watches #watchlover #chronux'
    ];
    return lineas.join('\n');
}

// ---------- Imagen ----------

function plantillaHTML(p) {
    const precioAntes =
        p.discount > 0
            ? `<span class="antes">${euros.format(p.originalPrice)}</span><span class="badge">−${p.discount}%</span>`
            : '';
    return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        width: 1080px; height: 1080px; overflow: hidden;
        font-family: 'Inter', -apple-system, sans-serif;
        background: #0b0b0e radial-gradient(ellipse 90% 60% at 50% -10%, rgba(201,168,106,0.14), transparent 70%);
        color: #f4f1e8; display: flex; flex-direction: column; align-items: center;
        padding: 64px; text-align: center;
    }
    .logo { font-family: Georgia, serif; font-size: 44px; letter-spacing: 0.32em; }
    .logo b { color: #c9a86a; font-weight: 400; }
    .kicker { margin-top: 10px; font-size: 21px; letter-spacing: 0.45em; text-transform: uppercase; color: #c9a86a; }
    .panel {
        margin: 44px 0; width: 620px; height: 480px; border-radius: 18px;
        background: linear-gradient(180deg, #faf9f6 0%, #edeae3 100%);
        display: flex; align-items: center; justify-content: center; padding: 36px; position: relative;
    }
    .panel img { max-width: 100%; max-height: 100%; object-fit: contain; mix-blend-mode: multiply; }
    .mono {
        display: none; font-family: Georgia, serif; font-size: 150px; color: #c9a86a;
        border: 4px solid #c9a86a; border-radius: 50%; width: 280px; height: 280px;
        line-height: 272px;
    }
    .brand { font-size: 26px; letter-spacing: 0.3em; text-transform: uppercase; color: #c9a86a; font-weight: 600; }
    .name { font-family: Georgia, serif; font-size: 62px; margin: 10px 0 26px; }
    .precio { display: flex; align-items: baseline; gap: 22px; justify-content: center; }
    .ahora { font-size: 74px; font-weight: 800; }
    .antes { font-size: 38px; color: #8b887f; text-decoration: line-through; }
    .badge {
        font-size: 34px; font-weight: 800; color: #14110a; padding: 8px 20px; border-radius: 8px;
        background: linear-gradient(135deg, #dfc08a, #c9a86a, #a8843f); align-self: center;
    }
    .pie { margin-top: auto; font-size: 24px; letter-spacing: 0.2em; color: rgba(244,241,232,0.6); text-transform: uppercase; }
    </style></head><body>
        <div class="logo">CHRONUX<b>.</b></div>
        <div class="kicker">Oferta del día</div>
        <div class="panel">
            <img src="${p.image}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
            <div class="mono">C</div>
        </div>
        <div class="brand">${p.brand}</div>
        <div class="name">${p.name}</div>
        <div class="precio"><span class="ahora">${euros.format(p.currentPrice)}</span>${precioAntes}</div>
        <div class="pie">chronux.shop · enlace en la bio</div>
    </body></html>`;
}

async function generar() {
    const productos = await cargarProductos();
    const oferta = elegirOfertaDelDia(productos);
    console.log(`Oferta del día: ${oferta.brand} ${oferta.name} (${euros.format(oferta.currentPrice)}, −${oferta.discount}%)`);

    const { chromium } = await import('playwright');
    let browser;
    try {
        browser = await chromium.launch();
    } catch {
        // Entornos con Chromium preinstalado fuera del registro de Playwright
        browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    }

    const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
    await page.setContent(plantillaHTML(oferta), { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000); // dar tiempo a que cargue (o falle) la foto del producto

    fs.rmSync(IMG_DIR, { recursive: true, force: true });
    fs.mkdirSync(IMG_DIR, { recursive: true });
    await page.screenshot({ path: `${IMG_DIR}/${IMG_NAME}`, type: 'jpeg', quality: 92 });
    await browser.close();

    fs.writeFileSync(ESTADO_PATH, JSON.stringify({ imagen: IMG_NAME, caption: textoDelPost(oferta) }, null, 2));
    console.log(`✅ Imagen generada: ${IMG_DIR}/${IMG_NAME}`);
}

// ---------- Instagram ----------

async function esperarImagenPublica(url) {
    // La imagen se sirve desde chronux.shop: hay que esperar a que Netlify despliegue el commit
    for (let intento = 1; intento <= 30; intento++) {
        const res = await fetch(url, { method: 'HEAD' }).catch(() => null);
        if (res?.ok) return;
        console.log(`Esperando a que la imagen esté publicada en ${url} (intento ${intento}/30)...`);
        await new Promise((r) => setTimeout(r, 20000));
    }
    throw new Error(`La imagen nunca llegó a estar disponible en ${url}`);
}

async function llamadaGraph(ruta, params) {
    const res = await fetch(`${GRAPH_API}/${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params)
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error?.message || `HTTP ${res.status}`);
    return json;
}

async function publicar() {
    const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;
    if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
        console.log('ℹ️ IG_USER_ID / IG_ACCESS_TOKEN no configurados: me salto la publicación en Instagram.');
        return;
    }
    if (!fs.existsSync(ESTADO_PATH)) throw new Error(`No existe ${ESTADO_PATH}: ejecuta antes "generar".`);
    const { imagen, caption } = JSON.parse(fs.readFileSync(ESTADO_PATH, 'utf8'));
    const imageUrl = `${SITE_URL}/ig/${imagen}`;

    await esperarImagenPublica(imageUrl);

    const { id: creationId } = await llamadaGraph(`${IG_USER_ID}/media`, {
        image_url: imageUrl,
        caption,
        access_token: IG_ACCESS_TOKEN
    });
    console.log(`Contenedor de publicación creado: ${creationId}`);

    // Instagram puede tardar unos segundos en procesar la imagen
    for (let intento = 1; ; intento++) {
        try {
            const { id } = await llamadaGraph(`${IG_USER_ID}/media_publish`, {
                creation_id: creationId,
                access_token: IG_ACCESS_TOKEN
            });
            console.log(`✅ Publicado en Instagram: ${id}`);
            return;
        } catch (error) {
            if (intento >= 6) throw error;
            console.log(`Instagram aún procesando (${error.message}); reintento ${intento}/6...`);
            await new Promise((r) => setTimeout(r, 15000));
        }
    }
}

// ---------- Main ----------

const orden = process.argv[2];
if (orden === 'generar') await generar();
else if (orden === 'publicar') await publicar();
else {
    console.error('Uso: node automation/oferta-diaria.mjs [generar|publicar]');
    process.exit(1);
}
