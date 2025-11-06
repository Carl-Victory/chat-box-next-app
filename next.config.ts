import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allows loading images from external sources using next/image
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Whitelist Google's image CDN
      },
      // If you use other services (like GitHub or other image hosts),
      // you must add them here as well.
      {
        protocol: "https",
        hostname: "placehold.co", // Assuming you use placeholder images
      },
    ],
  },
};

export default nextConfig;
