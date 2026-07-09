// ==UserScript==
// @name         Chronux — Copiar producto para la hoja
// @namespace    https://chronux.shop
// @version      1.1
// @description  En cualquier página de producto de Amazon, copia la fila lista para pegar en la hoja de Google de Chronux (columnas separadas por tabulador). Antes de pulsar el botón, copia tu enlace de SiteStripe: se usará como affiliateLink.
// @match        https://www.amazon.es/*
// @match        https://www.amazon.com/*
// @match        https://www.amazon.de/*
// @match        https://www.amazon.fr/*
// @match        https://www.amazon.it/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';

    // ⚙️ CONFIGURA ESTO: tu tag de afiliado de Amazon Associates (tipo "chronux-21").
    // Solo se usa como RESPALDO si el portapapeles no contiene un enlace de Amazon:
    // el flujo normal es copiar primero tu enlace de SiteStripe (amzn.to/...) y
    // pulsar después el botón, que lo lee del portapapeles.
    const AFFILIATE_TAG = 'TU-TAG-AQUI';

    const $ = (sel) => document.querySelector(sel);
    const texto = (sel) => $(sel)?.textContent.trim() || '';

    function asin() {
        const m = location.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
        return m ? m[1] : $('#ASIN')?.value || '';
    }

    // Solo actuar en páginas de producto
    if (!asin()) return;

    const limpiarPrecio = (t) => t.replace(/[^\d.,]/g, '').trim();

    function precioActual() {
        for (const s of [
            '#corePriceDisplay_desktop_feature_div .a-price:not(.a-text-price) .a-offscreen',
            '#corePrice_feature_div .a-price .a-offscreen',
            '.a-price:not(.a-text-price) .a-offscreen'
        ]) {
            const t = texto(s);
            if (t) return limpiarPrecio(t);
        }
        return '';
    }

    function precioOriginal() {
        for (const s of ['.basisPrice .a-offscreen', '.a-price.a-text-price .a-offscreen']) {
            const t = texto(s);
            if (t) return limpiarPrecio(t);
        }
        return precioActual(); // sin descuento visible: mismo precio
    }

    function marca() {
        return texto('#bylineInfo')
            .replace(/^(Visita la )?[Tt]ienda de\s*/, '')
            .replace(/^Marca:\s*/i, '')
            .trim();
    }

    function caracteristicas() {
        return [...document.querySelectorAll('#feature-bullets li span')]
            .map((el) => el.textContent.trim())
            .filter((t) => t && t.length < 90)
            .slice(0, 4)
            .join('|');
    }

    function imagen() {
        const img = $('#landingImage');
        return img?.dataset.oldHires || img?.src || '';
    }

    // ¿El texto copiado parece un enlace de afiliado de Amazon?
    function esEnlaceAmazon(t) {
        return /^https?:\/\/(amzn\.(to|eu)|(www\.)?amazon\.[a-z.]+)\//i.test(t.trim());
    }

    // Lee el enlace de SiteStripe del portapapeles; si no hay, construye uno con el tag
    async function enlaceAfiliado() {
        try {
            const copiado = (await navigator.clipboard.readText()).trim();
            if (esEnlaceAmazon(copiado)) return { enlace: copiado, delPortapapeles: true };
        } catch {
            // sin permiso de lectura del portapapeles: usamos el respaldo
        }
        return { enlace: `https://${location.host}/dp/${asin()}?tag=${AFFILIATE_TAG}`, delPortapapeles: false };
    }

    // Orden EXACTO de las columnas de la hoja:
    // name  brand  currentPrice  originalPrice  image  features  bestseller  flashSale  category  affiliateLink
    function filaParaLaHoja(affiliateLink) {
        const campos = [
            texto('#productTitle'),
            marca(),
            precioActual(),
            precioOriginal(),
            imagen(),
            caracteristicas(),
            'false',
            'false',
            'relojes',
            affiliateLink
        ];
        // separados por tabulador: al pegar en Google Sheets cada campo cae en su columna
        return campos.map((c) => String(c).replace(/[\t\n\r]+/g, ' ')).join('\t');
    }

    // Botón flotante con la estética de Chronux
    const btn = document.createElement('button');
    btn.textContent = '⌚ Copiar para Chronux';
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        padding: '14px 22px',
        background: 'linear-gradient(135deg, #dfc08a, #c9a86a, #a8843f)',
        color: '#14110a',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        cursor: 'pointer',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
    });

    btn.addEventListener('click', async () => {
        const { enlace, delPortapapeles } = await enlaceAfiliado();
        GM_setClipboard(filaParaLaHoja(enlace), 'text');
        btn.textContent = delPortapapeles
            ? '✅ ¡Copiado con tu enlace de SiteStripe!'
            : '⚠️ Sin enlace copiado: usé el tag de respaldo';
        setTimeout(() => (btn.textContent = '⌚ Copiar para Chronux'), 3500);
    });

    document.body.appendChild(btn);
})();
