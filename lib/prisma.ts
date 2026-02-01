import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
    // Ensure we have a database URL
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        // Fallback for build time if env is missing, but it should be present
        // Or we can return a dummy client if we strictly want to pass build without DB
        if (process.env.NODE_ENV === 'production') {
            console.warn('DATABASE_URL is not set in production environment')
        }
    }

    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma
}
