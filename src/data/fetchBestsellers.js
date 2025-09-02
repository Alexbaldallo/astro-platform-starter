import Papa from 'papaparse'; // 📌 IMPORTANTE

export async function fetchBestsellers() {
    const url =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vTs3eBuMJJEBh3N2-CFQYVZLLiQr-1a9pMXENqsrCsfUPndP1Phd-r6u6GCHbHZzGVK2LRFbStCp6tH/pub?gid=865936206&single=true&output=csv';
    const response = await fetch(url);
    const csvText = await response.text();

    console.log('CSV crudo:', csvText);

    const { data } = Papa.parse(csvText, { header: true });
    console.log('Datos parseados:', data);

    return data.map((row) => ({
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
