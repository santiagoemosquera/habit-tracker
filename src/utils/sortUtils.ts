import { Task } from '../types/timer';

export type SortField = 'deadline' | 'priority' | 'effort' | 'created';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
    id: string; // unique id for list rendering key
    field: SortField;
    direction: SortDirection;
}

const PRIORITY_WEIGHTS: Record<Task['priority'], number> = {
    high: 3,
    medium: 2,
    low: 1,
    none: 0
};

export const sortTasks = (tasks: Task[], criteria: SortOption[]): Task[] => {
    return [...tasks].sort((a, b) => {
        for (const { field, direction } of criteria) {
            let result = 0;

            switch (field) {
                case 'priority': {
                    const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
                    const weightB = PRIORITY_WEIGHTS[b.priority] || 0;
                    result = weightA - weightB;
                    break;
                }
                case 'deadline': {
                    // Treat no deadline as Infinity (always last in ASC)
                    // If both have no deadline, they are equal
                    if (!a.deadline && !b.deadline) result = 0;
                    else if (!a.deadline) result = 1; // a is infinite -> a > b
                    else if (!b.deadline) result = -1; // b is infinite -> a < b
                    else result = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                    break;
                }
                case 'effort': {
                    result = a.estimatedPomodoros - b.estimatedPomodoros;
                    break;
                }
                case 'created': {
                    result = a.createdAt - b.createdAt;
                    break;
                }
            }

            if (result !== 0) {
                return direction === 'asc' ? result : -result;
            }
        }
        return 0;
    });
};
