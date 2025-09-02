import { fetchBestsellers } from './fetchBestsellers.js';

export const WATCHES_DATABASE = {
    bestsellers: [], // ← empieza vacío, se llenará desde Google Sheets

    async load() {
        this.bestsellers = await fetchBestsellers();
        this.updatePrices(); // recalcula descuentos
    },

    // Obtener productos
    getProducts(category = 'all', limit = 12) {
        let products = this.bestsellers;

        if (category !== 'all' && this.categories?.[category]) {
            products = products.filter((product) => this.categories[category].includes(product.asin));
        }

        return products
            .sort((a, b) => {
                if (a.bestseller && !b.bestseller) return -1;
                if (!a.bestseller && b.bestseller) return 1;
                return 0; // si no tienes rating/reviewCount en la hoja, evita error
            })
            .slice(0, limit);
    },

    // 🔒 Mantener precios originales y calcular descuentos
    updatePrices() {
        this.bestsellers.forEach((product) => {
            product.discount = Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100);
        });
    }
};
