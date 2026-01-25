/**
 * Parses a date string (YYYY-MM-DD) as a local date at midnight.
 * This avoids the default behavior of new Date('YYYY-MM-DD') which parses as UTC midnight,
 * often resulting in the previous day in Western timezones (e.g. GMT-3).
 */
export const parseLocalDate = (dateStr: string): Date => {
    // Appending T00:00:00 forces local time parsing in most environments,
    // or we can construct it explicitly to be safe.
    // However, "YYYY-MM-DD" + "T00:00:00" is usually interpreted as local.
    // Safest cross-browser way without libraries is splitting:
    /*
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
    */

    // Using the split method to be absolutely sure about local midnight
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};
