/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        allowedDevOrigins: ['192.168.2.32', 'localhost:3000'],
    },
};

export default nextConfig;
