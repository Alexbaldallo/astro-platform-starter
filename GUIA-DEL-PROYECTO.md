# Guía del proyecto: Chronux — Relojes Premium

Web de afiliados de Amazon con relojes ("Chronux"), construida con **Astro** + **Tailwind** y desplegada en **Netlify**. Esta guía documenta cómo funciona todo para no perderlo de nuevo.

## Cómo funciona

1. La página principal (`src/pages/index.astro`) muestra los productos con el componente `src/components/FeaturedProducts.astro`.
2. Los productos **NO están en el código**: se leen desde una **hoja de Google Sheets publicada como CSV**. La URL está en `src/data/sheetUrl.js`.
3. La portada se **renderiza en el servidor**: cada visita lee la hoja de Google al momento (el CDN de Netlify cachea la página 5 minutos para no saturar a Google). **Editas la hoja → los cambios aparecen solos en la web en unos 5-10 minutos** (Google tarda ~5 min en actualizar el CSV publicado + hasta 5 min de caché). Sin deploys, sin commits, sin tocar nada.
4. (Historia) Los commits antiguos llamados "Actualización automática de datos" eran **commits vacíos** para forzar reconstrucciones cuando la web era estática. Ya no hacen falta.

## Respaldo local (nuevo)

Si Google Sheets no responde o la hoja deja de estar publicada, la web ahora usa automáticamente `src/data/productos.csv` (contiene los 4 relojes recuperados del historial de git). Así la web **siempre compila**, aunque hayas perdido la hoja.

## La hoja de productos (la "nube")

La hoja actual vive en el Google Drive de la cuenta de Alex (creada en julio de 2026 a partir de la plantilla `src/data/productos.csv`, después de perderse la original). Su URL de publicación está en **`src/data/sheetUrl.js`** — ese es el único sitio del código que hay que tocar si algún día se cambia de hoja.

### Si hay que crear otra hoja nueva

1. Crea una hoja nueva en [sheets.google.com](https://sheets.google.com).
2. Importa `src/data/productos.csv` (Archivo → Importar → Subir) como punto de partida.
3. Publícala: **Archivo → Compartir → Publicar en la web** → elige la pestaña y formato **"Valores separados por comas (.csv)"** → Publicar.
4. Copia la URL que te da Google y pégala en `GOOGLE_SHEETS_CSV_URL` dentro de `src/data/sheetUrl.js`.

> Los precios pueden escribirse con coma o punto decimal: el código entiende ambos. Google tarda ~5 minutos en reflejar los cambios de la hoja en el CSV publicado.

### Columnas de la hoja (exactas, en la primera fila)

| Columna | Ejemplo | Notas |
|---|---|---|
| `name` | CHRONOS | Nombre del reloj |
| `brand` | Seiko | Marca |
| `currentPrice` | 84.99 | Precio actual (punto decimal) |
| `originalPrice` | 179 | Precio antes del descuento; el % se calcula solo |
| `image` | https://m.media-amazon.com/... | URL de imagen (o `/images/...` si está en `public/images/`) |
| `features` | Elegante\|Cómodo\|Resistente | Características separadas por `\|` |
| `bestseller` | true / false | Muestra la etiqueta "MÁS VENDIDO" |
| `flashSale` | true / false | Muestra la etiqueta "OFERTA FLASH" |
| `category` | smartwatch | Categoría |
| `affiliateLink` | https://amzn.to/... | Tu enlace de afiliado de Amazon |

> ⚠️ La imagen del primer producto (`/images/image1.jpg`) se borró del repositorio en su día: sube una imagen nueva a `public/images/` o usa una URL de Amazon.

## Ejecutar en local

```bash
npm install
npm run dev        # abre http://localhost:4321
```

Para probar la versión final: `npm run build` y `npm run preview`.

## Automatización diaria (GitHub Actions)

El workflow `.github/workflows/oferta-diaria.yml` se ejecuta **todos los días a las 06:30 UTC** (08:30 hora española de verano) y **publica la oferta del día en Instagram**: elige el producto de tu hoja (prioridad: ofertas flash → mayor descuento, rotando cada día), genera una imagen 1080×1080 con la estética de la marca y la publica en `@chronux.shop` con su texto, hashtags y aviso de afiliado.

La web NO depende de este workflow: se actualiza sola leyendo la hoja en cada visita. Sin los secrets de Instagram, el workflow simplemente no hace nada.

También puedes lanzarlo a mano: GitHub → pestaña **Actions** → "Oferta diaria" → **Run workflow**.

### Secrets que hay que configurar

En GitHub: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Qué es |
|---|---|
| `IG_USER_ID` | ID numérico de la cuenta de Instagram de empresa |
| `IG_ACCESS_TOKEN` | Token de acceso de la Graph API de Meta |

### Cómo conseguir las credenciales de Instagram (gratis)

1. Convierte `@chronux.shop` en **cuenta de empresa** (Instagram → Configuración → Herramientas para empresas).
2. Crea una **página de Facebook** y vincúlala a la cuenta de Instagram.
3. En [developers.facebook.com](https://developers.facebook.com) crea una app (tipo *Business*) y añade el producto *Instagram Graph API*.
4. En el *Graph API Explorer* genera un token con los permisos `instagram_basic`, `instagram_content_publish` y `pages_show_list`, y conviértelo en **token de larga duración** (~60 días; hay que renovarlo periódicamente).
5. El `IG_USER_ID` se obtiene consultando `me/accounts` → página → `instagram_business_account`.

> ⚠️ El token de larga duración caduca cada ~60 días. Si un día deja de publicar, lo más probable es que haya que generar un token nuevo y actualizar el secret.

### Probar en local

```bash
node automation/oferta-diaria.mjs generar   # genera public/ig/oferta-<fecha>.jpg
node automation/oferta-diaria.mjs publicar  # publica en Instagram (necesita IG_USER_ID e IG_ACCESS_TOKEN)
```

### Siguiente nivel: Amazon Product Advertising API

Cuando tu cuenta de Amazon Associates acumule 3 ventas, Amazon te dará acceso gratuito a su **Product Advertising API**, con la que se puede automatizar también la búsqueda de ofertas y la actualización de precios/fotos sin tocar la hoja. Hasta entonces, la hoja de Google es el panel de control manual.

## Desplegar y actualizar productos

- **Para actualizar los productos**: edita la hoja de Google. Nada más. Los cambios aparecen en chronux.shop en unos 5-10 minutos.
- La web se despliega en **Netlify** ([app.netlify.com](https://app.netlify.com)), conectada a este repositorio: cada `git push` a `main` despliega automáticamente los cambios **de código** (los deploys solo hacen falta para el código, no para los productos).
