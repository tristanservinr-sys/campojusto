import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const workspaces = sqliteTable('workspaces', { id: text('id').primaryKey(), data: text('data').notNull(), updatedAt: text('updated_at').notNull() });
