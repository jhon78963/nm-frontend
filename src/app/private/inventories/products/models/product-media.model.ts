export interface ProductMediaItem {
  id: number;
  filePath: string;
  publicUrl: string | null;
  fileName: string | null;
}

export interface WooCommerceSyncResult {
  attempted: boolean;
  products: number;
  variations: number;
  errors: number;
  error: string | null;
}

export interface ProductMediaUploadResponse {
  message: string;
  productId: number;
  media: ProductMediaItem;
  wooCommerceSync: WooCommerceSyncResult;
}

export interface ProductMediaDeleteResponse {
  message: string;
  productId: number;
  deletedMediaId: number;
  wooCommerceSync: WooCommerceSyncResult;
}
