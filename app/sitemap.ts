import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // CORE
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

    // DISH PAGE
    {
      url: "https://smartserveuk.com/chicken-tikka-london",
      lastModified: new Date(),
    },

    // CUISINE PAGES
    {
      url: "https://smartserveuk.com/bangladeshi-food-east-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/indian-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/pakistani-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/turkish-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/lebanese-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/thai-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/japanese-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/african-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/british-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/jamaican-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/american-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/mexican-food-london",
      lastModified: new Date(),
    },
    {
      url: "https://smartserveuk.com/brazilian-food-london",
      lastModified: new Date(),
    },

    // HIGH VALUE PAGE 🔥
    {
      url: "https://smartserveuk.com/biryani-polao-london",
      lastModified: new Date(),
    },
  ];
}