/**
 * LocalStorage Service
 * 
 * Centralized service for all localStorage operations.
 * Provides type-safe storage with error handling.
 */

export class LocalStorageService {
    /**
     * Get item from localStorage with type safety
     */
    static get<T>(key: string, defaultValue: T): T {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage (key: ${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * Set item in localStorage
     */
    static set<T>(key: string, value: T): boolean {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage (key: ${key}):`, error);
            return false;
        }
    }

    /**
     * Remove item from localStorage
     */
    static remove(key: string): boolean {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage (key: ${key}):`, error);
            return false;
        }
    }

    /**
     * Clear all localStorage
     */
    static clear(): boolean {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    /**
     * Check if key exists
     */
    static has(key: string): boolean {
        return localStorage.getItem(key) !== null;
    }
}

// Storage keys constants
export const STORAGE_KEYS = {
    TEAM_USERS: 'ldr-crm-team-users',
    CLIENTS: 'ldr-crm-clients',
    POLICIES: 'ldr-crm-policies',
    OPPORTUNITIES: 'ldr-crm-opportunities',
    FUNNEL_CONFIGS: 'ldr-crm-funnel-configs',
    FUNNEL_STAGES: 'ldr-crm-funnel-stages',
    SYSTEM_SETTINGS: 'ldr-crm-system-settings',
} as const;
