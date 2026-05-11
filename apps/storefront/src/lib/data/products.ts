export type Product = {
  id: string;
  handle: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  image: string;
  images?: string[];
  category: string;
  subcategory?: string;
  brand: string;
  inStock: boolean;
  isPromo?: boolean;
  description?: string;
  weight?: string;
  rating?: number;
  reviewCount?: number;
};

export type Category = {
  id: string;
  handle: string;
  title: string;
  image: string;
  productCount: number;
};

export const formatPrice = (price: number): string => {
  const dinars = Math.floor(price / 1000);
  const millimes = price % 1000;
  return `${dinars},${String(millimes).padStart(3, "0")} TND`;
};

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1758273705890-204fdc2518fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";
export const COSMETICS_IMAGE =
  "https://images.unsplash.com/photo-1600417098578-1e858e93dc88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600";
export const VAISSELLE_IMAGE =
  "https://images.unsplash.com/photo-1772442363825-f2cb44fb73ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600";
export const NETTOYAGE_IMAGE =
  "https://images.unsplash.com/photo-1737372805905-be0b91ec86fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600";
export const DETERGENT_IMAGE =
  "https://images.unsplash.com/photo-1653248773863-d7a474f90ec8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";
export const LAUNDRY_IMAGE =
  "https://images.unsplash.com/photo-1611878821586-eb39c951c236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";
export const SHAMPOO_IMAGE =
  "https://images.unsplash.com/photo-1686121544242-5780a88db2ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

export const categories: Category[] = [
  {
    id: "cat-1",
    handle: "produits-de-nettoyage",
    title: "Produits de nettoyage",
    image: NETTOYAGE_IMAGE,
    productCount: 56,
  },
  {
    id: "cat-2",
    handle: "cosmetiques",
    title: "Cosmétiques",
    image: COSMETICS_IMAGE,
    productCount: 34,
  },
  {
    id: "cat-3",
    handle: "vaisselle",
    title: "Vaisselle",
    image: VAISSELLE_IMAGE,
    productCount: 22,
  },
];

