const dev = process.env.NODE_ENV !== 'production';
export const assetServerUrl = dev ? '' : (process.env.NEXT_PUBLIC_STATIC_BUCKET_URL ?? '');
