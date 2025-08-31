// Base de datos manual con productos reales que actualizas periódicamente
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
            features: ['Resistente al agua', 'Cronómetro', 'Luz LED', 'Clásico vintage'],
            rating: 4.4,
            reviewCount: 25847,
            bestseller: true,
            category: 'clasico',
            affiliateLink: 'https://www.amazon.es/dp/B08G8YQZPX?tag=tu-afiliado-21'
        },
        {
            asin: 'B09JQKL3NP',
            name: 'CHRONOS',
            brand: 'CHRONOS',
            currentPrice: 36.99,
            originalPrice: 349,
            discount: 34,
            image: 'https://m.media-amazon.com/images/I/71Swt7rPNaL._AC_SX679_.jpg',
            features: ['Análisis corporal', 'GPS', '5ATM', 'Correa intercambiable'],
            rating: 4.2,
            reviewCount: 8934,
            bestseller: true,
            category: 'smartwatch',
            affiliateLink: 'https://www.amazon.es/dp/B09JQKL3NP?tag=tu-afiliado-21'
        },
        {
            asin: 'B08DFBZLHY',
            name: 'Amazfit GTS 2 Mini',
            brand: 'Amazfit',
            currentPrice: 69,
            originalPrice: 99,
            discount: 30,
            image: 'https://m.media-amazon.com/images/I/61wlWmpcCnL._AC_SX679_.jpg',
            features: ['SpO2', 'Batería 14 días', 'GPS', '68 modos deportivos'],
            rating: 4.1,
            reviewCount: 5432,
            bestseller: false,
            category: 'fitness',
            affiliateLink: 'https://www.amazon.es/dp/B08DFBZLHY?tag=tu-afiliado-21'
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

    // Simular actualizaciones de precio
    updatePrices() {
        this.bestsellers.forEach((product) => {
            const priceVariation = (Math.random() - 0.5) * 0.1; // ±5%
            product.currentPrice = Math.max(
                Math.round(product.currentPrice * (1 + priceVariation)),
                Math.round(product.originalPrice * 0.6) // Mínimo 40% descuento
            );
            product.discount = Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100);
        });
    }
};
