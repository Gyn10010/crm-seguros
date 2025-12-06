/**
 * Utility functions for activity timer calculations
 */

/**
 * Calculates elapsed time from a start timestamp to now
 * @param startedAt ISO timestamp string when activity started
 * @returns Object with hours, minutes, and seconds elapsed
 */
export const calculateElapsedTime = (startedAt: string | undefined): { hours: number; minutes: number; seconds: number } | null => {
    if (!startedAt) return null;

    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();

    if (diffMs < 0) return null; // Invalid: start time is in the future

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
};

/**
 * Formats elapsed time in a human-readable format
 * @param startedAt ISO timestamp string when activity started
 * @returns Formatted string like "2h 30min" or "45min" or null if not started
 */
export const formatElapsedTime = (startedAt: string | undefined): string | null => {
    const elapsed = calculateElapsedTime(startedAt);
    if (!elapsed) return null;

    const { hours, minutes } = elapsed;

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
        return `${minutes}min`;
    } else {
        return 'Menos de 1min';
    }
};
