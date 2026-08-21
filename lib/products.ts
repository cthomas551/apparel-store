export type Category = "coat" | "dress" | "trouser" | "shirt" | "knit" | "streetwear" | "short set";

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
    name: "Think Graffiti Club Set",
    category: "short set",
    categoryLabel: "Short Set",
    price: "$175",
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
    name: "Think Graffiti Club Set Washed",
    category: "short set",
    categoryLabel: "Short Set",
    price: "$175",
    tone: "#E7E4DC",
    imageUrl: "/products/gray-think.jpg",
    imageFit: "cover",
    monochrome: false,
    gallery: [
      { src: "/products/gray-think.jpg", fit: "cover" },
      { src: "/products/Vintage-washed-tee.jpeg", fit: "contain" },
      { src: "/products/Vintage-washed-shorts.jpg", fit: "contain" },
    ]
  },
  {
    id: "p2",
    name: "Graffiti Think Windbreaker Set",
    category: "short set",
    categoryLabel: "Short Set",
    price: "$200",
    tone: "#EEEBE4",
    imageUrl: "/products/Graffiti-Think-Windbreaker-Set.jpeg",
imageFit: "cover",

    monochrome: false,
    gallery: [
      { src: "/products/Graffiti-Think-Windbreaker-Set.jpeg", fit: "cover" },
      { src: "/products/Front_Graffiti_Think_Windbreaker_Jacket.jpeg", fit: "contain" },
      { src: "/products/Back_Graffiti_Think_Windbreaker_Jacket.jpeg", fit: "contain" },
      { src: "/products/Front_Graffiti_Think_Windbreaker_Shorts.jpeg", fit: "contain" },
      { src: "/products/Back_Graffiti_Think_Windbreaker_Shorts.jpeg", fit: "contain" },
    ]
  },
  {
    id: "p3",
    name: "Graffiti Think WindBreaker",
    category: "short set",
    categoryLabel: "Short Set",
    price: "$200",
    tone: "#E2DED3",
    imageUrl: "/products/CGTWS_Cobalt.jpg",
    imageFit: "cover",
    monochrome: false,
    gallery: [
      { src: "/products/CGTWS_Cobalt.jpg", fit: "cover" },
      { src: "/products/Back_Graffiti_Think_WindBreaker_Jacket_Cobalt.jpg", fit: "contain" },
      { src: "/products/Front_Graffiti_Think_Windbreaker_Jacket_Cobalt.jpg", fit: "contain" },
      { src: "/products/Front_Graffiti_Think_Windbreaker_Shorts_Cobalt.jpg", fit: "contain" },
      { src: "/products/Back_Graffiti_Think_Windbreaker_Shorts_Cobalt.jpg", fit: "contain" },
      { src: "/products/CBGTWS_Cobalt.jpg", fit: "contain" },
    ],
    description: "A cobalt blue and jet black colorblock windbreaker jacket and matching shorts, finished with white piping and a THINK graffiti print.",
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
