/**
 * User Service
 * 
 * Handles all user-related data operations (Team Management users).
 * Uses localStorage for persistence.
 */

import { User } from '@/types/index';
import { LocalStorageService, STORAGE_KEYS } from './storage/localStorageService';

export class UserService {
    /**
     * Get all team users from localStorage
     */
    static getAll(): User[] {
        return LocalStorageService.get<User[]>(STORAGE_KEYS.TEAM_USERS, []);
    }

    /**
     * Get user by ID
     */
    static getById(id: string): User | null {
        const users = this.getAll();
        return users.find(u => u.id === id) || null;
    }

    /**
     * Add new user
     */
    static add(userData: Omit<User, 'id'>): User {
        const users = this.getAll();
        const newUser: User = {
            ...userData,
            id: `u-${Date.now()}`,
        };

        const updatedUsers = [...users, newUser];
        LocalStorageService.set(STORAGE_KEYS.TEAM_USERS, updatedUsers);

        return newUser;
    }

    /**
     * Update existing user
     */
    static update(updatedUser: User): boolean {
        console.log('🔧 UserService.update CHAMADO');
        console.log('📥 Usuário recebido para atualizar:', updatedUser);

        const users = this.getAll();
        console.log('📋 Usuários ANTES do update:', users);
        console.log('📋 Quantidade de usuários ANTES:', users.length);

        const updatedUsers = users.map(u => {
            if (u.id === updatedUser.id) {
                console.log('✅ ENCONTRADO usuário com ID:', u.id);
                console.log('🔄 Substituindo:', u, '→', updatedUser);
                return updatedUser;
            }
            return u;
        });

        console.log('📋 Usuários DEPOIS do map:', updatedUsers);
        console.log('📋 Quantidade de usuários DEPOIS:', updatedUsers.length);

        const result = LocalStorageService.set(STORAGE_KEYS.TEAM_USERS, updatedUsers);
        console.log('💾 LocalStorage.set retornou:', result);

        // Verificar o que foi salvo
        const verificacao = this.getAll();
        console.log('✔️ VERIFICAÇÃO - Usuários no localStorage agora:', verificacao);
        console.log('✔️ VERIFICAÇÃO - Quantidade:', verificacao.length);

        return result;
    }

    /**
     * Delete user
     */
    static delete(userId: string): boolean {
        const users = this.getAll();
        const updatedUsers = users.filter(u => u.id !== userId);

        return LocalStorageService.set(STORAGE_KEYS.TEAM_USERS, updatedUsers);
    }

    /**
     * Check if user exists
     */
    static exists(userId: string): boolean {
        return this.getById(userId) !== null;
    }

    /**
     * Clear all users
     */
    static clear(): boolean {
        return LocalStorageService.set(STORAGE_KEYS.TEAM_USERS, []);
    }
}
