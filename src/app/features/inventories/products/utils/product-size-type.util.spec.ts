import { Product, SizeType } from '../models/product.model';
import {
  findDefaultAdultSizeType,
  resolveActiveSizeTypeId,
} from './product-size-type.util';

const types: SizeType[] = [
  { id: 'kids-id', description: 'Niños' },
  { id: 'adult-letters-id', description: 'Adulto Letras' },
  { id: 'adult-senior-id', description: 'Adulto mayor' },
];

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    name: 'Polo',
    barcode: '',
    description: '',
    purchasePrice: 0,
    salePrice: 0,
    minSalePrice: 0,
    status: 'ACTIVE',
    genderId: 'gender-1',
    gender: 'Hombre',
    stock: 0,
    sizes: [],
    filter: false,
    sizeTypeId: [],
    percentageDiscount: 0,
    cashDiscount: 0,
    warehouseId: 'warehouse-1',
    ...overrides,
  };
}

describe('product-size-type.util', () => {
  it('prefiere Adulto Letras como tipo por defecto', () => {
    expect(findDefaultAdultSizeType(types)?.id).toBe('adult-letters-id');
  });

  it('usa el tipo de las tallas asignadas al editar', () => {
    const product = makeProduct({
      sizes: [
        { id: 'm-id', description: 'M', sizeTypeId: 'adult-letters-id' },
        { id: 'l-id', description: 'L', sizeTypeId: 'adult-letters-id' },
      ],
    });

    expect(resolveActiveSizeTypeId(product, types)).toBe('adult-letters-id');
  });

  it('usa Niños cuando el producto tiene tallas numéricas de ese tipo', () => {
    const product = makeProduct({
      sizes: [
        { id: '6-id', description: '6', sizeTypeId: 'kids-id' },
        { id: '8-id', description: '8', sizeTypeId: 'kids-id' },
      ],
    });

    expect(resolveActiveSizeTypeId(product, types)).toBe('kids-id');
  });
});
