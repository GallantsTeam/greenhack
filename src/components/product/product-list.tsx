import type { Product } from '@/types';
import ProductCard from './product-card';

interface ProductListProps {
  products: Product[];
  onViewProduct?: (productName: string) => void;
}

export default function ProductList({ products, onViewProduct }: ProductListProps) {
  if (products.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No products found matching your criteria.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onViewProduct={onViewProduct} />
      ))}
    </div>
  );
}
