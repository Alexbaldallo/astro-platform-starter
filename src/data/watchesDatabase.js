export const WATCHES_DATABASE = {
    bestsellers: [
        {
            asin: 'B08G8YQZPX',
            name: 'CHRONOS',
            brand: 'BLACK MAMUT',
            currentPrice: 25.99,
            originalPrice: 25.99,
            discount: 0,
            image: '/images/image1.jpg',
            features: ['Elegante y versátil', 'Cómodo y seguro', 'Resistente al agua', 'Regalo ideal'],
            rating: 4.4,
            reviewCount: 25847,
            bestseller: true,
            category: 'clasico',
            affiliateLink: 'https://amzn.to/3UWmvb7'
        },
        {
            asin: 'B09JQKL3NP',
            name: 'Chrono',
            brand: 'LOTUS',
            currentPrice: 84,
            originalPrice: 84,
            discount: 0,
            image: 'https://m.media-amazon.com/images/I/51O6Rs1jrbL._AC_SX522_.jpg',
            features: ['Multifunción completa', 'Robusto y elegante', 'Correa cómoda y moderna', 'Resistente al agua 5ATM'],
            rating: 4.2,
            reviewCount: 8934,
            bestseller: true,
            category: 'smartwatch',
            affiliateLink: 'https://amzn.to/4n15oAI'
        },
        {
            asin: 'B08DFBZLHY',
            name: 'Tommy Hilfiger',
            brand: 'Tommy Hilfiger',
            currentPrice: 100.99,
            originalPrice: 115.34,
            discount: 30,
            image: 'https://m.media-amazon.com/images/I/81LA9lyGDWL._AC_SX522_.jpg',
            features: ['Movimiento multifunción', 'Caja resistente y estilizada', 'Pulsera de acero', 'Resistente al agua 5ATM'],
            rating: 4.1,
            reviewCount: 5432,
            bestseller: true,
            category: 'fitness',
            affiliateLink: 'https://amzn.to/3HMFzpl'
        },
        {
            asin: 'B08DFBZLHK',
            name: 'SSB407P1',
            brand: 'Seiko',
            currentPrice: 203.56,
            originalPrice: 265.56,
            discount: 30,
            image: 'https://m.media-amazon.com/images/I/61wxp5LJ3PL._AC_SX522_.jpg',
            features: ['Elegante', 'Cómodo', 'Luminoso', 'Resistente agua'],
            rating: 4.1,
            reviewCount: 5432,
            bestseller: true,
            category: 'fitness',
            affiliateLink: 'https://amzn.to/4nabKOt'
        }
        // ... resto de productos
    ],

    categories: {
        smartwatch: ['B09JQKL3NP', 'B08156ZNBZ', 'B08GPMBY49'],
        deportivo: ['B07W8DFBZX', 'B08DFBZLHY'],
        clasico: ['B08G8YQZPX'],
        elegante: ['B08156ZNBZ'],
        fitness: ['B08DFBZLHY', 'B08GPMBY49']
    },

    // Obtener productos con enlace de afiliado manual
    getProducts(category = 'all', limit = 12) {
        let products = this.bestsellers;

        if (category !== 'all' && this.categories[category]) {
            products = products.filter((product) => this.categories[category].includes(product.asin));
        }

        return products
            .sort((a, b) => {
                if (a.bestseller && !b.bestseller) return -1;
                if (!a.bestseller && b.bestseller) return 1;
                return b.rating * b.reviewCount - a.rating * a.reviewCount;
            })
            .slice(0, limit);
    },

    // 🔒 Bloqueamos los precios reales (sin variaciones aleatorias)
    updatePrices() {
        // Mantener los precios originales sin cambios
        this.bestsellers.forEach((product) => {
            product.currentPrice = product.currentPrice;
            product.discount = Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100);
        });
    }
};
