import { Product, SizeType } from '../models/product.model';

export function findDefaultAdultSizeType(types: SizeType[]): SizeType | null {
  if (!types.length) {
    return null;
  }

  const adultLetters = types.find((type) => /adulto.*letras/i.test(type.description));
  if (adultLetters) {
    return adultLetters;
  }

  const adult = types.find(
    (type) => /^adulto/i.test(type.description) && !/mayor/i.test(type.description),
  );
  if (adult) {
    return adult;
  }

  const anyAdult = types.find((type) => /adulto/i.test(type.description));
  return anyAdult ?? types[0] ?? null;
}

export function resolveActiveSizeTypeId(
  product: Product,
  types: SizeType[],
): string | null {
  const fromProduct = product.sizeTypeId.find((id) => id.trim() !== '');
  if (fromProduct) {
    return fromProduct;
  }

  const fromAssignedSizes = [
    ...new Set(
      product.sizes
        .map((size) => size.sizeTypeId)
        .filter((id): id is string => typeof id === 'string' && id.trim() !== ''),
    ),
  ];

  if (fromAssignedSizes.length > 0) {
    return fromAssignedSizes[0];
  }

  return findDefaultAdultSizeType(types)?.id ?? types[0]?.id ?? null;
}
