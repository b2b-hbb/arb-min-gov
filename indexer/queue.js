/**
 * Creates a priority queue based on a binary heap.
 * 
 * @template T
 * @param {(a: T, b: T) => number} comparator - A function that compares two elements `a` and `b`.
 * Should return a negative number if `a` has higher priority (i.e., should come before `b`),
 * zero if they are considered equal, or a positive number if `b` has higher priority.
 * 
 * @returns {{push: (value: T) => void, pop: () => (T|undefined), peek: () => (T|undefined)}}
 */
const PriorityQueue = (comparator) => {
    /** @type {T[]} */
    const heap = []
    const compare = comparator;

    /**
     * @param {number} i
     * @returns {number}
     */
    const _parent = (i) => Math.floor((i - 1) / 2);

    /**
     * @param {number} i
     * @returns {number}
     */
    const _left = (i) => 2 * i + 1;

    /**
     * @param {number} i
     * @returns {number}
     */
    const _right = (i) => 2 * i + 2;

    /**
     * Swaps two elements in the heap.
     * @param {number} i
     * @param {number} j
     */
    const _swap = (i, j) => {
        [heap[i], heap[j]] = [heap[j], heap[i]];
    };

    /**
     * Moves the element at index i up to maintain the heap invariant.
     * @param {number} i
     * @returns {void}
     */
    const _heapifyUp = (i) => {
        let current = i;
        while (current > 0 && compare(heap[current], heap[_parent(current)]) < 0) {
            _swap(current, _parent(current));
            current = _parent(current);
        }
    }

    /**
     * Moves the element at index i down to maintain the heap invariant.
     * @param {number} i
     * @returns {void}
     */
    const _heapifyDown = (i) => {
        const left = _left(i);
        const right = _right(i);
        let smallest = i;

        if (left < heap.length && compare(heap[left], heap[smallest]) < 0) {
            smallest = left;
        }
        if (right < heap.length && compare(heap[right], heap[smallest]) < 0) {
            smallest = right;
        }

        if (smallest !== i) {
            _swap(i, smallest);
            _heapifyDown(smallest);
        }
    }

    /**
     * Adds a new element to the priority queue.
     * @param {T} value - The value to add.
     * @returns {void}
     */
    const push = (value) => {
        heap.push(value);
        _heapifyUp(heap.length - 1);
    }

    /**
     * Removes and returns the element with the highest priority.
     * @returns {T|undefined} The element with the highest priority, or undefined if empty.
     */
    const pop = () => {
        if (heap.length === 0) return undefined;
        _swap(0, heap.length - 1);
        const poppedValue = heap.pop();
        _heapifyDown(0);
        return poppedValue;
    }

    /**
     * Returns the element with the highest priority without removing it.
     * @returns {T|undefined} The element with the highest priority, or undefined if empty.
     */
    const peek = () => heap[0];

    return {
        push, pop, peek
    }
}

export {
    PriorityQueue
};
