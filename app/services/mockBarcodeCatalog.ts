export type LocalBarcodeProduct = {
  barcode: string;
  nombre: string;
  descripcion: string;
  precio: string;
  categoria_id: string;
};

// Catálogo temporal de demostración. Vive en memoria y no llama al backend.
const catalog = new Map<string, LocalBarcodeProduct>([
  [
    "2001234567894",
    {
      barcode: "2001234567894",
      nombre: "Producto de prueba A",
      descripcion: "Artículo de demostración",
      precio: "12000",
      categoria_id: "",
    },
  ],
  [
    "2000000000015",
    {
      barcode: "2000000000015",
      nombre: "Producto de prueba B",
      descripcion: "Artículo de demostración",
      precio: "8500",
      categoria_id: "",
    },
  ],
]);

export const findLocalBarcodeProduct = (barcode: string) =>
  catalog.get(barcode) ?? null;
export const saveLocalBarcodeProduct = (product: LocalBarcodeProduct) =>
  catalog.set(product.barcode, product);
