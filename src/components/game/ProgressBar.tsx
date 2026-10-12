import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
    value: number;
    max: number;
    className?: string;
    barClassName?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, className, barClassName }) => (
    <div className={cn("h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden", className)}>
        <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", barClassName)}
            style={{ width: `${max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0}%` }}
        />
    </div>
);

export default ProgressBar;
