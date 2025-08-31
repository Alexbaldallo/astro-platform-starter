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
            features: [
                'Elegante y versátil', // Resalta estilo y uso en cualquier ocasión
                'Cómodo y seguro', // Habla de calidad y confort
                'Resistente al agua', // Característica práctica importante
                'Regalo ideal' // Apela a la intención de compra
            ],
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
            features: [
                'Multifunción completa', // 3 subesferas: día, fecha, 24h
                'Robusto y elegante', // diseño resistente y estilizado
                'Correa cómoda y moderna', // silicona confortable con estilo
                'Resistente al agua 5ATM' // ducha y natación
            ],
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
            features: [
                'Movimiento multifunción', // Destaca la funcionalidad del reloj
                'Caja resistente y estilizada', // Grosor y diámetro del reloj
                'Pulsera de acero', // Material cómodo y duradero
                'Resistente al agua 5ATM' // Para ducha y natación
            ],
            rating: 4.1,
            reviewCount: 5432,
            bestseller: false,
            category: 'fitness',
            affiliateLink: 'https://amzn.to/3HMFzpl'
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
