// Initializing Prisma client singleton
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

// Check if the global instance exists and has the latest models (v2)
// If it's missing the 'memo' or 'user' model updates (due to schema change during dev), we force a new one.
let prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    // Force refresh if models are missing or if client is suspected stale (v2.1: added hideAssets)
    if (!(prisma as any).memo || !(prisma as any).user) {
        console.log('Prisma Client stale (missing models). Force refreshing singleton...');
        prisma = prismaClientSingleton()
        globalThis.prismaGlobal = prisma
    }
}

export default prisma

if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma
}
