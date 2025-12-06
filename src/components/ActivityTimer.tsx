import React, { useState, useEffect } from 'react';
import { formatElapsedTime } from '../utils/timeUtils';

interface ActivityTimerProps {
    startedAt?: string;
    className?: string;
}

/**
 * ActivityTimer component displays elapsed time since activity started
 * Updates every minute to show current elapsed time
 */
export const ActivityTimer: React.FC<ActivityTimerProps> = ({ startedAt, className = '' }) => {
    const [elapsedTime, setElapsedTime] = useState<string | null>(null);

    useEffect(() => {
        if (!startedAt) {
            setElapsedTime(null);
            return;
        }

        // Update immediately
        setElapsedTime(formatElapsedTime(startedAt));

        // Update every minute
        const interval = setInterval(() => {
            setElapsedTime(formatElapsedTime(startedAt));
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [startedAt]);

    if (!elapsedTime) {
        return null;
    }

    return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
            <span className="text-[10px]">⏱️</span>
            <span>{elapsedTime}</span>
        </span>
    );
};
