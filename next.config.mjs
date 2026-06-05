/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    async redirects() {
        return [
            { source: '/v2/m', destination: '/m', permanent: true },
            { source: '/v2/m/:path*', destination: '/m/:path*', permanent: true },
            { source: '/v2', destination: '/d', permanent: true },
            { source: '/v1', destination: '/d', permanent: true },
            { source: '/v1/operations', destination: '/d/portfolio', permanent: true },
            { source: '/v1/account', destination: '/d/accounts', permanent: true },
            { source: '/v1/dividends', destination: '/d/dividends', permanent: true },
            { source: '/v1/intelligence', destination: '/d/insights', permanent: true },
            { source: '/v1/m', destination: '/m', permanent: true },
            { source: '/v1/m/:path*', destination: '/m', permanent: true },
            { source: '/operations', destination: '/d/portfolio', permanent: true },
            { source: '/account', destination: '/d/accounts', permanent: true },
            { source: '/dividends', destination: '/d/dividends', permanent: true },
            { source: '/intelligence', destination: '/d/insights', permanent: true },
            { source: '/settings', destination: '/d/settings', permanent: true },
        ];
    },
};

export default nextConfig;
