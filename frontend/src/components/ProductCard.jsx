import { memo } from 'react';
import { formatCurrencyWithUnit } from '../utils/formatCurrency';

const ProductCard = memo(({ product, onSelect, isSelectMode = false, isSelected = false }) => {
  const handleClick = isSelectMode ? () => onSelect(product) : undefined;

  return (
    <div
      className={`relative bg-white rounded-xl shadow-md overflow-hidden transition-all border-2 ${
        isSelectMode ? 'cursor-pointer' : ''
      } ${isSelected ? 'ring-4 ring-accent border-accent' : 'border-primary'}`}
      onClick={handleClick}
    >
      <div className="aspect-square w-full bg-primary relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="p-3 bg-white">
        <h3 className="font-semibold text-base mb-2 text-accent-dark">{product.name}</h3>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            Nhỏ: <span className="font-bold text-accent">{formatCurrencyWithUnit(product.priceSmall)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Lớn: <span className="font-bold text-accent">{formatCurrencyWithUnit(product.priceLarge)}</span>
          </p>
        </div>
        {product.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

