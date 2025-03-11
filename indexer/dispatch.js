/**
 * Creates an async dispatcher that processes tasks from a queue with retries and exponential backoff.
 *
 * @template T, R
 * @param {{ pop: () => T|undefined, peek: () => T|undefined }} queue - A queue with pop() & peek() methods returning tasks.
 * @param {(task: T) => Promise<R>} taskRunner - A function that executes a single task and returns a promise of the result.
 * @param {number} [concurrency=5] - Max number of tasks to run in parallel.
 * @param {number} [maxRetries=3] - Max retries for each task before error.
 * @param {number} [baseDelayMs=100] - Base delay for exponential backoff in ms.
 * @returns {{run: () => Promise<void>}} An object with a run method that executes all tasks.
 */
function AsyncDispatcher(queue, taskRunner, concurrency = 5, maxRetries = 3, baseDelayMs = 100) {
    const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

    /**
     * Attempts to run the given task with retries and exponential backoff.
     *
     * @param {T} task
     * @param {number} [attempt=1]
     * @returns {Promise<R>}
     */
    const runTaskWithRetry = async (task, attempt = 1) => {
        try {
            return await taskRunner(task);
        } catch (err) {
            if (attempt >= maxRetries) throw err;
            const delay = baseDelayMs * (2 ** (attempt - 1));
            await sleep(delay);
            return runTaskWithRetry(task, attempt + 1);
        }
    };

    const run = async () => {
        /**
         * Represents a task currently running.
         * @typedef {Object} RunningTask
         * @property {Promise<R>} promise - The promise representing the task's completion.
         * @property {() => boolean} done - Indicates whether the task has completed.
         */

        /** @type {RunningTask[]} */
        let running = [];

        /**
         * Starts a task and returns a RunningTask.
         * @param {T} task
         * @returns {RunningTask}
         */
        const startTask = (task) => {
            let _done = false;

            const promise = runTaskWithRetry(task).then(result => {
                _done = true;
                return result;
            });

            return {
                promise,
                done: () => _done
            };
        };

        for (let i = 0; i < concurrency; i++) {
            const t = queue.pop();
            if (t === undefined) break;
            running.push(startTask(t));
        }

        while (running.length > 0 || queue.peek() !== undefined) {
            if (running.length === 0 && queue.peek() === undefined) break;
            // Wait until any task completes
            await Promise.race(running.map(r => r.promise));
            // Remove completed tasks
            running = running.filter(r => !r.done());
            // If queue not empty, fill up to concurrency again
            while (running.length < concurrency && queue.peek() !== undefined) {
                const nextTask = queue.pop();
                if (nextTask === undefined) break;
                running.push(startTask(nextTask));
            }
        }
    };

    return { run };
}

export { AsyncDispatcher };
