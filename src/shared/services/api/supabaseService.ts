/**
 * Supabase Service Base
 * 
 * Base service class for all Supabase operations.
 * Provides common CRUD operations and error handling.
/**
 * Supabase Service Base
 * 
 * Base service class for all Supabase operations.
 * Provides common CRUD operations and error handling.
 */

import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface ServiceResponse<T> {
    data: T | null;
    error: PostgrestError | Error | null;
    success: boolean;
}

export class SupabaseService {
    /**
     * Generic fetch all records from a table
     */
    static async fetchAll<T>(
        tableName: string,
        orderBy?: { column: string; ascending?: boolean }
    ): Promise<ServiceResponse<T[]>> {
        try {
            let query = (supabase as any).from(tableName).select('*');

            if (orderBy) {
                query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
            }

            const { data, error } = await query;

            if (error) {
                return { data: null, error, success: false };
            }

            return { data: data as T[], error: null, success: true };
        } catch (error) {
            return {
                data: null,
                error: error as Error,
                success: false
            };
        }
    }

    /**
     * Generic fetch single record by ID
     */
    static async fetchById<T>(
        tableName: string,
        id: string
    ): Promise<ServiceResponse<T>> {
        try {
            const { data, error } = await (supabase as any)
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                return { data: null, error, success: false };
            }

            return { data: data as T, error: null, success: true };
        } catch (error) {
            return {
                data: null,
                error: error as Error,
                success: false
            };
        }
    }

    /**
     * Generic insert record
     */
    static async insert<T>(
        tableName: string,
        record: any
    ): Promise<ServiceResponse<T>> {
        try {
            const { data, error } = await (supabase as any)
                .from(tableName)
                .insert(record)
                .select()
                .single();

            if (error) {
                return { data: null, error, success: false };
            }

            return { data: data as T, error: null, success: true };
        } catch (error) {
            return {
                data: null,
                error: error as Error,
                success: false
            };
        }
    }

    /**
     * Generic update record
     */
    static async update<T>(
        tableName: string,
        id: string,
        updates: any
    ): Promise<ServiceResponse<T>> {
        try {
            const { data, error } = await (supabase as any)
                .from(tableName)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { data: null, error, success: false };
            }

            return { data: data as T, error: null, success: true };
        } catch (error) {
            return {
                data: null,
                error: error as Error,
                success: false
            };
        }
    }

    /**
     * Generic delete record
     */
    static async delete(
        tableName: string,
        id: string
    ): Promise<ServiceResponse<null>> {
        try {
            const { error } = await (supabase as any)
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) {
                return { data: null, error, success: false };
            }

            return { data: null, error: null, success: true };
        } catch (error) {
            return {
                data: null,
                error: error as Error,
                success: false
            };
        }
    }

    /**
     * Get current authenticated user
     */
    static async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                return { data: null, error, success: false };
            }

            return { data: user, error: null, success: true };
        } catch (error) {
            return {
                data: null,
                error: error as Error,
                success: false
            };
        }
    }

    /**
     * Get current session
     */
    static async getSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                return { data: null, error, success: false };
            }

            return { data: session, error: null, success: true };
        } catch (error) {
            return {
                data: null,
                error: error as Error,
                success: false
            };
        }
    }
}
