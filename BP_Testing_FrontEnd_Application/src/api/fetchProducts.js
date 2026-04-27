export async function fetchProducts() {
    const response = await fetch('/products');
    if (!response.ok) {
        throw new Error('Error fetching products');
    }
    return response.json();
}
