/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@chakra-ui/react', '@chakra-ui/next-js'],
  typescript: {
    ignoreBuildErrors: true,
  },
};
 
module.exports = nextConfig; 