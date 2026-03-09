'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const DB_PATH = path.join(process.cwd(), 'dev.db');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

import prisma, { resetPrisma } from './prisma';

export async function backupDatabase() {
    // SQLite 파일이 없는 환경 (Vercel/PostgreSQL)에서는 작동하지 않음
    if (process.env.DATABASE_URL?.startsWith('postgres')) {
        return { success: false, message: '클라우드 DB 환경에서는 로컬 백업 기능을 지원하지 않습니다. Supabase 대시보드에서 백업을 확인하세요.' };
    }

    try {
        // Ensure WAL changes are flushed to main DB file before copying
        try {
            await (prisma as any).$executeRawUnsafe('PRAGMA wal_checkpoint(FULL);');
        } catch (e) {
            console.warn('WAL checkpoint failed, continuing with copy:', e);
        }

        // Ensure backup directory exists
        try {
            await fs.access(BACKUP_DIR);
        } catch {
            await fs.mkdir(BACKUP_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup_${timestamp}.db`;
        const backupPath = path.join(BACKUP_DIR, backupName);

        await fs.copyFile(DB_PATH, backupPath);

        return { success: true, message: `백업 완료: ${backupName}` };
    } catch (error) {
        console.error('Backup failed:', error);
        return { success: false, message: '백업 중 오류가 발생했습니다.' };
    }
}

export async function getBackupList() {
    if (process.env.DATABASE_URL?.startsWith('postgres')) {
        return [];
    }

    try {
        try {
            await fs.access(BACKUP_DIR);
        } catch {
            return [];
        }

        const files = await fs.readdir(BACKUP_DIR);
        const backupFiles = await Promise.all(
            files
                .filter(file => file.endsWith('.db'))
                .map(async file => {
                    const filePath = path.join(BACKUP_DIR, file);
                    const stats = await fs.stat(filePath);
                    return {
                        name: file,
                        path: filePath,
                        createdAt: stats.birthtime,
                        size: stats.size,
                    };
                })
        );

        // Sort by creation time descending
        return backupFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error('Failed to get backup list:', error);
        return [];
    }
}

export async function restoreDatabase(filename: string) {
    if (process.env.DATABASE_URL?.startsWith('postgres')) {
        return { success: false, message: '클라우드 DB 환경에서는 로컬 복구 기능을 지원하지 않습니다.' };
    }

    try {
        const backupPath = path.join(BACKUP_DIR, filename);

        // Final check if file exists
        await fs.access(backupPath);

        // Disconnect Prisma before file operations
        resetPrisma();

        // Remove SQLite side-files (WAL, SHM) if they exist to avoid corruption/locking
        try {
            await fs.unlink(`${DB_PATH}-wal`);
        } catch { }
        try {
            await fs.unlink(`${DB_PATH}-shm`);
        } catch { }

        // Copy backup to main DB
        await fs.copyFile(backupPath, DB_PATH);

        revalidatePath('/');
        return { success: true, message: '데이터가 성공적으로 복구되었습니다.' };
    } catch (error) {
        console.error('Restore failed:', error);
        return { success: false, message: '복구 중 오류가 발생했습니다.' };
    }
}
