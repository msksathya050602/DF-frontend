/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config: any) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'd4l3oed2p9dt7.cloudfront.net',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'd1ofpw3pwaurmk.cloudfront.net',
        pathname: '**',
      },
    ],
  },
};
export default nextConfig;
