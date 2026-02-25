// Initializing Prisma client singleton
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

// Check if the global instance exists and has the 'memo' model
// If it's missing the 'memo' model (due to schema change during dev), we force a new one.
let prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    if (!(prisma as any).memo) {
        console.log('Prisma Client stale (missing "memo"). Force refreshing singleton...');
        prisma = prismaClientSingleton()
        globalThis.prismaGlobal = prisma
    }
}

export default prisma

if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma
}
