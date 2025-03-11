import { PriorityQueue } from "./queue.js"
import { AsyncDispatcher } from "./dispatch.js";

/**
 * @param {number} unixTimestamp 
 * @returns {Date} date
 */
const unixToDateObject = (unixTimestamp) => new Date(unixTimestamp * 1000)

/**
 * Calculates the overlap in milliseconds between two time ranges.
 * @param {number} startA - Start time (ms) of range A
 * @param {number} endA - End time (ms) of range A
 * @param {number} startB - Start time (ms) of range B
 * @param {number} endB - End time (ms) of range B
 * @returns {number} The overlap in milliseconds between the two ranges.
 */
const calculateOverlap = (startA, endA, startB, endB) => {
    const overlapStart = Math.max(startA, startB);
    const overlapEnd = Math.min(endA, endB);
    return Math.max(0, overlapEnd - overlapStart);
}

/**
 * Calculate how much of the interval [start, end] overlaps with:
 * 1) The "current Monday" (the Monday of the week that `end` falls into)
 * 2) The "previous Monday" (the Monday of the previous week)
 *
 * "Monday" is defined as the period from Monday 00:00:00 UTC to Monday 23:59:59.999 UTC.
 *
 * @param {Date} start
 * @param {Date} end
 * @returns {number} The maximum overlap (in milliseconds) with either the current or the previous Monday.
 */
const mondayOverlap = (start, end) => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const MS_PER_WEEK = 7 * MS_PER_DAY;

    // Find the Monday of the week for 'end'
    const monday = new Date(end.getTime());
    monday.setUTCHours(0, 0, 0, 0);

    // Sunday=0, Monday=1, ... Saturday=6
    const day = monday.getUTCDay();
    const offset = (day + 6) % 7;
    monday.setUTCDate(monday.getUTCDate() - offset);

    // Current Monday times
    const currentMondayStart = monday.getTime();
    const currentMondayEnd = currentMondayStart + MS_PER_DAY;

    // Previous Monday times
    const previousMondayStart = currentMondayStart - MS_PER_WEEK;
    const previousMondayEnd = previousMondayStart + MS_PER_DAY;

    const startTime = start.getTime();
    const endTime = end.getTime();

    // Calculate overlap with current and previous Monday
    const overlapWithCurrent = calculateOverlap(startTime, endTime, currentMondayStart, currentMondayEnd);
    const overlapWithPrevious = calculateOverlap(startTime, endTime, previousMondayStart, previousMondayEnd);

    return Math.max(overlapWithCurrent, overlapWithPrevious);
}

/**
 * Comparator for tuples of [Date, Date].
 * Intervals with a larger Monday overlap should come first.
 *
 * @param {[Date, Date]} a
 * @param {[Date, Date]} b
 * @returns {number} negative if a should come first, positive if b should come first
 */
const mondayOverlapComparator = (a, b) => {
    const aOverlap = mondayOverlap(a[0], a[1]);
    const bOverlap = mondayOverlap(b[0], b[1]);
    // Sort descending by overlap (more overlap = higher priority)
    return bOverlap - aOverlap;
};


const queryApi = async ([a, b]) => {
    Promise.resolve(true);
}


const run = async (taskRunner = queryApi) => {
    // arbitrum proposals usually go live onchain monday
    const queue = PriorityQueue(mondayOverlapComparator);

    const dispatcher = AsyncDispatcher(queue, taskRunner)

    return await dispatcher.run()
        .then(() => {
            console.log("complete")
        })
        .catch((err) => {
            console.error("oh damn failed")
            throw err
        })
}

export { run }
