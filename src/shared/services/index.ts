/**
 * Service Index
 * 
 * Centralized exports for all services
 */

export { LocalStorageService, STORAGE_KEYS } from './storage/localStorageService';
export { SupabaseService } from './api/supabaseService';
export { UserService } from './userService';

export type { ServiceResponse } from './api/supabaseService';