export const products: Product[] = [
  {
    id: "prod-1",
    handle: "detergent-liquide-detol-900ml",
    title: "Détergent liquide Detol 900ml",
    price: 15900,
    originalPrice: 18900,
    discountPercent: 16,
    image: DETERGENT_IMAGE,
    images: [DETERGENT_IMAGE, LAUNDRY_IMAGE, NETTOYAGE_IMAGE],
    category: "Produits de nettoyage",
    subcategory: "Nettoyants sol",
    brand: "Dettol",
    inStock: true,
    isPromo: true,
    description:
      "Detol 900ml offre une protection antibactérienne puissante pour votre maison. Sa formule avancée élimine 99,9% des germes et laisse une odeur fraîche durable.",
    weight: "900ml",
    rating: 4.5,
    reviewCount: 128,
  },
  {
    id: "prod-2",
    handle: "ajax-fraicheur-citron-400ml",
    title: "Ajax Fraîcheur citron 400ml",
    price: 8500,
    image: DETERGENT_IMAGE,
    images: [DETERGENT_IMAGE, NETTOYAGE_IMAGE],
    category: "Produits de nettoyage",
    subcategory: "Nettoyants sol",
    brand: "Ajax",
    inStock: true,
    isPromo: false,
    description:
      "Ajax Fraîcheur citron nettoie en profondeur tout en laissant un parfum de citron frais. Idéal pour les surfaces de cuisine et salle de bain.",
    weight: "400ml",
    rating: 4.3,
    reviewCount: 89,
  },
  {
    id: "prod-3",
    handle: "shampooing-pantene-250ml",
    title: "Shampooing Pantene 250ml",
    price: 12900,
    image: SHAMPOO_IMAGE,
    images: [SHAMPOO_IMAGE, COSMETICS_IMAGE],
    category: "Cosmétiques",
    subcategory: "Soins cheveux",
    brand: "Pantene",
    inStock: true,
    isPromo: false,
    description:
      "Le shampooing Pantene Pro-V nourrit et renforce vos cheveux dès la première utilisation. Sa formule enrichie en Pro-V Complex répare les cheveux abîmés.",
    weight: "250ml",
    rating: 4.6,
    reviewCount: 203,
  },
  {
    id: "prod-4",
    handle: "lilas-gel-douche-500ml",
    title: "Lilas Gel douche 500ml",
    price: 6900,
    image: COSMETICS_IMAGE,
    images: [COSMETICS_IMAGE, SHAMPOO_IMAGE],
    category: "Cosmétiques",
    subcategory: "Soins corps",
    brand: "Lilas",
    inStock: true,
    isPromo: false,
    description:
      "Gel douche Lilas à la fleur de lilas. Formule douce et hydratante pour une peau douce et parfumée.",
    weight: "500ml",
    rating: 4.2,
    reviewCount: 67,
  },
  {
    id: "prod-5",
    handle: "dettol-desinfectant-500ml",
    title: "Dettol Désinfectant multi-usages 500ml",
    price: 11900,
    image: NETTOYAGE_IMAGE,
    images: [NETTOYAGE_IMAGE, DETERGENT_IMAGE],
    category: "Produits de nettoyage",
    subcategory: "Désinfectants",
    brand: "Dettol",
    inStock: true,
    isPromo: false,
    description:
      "Dettol Désinfectant multi-usages 500ml nettoie et désinfecte toutes les surfaces de votre maison. Élimine 99,9% des bactéries.",
    weight: "500ml",
    rating: 4.7,
    reviewCount: 312,
  },
  {
    id: "prod-6",
    handle: "ajax-fraicheur-citron-1l",
    title: "Ajax Fraîcheur citron 1L",
    price: 8500,
    image: DETERGENT_IMAGE,
    category: "Produits de nettoyage",
    subcategory: "Nettoyants sol",
    brand: "Ajax",
    inStock: true,
    isPromo: false,
    weight: "1L",
    rating: 4.4,
    reviewCount: 156,
  },
  {
    id: "prod-7",
    handle: "lilas-javel-parfumee-1l",
    title: "Lilas Javel parfumée 1L",
    price: 4900,
    image: NETTOYAGE_IMAGE,
    category: "Produits de nettoyage",
    subcategory: "Javel",
    brand: "Lilas",
    inStock: true,
    isPromo: false,
    weight: "1L",
    rating: 4.1,
    reviewCount: 74,
  },
  {
    id: "prod-8",
    handle: "omo-machine-2-5kg",
    title: "Omo Machine 2.5kg",
    price: 19900,
    originalPrice: 24900,
    discountPercent: 20,
    image: LAUNDRY_IMAGE,
    images: [LAUNDRY_IMAGE, DETERGENT_IMAGE, NETTOYAGE_IMAGE, SHAMPOO_IMAGE],
    category: "Produits de nettoyage",
    subcategory: "Détergents",
    brand: "OMO",
    inStock: true,
    isPromo: true,
    description:
      "Omo Machine 2.5kg offre un nettoyage en profondeur dès 30°C. Sa formule avancée protège les couleurs et respecte les tissus. Lessive en poudre pour machine à laver. Élimine les taches tenaces et laisse un parfum agréable.",
    weight: "2.5kg",
    rating: 4.8,
    reviewCount: 445,
  },
  {
    id: "prod-9",
    handle: "pril-liquide-vaisselle-750ml",
    title: "Pril Liquide vaisselle 750ml",
    price: 7500,
    image: DETERGENT_IMAGE,
    category: "Produits de nettoyage",
    subcategory: "Vaisselle",
    brand: "Pril",
    inStock: true,
    isPromo: false,
    weight: "750ml",
    rating: 4.5,
    reviewCount: 198,
  },
  {
    id: "prod-10",
    handle: "spic-span-nettoyant-sol-1l",
    title: "Spic & Span Nettoyant sol 1L",
    price: 6500,
    image: NETTOYAGE_IMAGE,
    category: "Produits de nettoyage",
    subcategory: "Nettoyants sol",
    brand: "Spic & Span",
    inStock: true,
    isPromo: false,
    weight: "1L",
    rating: 4.3,
    reviewCount: 87,
  },
  {
    id: "prod-11",
    handle: "pril-liquide-vaisselle-500ml",
    title: "Pril Liquide vaisselle 500ml",
    price: 5500,
    image: DETERGENT_IMAGE,
    category: "Vaisselle",
    subcategory: "Liquide vaisselle",
    brand: "Pril",
    inStock: true,
    isPromo: false,
    weight: "500ml",
    rating: 4.2,
    reviewCount: 133,
  },
  {
    id: "prod-12",
    handle: "lilas-javel-classique-2l",
    title: "Lilas Javel classique 2L",
    price: 7900,
    image: NETTOYAGE_IMAGE,
    category: "Produits de nettoyage",
    subcategory: "Javel",
    brand: "Lilas",
    inStock: false,
    isPromo: false,
    weight: "2L",
    rating: 4.0,
    reviewCount: 55,
  },
];

export const brands = [
  "Dettol",
  "Ajax",
  "OMO",
  "Pril",
  "Spic & Span",
  "Lilas",
  "Pantene",
];

export const subcategories = [
  { label: "Nettoyants sol", count: 16 },
  { label: "Détergents", count: 14 },
  { label: "Javel", count: 10 },
  { label: "Vaisselle", count: 9 },
  { label: "Autres", count: 8 },
];