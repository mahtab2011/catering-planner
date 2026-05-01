import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://smartserveuk.com",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/restaurants",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/suppliers",
      lastModified: new Date(),
    },
  ];
}