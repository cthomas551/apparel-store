export type Category = "coat" | "dress" | "trouser" | "shirt" | "knit";

export type GalleryImage = { src: string; fit?: "cover" | "contain" };

export type Product = {
  id: string;
  name: string;
  category: Category;
  categoryLabel: string;
  price: string;
  tone: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain";
  monochrome?: boolean;
  gallery?: GalleryImage[];
  description?: string;
  details?: { label: string; value: string }[];
};

export const PRODUCTS: Product[] = [
  {
    id: "p0",
    name: "Think About It Set",
    category: "shirt",
    categoryLabel: "Streetwear",
    price: "$140",
    tone: "#E7E4DC",
    imageUrl: "/products/think-about-it-set.png",
    imageFit: "cover",
    monochrome: false,
    gallery: [
      { src: "/products/think-about-it-set.png", fit: "cover" },
      { src: "/products/Tee.png", fit: "contain" },
      { src: "/products/Shorts.png", fit: "contain" },
    ],
    description: "An oversized graffiti-print tee and matching shorts, cut relaxed and finished with a heavyweight cotton fleece.",
    details: [
      { label: "Fabric", value: "100% cotton fleece" },
      { label: "Fit", value: "Oversized" },
      { label: "Care", value: "Machine wash cold" },
    ],
  },
  {
    id: "p1",
    name: "Field Overcoat",
    category: "coat",
    categoryLabel: "Outerwear",
    price: "$420",
    tone: "#E7E4DC",
    imageUrl: "https://picsum.photos/seed/marrow-coat/600/1000",
  },
  {
    id: "p2",
    name: "Column Slip Dress",
    category: "dress",
    categoryLabel: "Dresses",
    price: "$210",
    tone: "#EEEBE4",
  },
  {
    id: "p3",
    name: "Straight Wool Trouser",
    category: "trouser",
    categoryLabel: "Trousers",
    price: "$185",
    tone: "#E2DED3",
  },
  {
    id: "p4",
    name: "Oversized Poplin Shirt",
    category: "shirt",
    categoryLabel: "Shirting",
    price: "$140",
    tone: "#EBE8E1",
  },
  {
    id: "p5",
    name: "Ribbed Merino Knit",
    category: "knit",
    categoryLabel: "Knitwear",
    price: "$165",
    tone: "#DFDBCF",
  },
  {
    id: "p6",
    name: "Raw Selvage Coat",
    category: "coat",
    categoryLabel: "Outerwear",
    price: "$380",
    tone: "#E9E6DE",
  },
];
