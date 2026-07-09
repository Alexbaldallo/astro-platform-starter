# Guía del proyecto: Chronux — Relojes Premium

Web de afiliados de Amazon con relojes ("Chronux"), construida con **Astro** + **Tailwind** y desplegada en **Netlify**. Esta guía documenta cómo funciona todo para no perderlo de nuevo.

## Cómo funciona

1. La página principal (`src/pages/index.astro`) muestra los productos con el componente `src/components/FeaturedProducts.astro`.
2. Los productos **NO están en el código**: se leen desde una **hoja de Google Sheets publicada como CSV**. La URL está en `src/data/fetchBestsellers.js`.
3. La lectura ocurre **al construir la web** (en cada deploy de Netlify), no en el navegador del visitante. Por eso, para que se vean cambios de la hoja hay que redesplegar.
4. Los commits del historial llamados "Actualización automática de datos" son **commits vacíos**: su único propósito era forzar a Netlify a reconstruir la web y volver a leer la hoja.

## Respaldo local (nuevo)

Si Google Sheets no responde o la hoja deja de estar publicada, la web ahora usa automáticamente `src/data/productos.csv` (contiene los 4 relojes recuperados del historial de git). Así la web **siempre compila**, aunque hayas perdido la hoja.

## Recuperar la hoja de productos (la "nube")

La hoja original estaba publicada en esta URL (ábrela en el navegador; si descarga un CSV, ¡aún existe!):

```
https://docs.google.com/spreadsheets/d/e/2PACX-1vTs3eBuMJJEBh3N2-CFQYVZLLiQr-1a9pMXENqsrCsfUPndP1Phd-r6u6GCHbHZzGVK2LRFbStCp6tH/pub?gid=865936206&single=true&output=csv
```

También puedes buscar en [Google Drive](https://drive.google.com) (con la cuenta que usaras entonces) una hoja de cálculo con estas columnas.

### Si la hoja se perdió: crear una nueva

1. Crea una hoja nueva en [sheets.google.com](https://sheets.google.com).
2. Importa `src/data/productos.csv` (Archivo → Importar → Subir) como punto de partida.
3. Publícala: **Archivo → Compartir → Publicar en la web** → elige la pestaña y formato **"Valores separados por comas (.csv)"** → Publicar.
4. Copia la URL que te da Google y pégala en `GOOGLE_SHEETS_CSV_URL` dentro de `src/data/fetchBestsellers.js`.

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

El workflow `.github/workflows/oferta-diaria.yml` se ejecuta **todos los días a las 06:30 UTC** (08:30 hora española de verano) y hace dos cosas:

1. **Actualiza la web**: reconstruye el sitio en Netlify para que lea la hoja de Google con los cambios del día.
2. **Publica en Instagram** (solo si están configuradas las credenciales): elige la oferta del día de tu hoja (prioridad: ofertas flash → mayor descuento, rotando cada día), genera una imagen 1080×1080 con la estética de la marca y la publica en `@chronux.shop` con su texto, hashtags y aviso de afiliado.

También puedes lanzarlo a mano: GitHub → pestaña **Actions** → "Oferta diaria" → **Run workflow**.

### Secrets que hay que configurar

En GitHub: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Qué es | Obligatorio |
|---|---|---|
| `NETLIFY_BUILD_HOOK` | URL del build hook de Netlify (*Site configuration → Build & deploy → Build hooks*) | Sí |
| `IG_USER_ID` | ID numérico de la cuenta de Instagram de empresa | Solo para Instagram |
| `IG_ACCESS_TOKEN` | Token de acceso de la Graph API de Meta | Solo para Instagram |

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

- La web se despliega en **Netlify** (entra en [app.netlify.com](https://app.netlify.com) con tu cuenta; el sitio debería seguir ahí, conectado a este repositorio de GitHub).
- Cada `git push` a `main` lanza un deploy automático.
- **Para actualizar los productos**: edita la hoja de Google y luego fuerza un redeploy. Opciones:
  - Desde Netlify: *Deploys → Trigger deploy → Deploy site*.
  - Con un commit vacío (lo que hacía la automatización antigua):
    ```bash
    git commit --allow-empty -m "Actualización automática de datos" && git push
    ```
  - O crea un **Build Hook** en Netlify (*Site configuration → Build & deploy → Build hooks*) y llama a esa URL cuando cambies la hoja.
