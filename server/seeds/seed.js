// seeds/seed.js
// Idempotent seed: upserts topics and their concepts by slug
import 'dotenv/config';
import pool from '../src/db/pool.js';

const TOPICS = [
  {
    slug: 'binary-search',
    title: 'Binary Search',
    description: 'Efficiently find elements in sorted arrays using divide and conquer',
    difficulty: 'intermediate',
    aliases: ['binary search', 'bsearch', 'binary searching', 'bisect'],
    concepts: [
      {
        position: 0,
        title: 'What is Binary Search and Why It Works',
        explanation: `Binary search is a fundamental algorithm for finding a target value within a sorted collection. Unlike linear search which checks every element, binary search exploits the sorted order to eliminate half the remaining candidates with each comparison.

The core idea: if you want to find a name in a phone book, you wouldn't start from page 1. You'd open to the middle, decide which half contains your name, and repeat. Binary search formalizes this intuition.

Precondition: The input MUST be sorted. Without sorted order, you cannot know which half to discard, making the algorithm incorrect. This is the single most important constraint to remember.`,
        keyPoints: [
          'Works only on sorted arrays or lists',
          'Eliminates half the search space with each comparison',
          'Returns -1 or null if the target is not found',
          'Much faster than linear search for large datasets',
        ],
        example: 'Phone book analogy: open to middle, discard half, repeat. If looking for "Smith" in a book starting at "Adams", you open to "Mueller", and since Smith > Mueller alphabetically, you search only the right half.',
        checkpointQuestion: 'Why must the array be sorted before using binary search? What happens if it is unsorted?',
        checkpointRubric: {
          expectedKeyPoints: ['sorted', 'discard half', 'incorrect result'],
          modelAnswer: 'The array must be sorted so we can determine which half the target lies in. Without sorted order, discarding half the array is invalid and the algorithm may return wrong results.',
          synonyms: {
            'sorted': ['ordered', 'ascending', 'sorted order'],
            'discard half': ['eliminate half', 'ignore half', 'remove half'],
            'incorrect result': ['wrong answer', 'fails', 'incorrect', 'error'],
          },
        },
        faq: [
          { question: 'Can binary search work on linked lists?', answer: 'Not efficiently. Binary search requires O(1) random access to the middle element. Linked lists require O(n) traversal to reach the middle, negating the O(log n) benefit.' },
          { question: 'What if there are duplicates?', answer: 'Standard binary search finds one occurrence. Variants like lower_bound and upper_bound find the first or last occurrence of a duplicate value.' },
        ],
      },
      {
        position: 1,
        title: 'The Iterative Implementation',
        explanation: `The iterative implementation uses two pointers, low and high, to track the current search interval. Initially, low = 0 and high = n-1 (the last index).

At each step: compute mid = low + (high - low) / 2. Using this formula (instead of (low + high) / 2) prevents integer overflow for very large arrays. Compare arr[mid] with the target: if equal, return mid. If target < arr[mid], search the left half by setting high = mid - 1. If target > arr[mid], search the right half by setting low = mid + 1.

The loop terminates when low > high, meaning the target is absent. This off-by-one handling is critical: setting high = mid - 1 and low = mid + 1 (not mid) ensures we don't get stuck in an infinite loop when target equals arr[mid-1].`,
        keyPoints: [
          'Use low=0 and high=n-1 to define the search interval',
          'Compute mid = low + (high - low) / 2 to avoid integer overflow',
          'Move high = mid - 1 when target < arr[mid]',
          'Move low = mid + 1 when target > arr[mid]',
          'Loop ends when low > high (target not found)',
        ],
        example: 'Searching for 7 in [1, 3, 5, 7, 9, 11, 15]:\nStep 1: low=0, high=6, mid=3, arr[3]=7. Target found! Return 3.',
        codeSnippet: `function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1; // not found
}`,
        checkpointQuestion: 'In the iterative binary search, which pointer moves when the middle value is smaller than the target, and why?',
        checkpointRubric: {
          expectedKeyPoints: ['low moves', 'mid + 1', 'upper half'],
          modelAnswer: 'The low pointer moves to mid + 1 because if arr[mid] < target, the target must be in the upper (right) half of the remaining array.',
          synonyms: {
            'low moves': ['low pointer', 'left pointer moves right', 'low = mid+1'],
            'mid + 1': ['one past mid', 'mid plus one'],
            'upper half': ['right half', 'right side', 'higher values'],
          },
        },
        faq: [
          { question: 'Why use mid = low + (high - low) / 2 instead of (low + high) / 2?', answer: 'To prevent integer overflow. If low and high are both very large numbers, their sum can overflow a 32-bit integer. The subtraction form is always safe.' },
          { question: 'What does "loop invariant" mean in binary search?', answer: 'The loop invariant is: if target exists, it is always within [low, high]. Maintaining this at every step guarantees correctness.' },
        ],
      },
      {
        position: 2,
        title: 'Time and Space Complexity',
        explanation: `Binary search has O(log n) time complexity. Here is why: each comparison reduces the search space by half. Starting with n elements: after 1 comparison: n/2. After 2 comparisons: n/4. After k comparisons: n/(2^k). The search ends when n/(2^k) = 1, so k = log2(n). Therefore, binary search takes at most log2(n) + 1 comparisons.

In contrast, linear search takes O(n) comparisons in the worst case. For n = 1,000,000: linear search needs up to 1,000,000 steps; binary search needs at most 20 steps (log2(1000000) ≈ 20).

Space complexity is O(1) for the iterative version (only a few pointers). The recursive version uses O(log n) stack space due to recursive calls.`,
        keyPoints: [
          'Time complexity: O(log n) — halves the search space each step',
          'Space complexity: O(1) iterative, O(log n) recursive',
          'For n=1M, binary search needs ≤20 comparisons vs 1M for linear',
          'The base is log2, so each doubling of n adds only 1 more step',
        ],
        example: 'n=8: ceil(log2(8))=3 steps. n=16: 4 steps. n=32: 5 steps. Each doubling adds just 1 comparison.',
        checkpointQuestion: 'What is the time complexity of binary search and why is it O(log n) instead of O(n)?',
        checkpointRubric: {
          expectedKeyPoints: ['O(log n)', 'halves', 'logarithmic'],
          modelAnswer: 'O(log n) because each comparison eliminates half the remaining candidates. After k steps, only n/2^k elements remain, and the search ends at most log2(n) steps.',
          synonyms: {
            'O(log n)': ['log n', 'logarithmic time', 'logn'],
            'halves': ['halved', 'divides by 2', 'cuts in half', 'reduces by half'],
            'logarithmic': ['log', 'binary', 'exponential reduction'],
          },
        },
        faq: [
          { question: 'Is binary search always faster than linear search?', answer: 'Only for large n and when the array is already sorted. For small arrays (n < 20) or unsorted data, linear search may be faster due to lower overhead and no sorting cost.' },
        ],
      },
      {
        position: 3,
        title: 'Variants: Lower Bound, Upper Bound, and Search on Answer',
        explanation: `Binary search extends beyond simple element lookup. Three important variants:

1. Lower Bound: Find the first position where arr[i] >= target. Useful when there are duplicates and you need the leftmost occurrence. Modify the standard algorithm: when arr[mid] >= target, set high = mid (not mid - 1) and keep searching left.

2. Upper Bound: Find the first position where arr[i] > target. This gives the position after the last occurrence of target. Used to count occurrences: count = upper_bound(target) - lower_bound(target).

3. Binary Search on Answer: Apply binary search to the answer space, not an array. If you need to find the minimum time to complete a task, and "is time T enough?" can be checked in O(n), you can binary search over T values. This powerful technique solves many optimization problems in O(n log n) instead of O(n^2).`,
        keyPoints: [
          'Lower bound: first index where arr[i] >= target',
          'Upper bound: first index where arr[i] > target',
          'Count occurrences = upper_bound(x) - lower_bound(x)',
          'Binary search on answer: search over the answer space when feasibility check is monotone',
        ],
        example: 'Array [1,2,2,2,3,4]. lower_bound(2)=1, upper_bound(2)=4. Count of 2s = 4-1 = 3.',
        checkpointQuestion: 'You have array [1,2,2,2,3,4]. How would you count how many times 2 appears using binary search variants?',
        checkpointRubric: {
          expectedKeyPoints: ['lower bound', 'upper bound', 'subtract'],
          modelAnswer: 'Find lower_bound(2)=1 and upper_bound(2)=4. Count = upper_bound - lower_bound = 4 - 1 = 3.',
          synonyms: {
            'lower bound': ['lower_bound', 'first occurrence', 'leftmost'],
            'upper bound': ['upper_bound', 'last occurrence', 'rightmost'],
            'subtract': ['difference', 'minus'],
          },
        },
        faq: [
          { question: 'When can I use binary search on answer?', answer: 'When: (1) the answer is monotone (if X works, X+1 also works), and (2) you can check feasibility of a given answer in polynomial time.' },
        ],
      },
      {
        position: 4,
        title: 'Common Pitfalls and Edge Cases',
        explanation: `Binary search is easy to get wrong. These are the most common mistakes:

1. Off-by-one errors: Using high = mid instead of high = mid - 1 (or vice versa) can cause infinite loops or miss elements. Always verify the loop terminates by ensuring the interval shrinks.

2. Empty array: If n=0, low > high immediately and the loop never runs. Handle the empty case.

3. Single element: low = high = 0. After one comparison, either it matches or low > high. Works correctly.

4. Integer overflow: Avoid (low + high) / 2 for large indices. Always use low + (high - low) / 2.

5. Unsorted input: Binary search gives wrong answers on unsorted arrays. Always verify or sort first.

6. Wrong return value: Returning mid when the element isn't found. Always return -1 or null when low > high.`,
        keyPoints: [
          'Off-by-one: use mid-1 and mid+1, not mid, to shrink the interval',
          'Overflow: compute mid = low + (high - low) / 2',
          'Always handle empty arrays (n=0) gracefully',
          'Never use binary search on unsorted data',
          'Return -1 or a sentinel when target is not found',
        ],
        example: 'Infinite loop trap: if you set high = mid (not mid-1) when arr[mid] > target with low==mid, the interval never shrinks.',
        checkpointQuestion: 'Name two common pitfalls in binary search implementations and how to avoid each one.',
        checkpointRubric: {
          expectedKeyPoints: ['overflow', 'off-by-one'],
          modelAnswer: 'Integer overflow: use low + (high-low)/2. Off-by-one: use mid+1 and mid-1 to ensure the interval shrinks.',
          synonyms: {
            'overflow': ['integer overflow', 'overflow error', 'large numbers'],
            'off-by-one': ['off by one', 'boundary', 'edge case', 'infinite loop'],
          },
        },
        faq: [
          { question: 'How do I verify my binary search is correct?', answer: 'Test with: empty array, single element, two elements, target at start/end/middle, target not present, duplicates, and all-same elements.' },
        ],
      },
    ],
  },
  {
    slug: 'linear-search',
    title: 'Linear Search',
    description: 'The simplest search algorithm that checks every element sequentially',
    difficulty: 'beginner',
    aliases: ['linear search', 'sequential search', 'simple search'],
    concepts: [
      {
        position: 0,
        title: 'What is Linear Search',
        explanation: `Linear search is the simplest searching algorithm. It checks each element of a list one by one from the beginning until it finds the target or exhausts all elements.

Unlike binary search, linear search does NOT require the data to be sorted. This makes it applicable to any collection. It works on arrays, linked lists, and any iterable structure.

The tradeoff: simplicity comes at the cost of efficiency. For large datasets, checking every element becomes slow.`,
        keyPoints: ['Works on unsorted data', 'Checks elements one by one from the start', 'Returns index of target or -1 if not found', 'Time: O(n), Space: O(1)'],
        example: 'Looking for 7 in [3, 1, 7, 4, 9]: Check 3 (no), check 1 (no), check 7 (yes!) — found at index 2.',
        checkpointQuestion: 'What is the key advantage of linear search over binary search?',
        checkpointRubric: {
          expectedKeyPoints: ['unsorted', 'no sorting required'],
          modelAnswer: 'Linear search works on unsorted data. Binary search requires sorted input.',
          synonyms: { 'unsorted': ['not sorted', 'any order', 'unordered'], 'no sorting required': ['no sort needed', 'works on any list'] },
        },
        faq: [{ question: 'When should I use linear search?', answer: 'For small arrays, unsorted data, or when you only search once (sorting first would cost more than linear scan).' }],
      },
      {
        position: 1,
        title: 'Implementation and Complexity',
        explanation: `Linear search iterates through every element, comparing each to the target. The loop terminates either when a match is found or all elements are checked.

Best case: O(1) — target is the first element. Worst case: O(n) — target is last or absent. Average case: O(n/2) = O(n). Space: O(1) — no extra memory needed.

An optimization: sentinel linear search places the target at the end of the array, removing the bounds check inside the loop. This reduces overhead per iteration but doesn't change the asymptotic complexity.`,
        keyPoints: ['Best case O(1), worst/average case O(n)', 'Space: O(1)', 'Sentinel optimization removes one comparison per iteration', 'Simple to implement and debug'],
        codeSnippet: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`,
        checkpointQuestion: 'What is the worst-case time complexity of linear search and when does it occur?',
        checkpointRubric: {
          expectedKeyPoints: ['O(n)', 'last element', 'not found'],
          modelAnswer: 'O(n) — occurs when the target is the last element or not in the array at all.',
          synonyms: { 'O(n)': ['linear time', 'n comparisons'], 'last element': ['end of array', 'last position'], 'not found': ['absent', 'missing', 'not in array'] },
        },
        faq: [{ question: 'How does linear search compare to hash table lookup?', answer: 'Hash table lookup is O(1) average but requires extra memory and a hash function. Linear search is O(n) but needs no extra space.' }],
      },
      {
        position: 2,
        title: 'When to Use Linear Search',
        explanation: `Linear search is the right tool in specific scenarios: unsorted data where sorting would cost more than searching, very small arrays (n < ~20) where overhead of sorting outweighs savings, linked lists where random access is O(n) anyway, one-time searches where setup cost matters, and when searching for a condition rather than a value (e.g., "first element > 5").

It's also used as a fallback in hybrid algorithms. For example, Timsort uses binary search to find insertion points, but insertion sort (which uses linear scan) for small subarrays.`,
        keyPoints: ['Best for small, unsorted, or singly-linked collections', 'Zero setup cost — no sorting needed', 'Works with any equality/predicate condition', 'Used internally in hybrid algorithms'],
        checkpointQuestion: 'Give one scenario where linear search is preferred over binary search even for large n.',
        checkpointRubric: {
          expectedKeyPoints: ['unsorted', 'linked list', 'predicate'],
          modelAnswer: 'Unsorted data: if sorting costs O(n log n) but you only search once, linear search is cheaper. Or for linked lists where random access is O(n).',
          synonyms: { 'unsorted': ['not sorted', 'random order'], 'linked list': ['list', 'node'], 'predicate': ['condition', 'custom condition', 'filter'] },
        },
        faq: [{ question: 'Is linear search ever used in practice?', answer: 'Yes — databases use sequential scans, many language built-ins (Array.find) use it, and it appears in fallback paths of complex algorithms.' }],
      },
    ],
  },
  {
    slug: 'bubble-sort',
    title: 'Bubble Sort',
    description: 'Simple comparison-based sorting algorithm that repeatedly swaps adjacent elements',
    difficulty: 'beginner',
    aliases: ['bubble sort', 'bubblesort', 'sinking sort'],
    concepts: [
      {
        position: 0,
        title: 'How Bubble Sort Works',
        explanation: `Bubble sort repeatedly passes through the array, comparing adjacent elements and swapping them if they are in the wrong order. After each full pass, the largest unsorted element "bubbles up" to its correct position at the end.

Think of it like bubbles rising in water — heavier elements (larger numbers) settle to the bottom (end of array) after each pass.

After n-1 passes, the array is sorted. Optimization: track if any swap happened in a pass; if not, the array is already sorted and we can stop early.`,
        keyPoints: ['Compares adjacent pairs and swaps if out of order', 'Each pass moves the largest unsorted element to its position', 'Early termination when no swaps occur in a pass', 'Simple but inefficient for large arrays'],
        example: 'Pass 1 on [5, 3, 1, 4]: Compare 5,3 → swap → [3,5,1,4]. Compare 5,1 → swap → [3,1,5,4]. Compare 5,4 → swap → [3,1,4,5]. 5 is now in place.',
        checkpointQuestion: 'What does "bubbling up" mean in bubble sort, and how many passes are needed to sort n elements?',
        checkpointRubric: {
          expectedKeyPoints: ['largest element', 'end of array', 'n-1 passes'],
          modelAnswer: 'Each pass moves the largest unsorted element to its final position. n-1 passes are needed in the worst case.',
          synonyms: { 'largest element': ['biggest', 'maximum', 'largest'], 'end of array': ['last position', 'correct place', 'end'], 'n-1 passes': ['n minus 1', 'at most n-1'] },
        },
        faq: [{ question: 'Is bubble sort used in practice?', answer: 'Rarely for general sorting. It is used for nearly-sorted data (with early termination) and as a teaching tool for understanding sorting algorithms.' }],
      },
      {
        position: 1,
        title: 'Complexity Analysis',
        explanation: `Bubble sort time complexity: O(n²) worst and average case. The outer loop runs n-1 times. The inner loop runs n-1, n-2, ..., 1 times. Total = n(n-1)/2 = O(n²) comparisons.

Best case: O(n) with early termination when the array is already sorted (only one pass needed, no swaps detected).

Space: O(1) — bubble sort is in-place; only a temporary variable for swapping is needed.

Stable: Yes. Bubble sort preserves the relative order of equal elements because it only swaps when elements are strictly out of order.`,
        keyPoints: ['O(n²) time, worst and average case', 'O(n) best case with early termination on sorted input', 'O(1) space — in-place sorting', 'Stable sort — preserves order of equal elements'],
        checkpointQuestion: 'What is bubble sort\'s time complexity and why? When is it O(n)?',
        checkpointRubric: {
          expectedKeyPoints: ['O(n²)', 'O(n)', 'sorted input', 'nested loops'],
          modelAnswer: 'O(n²) because of nested loops doing n*(n-1)/2 comparisons. O(n) in the best case when input is already sorted and early termination detects no swaps.',
          synonyms: { 'O(n²)': ['n squared', 'quadratic'], 'O(n)': ['linear', 'n comparisons'], 'sorted input': ['already sorted', 'best case'], 'nested loops': ['two loops', 'double loop'] },
        },
        faq: [{ question: 'How does bubble sort compare to insertion sort?', answer: 'Both are O(n²) average case and O(n) best case. Insertion sort is generally faster in practice because it performs fewer swaps and has better cache behavior.' }],
      },
    ],
  },
  {
    slug: 'recursion',
    title: 'Recursion',
    description: 'Functions that call themselves to solve problems by breaking them into smaller subproblems',
    difficulty: 'intermediate',
    aliases: ['recursion', 'recursive', 'recursive function', 'self-referential'],
    concepts: [
      {
        position: 0,
        title: 'What is Recursion',
        explanation: `Recursion is when a function calls itself to solve a smaller version of the same problem. Every recursive solution has two parts: the base case (a condition where the function stops calling itself) and the recursive case (where the function calls itself with a simpler input).

Without a base case, recursion runs forever (stack overflow). Without the recursive case making progress toward the base case, you also get infinite recursion.

Example: factorial(n) = n × factorial(n-1). Base case: factorial(0) = 1. This naturally captures the mathematical definition.`,
        keyPoints: ['Must have a base case to stop recursion', 'Each recursive call must move toward the base case', 'Stack frames accumulate — uses O(n) space for depth n', 'Elegant for problems with recursive structure (trees, graphs, divide-and-conquer)'],
        example: 'factorial(3): 3 × factorial(2) → 3 × 2 × factorial(1) → 3 × 2 × 1 × factorial(0) → 3 × 2 × 1 × 1 = 6',
        checkpointQuestion: 'What are the two essential components of every recursive function, and what happens if either is missing?',
        checkpointRubric: {
          expectedKeyPoints: ['base case', 'recursive case', 'stack overflow'],
          modelAnswer: 'Every recursive function needs a base case (termination condition) and a recursive case. Without a base case, recursion never stops and causes a stack overflow.',
          synonyms: { 'base case': ['termination condition', 'stopping condition', 'base'], 'recursive case': ['recursive call', 'self-call', 'recurrence'], 'stack overflow': ['infinite recursion', 'stack limit', 'call stack overflow'] },
        },
        faq: [{ question: 'Is recursion always better than iteration?', answer: 'No. Recursion is elegant for naturally recursive problems (trees, fractals, backtracking) but iteration is often more efficient due to lower overhead and no stack limit.' }],
      },
      {
        position: 1,
        title: 'Call Stack and Space Complexity',
        explanation: `Each recursive call adds a frame to the call stack. This frame stores local variables, parameters, and the return address. When the base case is reached, frames unwind in reverse order.

Space complexity: O(depth) — each frame takes constant space. For factorial(n), depth = n, so space = O(n). For binary search (recursive), depth = O(log n).

Stack overflow occurs when recursion depth exceeds the runtime's limit (usually 1000-10000 frames depending on environment). Tail recursion optimization (TCO) eliminates stack frames for tail-recursive calls in languages that support it (not all do — JavaScript does not in practice).`,
        keyPoints: ['Each call adds one stack frame — O(depth) space', 'Stack overflow occurs when depth exceeds the limit', 'Tail recursion can be optimized to O(1) space (language-dependent)', 'Memoization converts overlapping recursion to O(n) time from O(2^n)'],
        checkpointQuestion: 'Why does a recursive function computing fibonacci(50) take exponentially longer than fibonacci(10)?',
        checkpointRubric: {
          expectedKeyPoints: ['overlapping subproblems', 'recomputed', 'exponential'],
          modelAnswer: 'Naive recursive Fibonacci recomputes the same subproblems exponentially many times. fibonacci(50) triggers 2^50 calls while fibonacci(10) triggers 2^10, because there are overlapping subproblems with no memoization.',
          synonyms: { 'overlapping subproblems': ['repeated calculations', 'same subproblem'], 'recomputed': ['computed again', 'recalculated'], 'exponential': ['2^n', 'doubles each step', 'exponentially'] },
        },
        faq: [{ question: 'What is memoization?', answer: 'Caching the result of each unique subproblem. When fibonacci(5) is needed twice, the second call returns instantly from the cache instead of recomputing.' }],
      },
      {
        position: 2,
        title: 'Common Recursive Patterns',
        explanation: `Three core patterns cover most recursive algorithms:

1. Linear recursion: one recursive call per function invocation. Examples: factorial, array sum, list reversal. Depth = n, time = O(n).

2. Binary/multiple recursion: two or more recursive calls. Examples: merge sort (two calls), Fibonacci (two calls), tree traversal (two calls for binary trees). Depth = O(log n) for balanced structures.

3. Backtracking recursion: make a choice, recurse, undo the choice if it doesn't work. Examples: n-queens, sudoku solver, permutations. Explores a decision tree and backtracks on dead ends.

Understanding which pattern applies helps predict time and space complexity before writing code.`,
        keyPoints: ['Linear recursion: one call, O(n) depth', 'Binary recursion: two calls, O(log n) depth for balanced trees', 'Backtracking: try/recurse/undo pattern for combinatorial search', 'Divide and conquer: split, recurse, merge (merge sort, quick sort)'],
        checkpointQuestion: 'Describe the backtracking pattern in recursion with a simple example.',
        checkpointRubric: {
          expectedKeyPoints: ['try', 'recurse', 'undo', 'backtrack'],
          modelAnswer: 'Backtracking: make a choice, recurse with that choice, then undo (backtrack) if the path leads to failure. Example: generating all permutations by adding each unused element, recursing, then removing it.',
          synonyms: { 'try': ['choose', 'pick', 'attempt'], 'recurse': ['call recursively', 'recurse deeper'], 'undo': ['restore', 'backtrack', 'remove', 'revert'] },
        },
        faq: [{ question: 'How do I convert recursion to iteration?', answer: 'Use an explicit stack (array) to simulate the call stack. Push the initial problem, pop and process, push subproblems. This avoids stack overflow and is always possible.' }],
      },
    ],
  },
  {
    slug: 'linked-list',
    title: 'Linked List',
    description: 'A linear data structure where elements are stored in nodes connected by pointers',
    difficulty: 'beginner',
    aliases: ['linked list', 'linkedlist', 'singly linked list', 'doubly linked list'],
    concepts: [
      {
        position: 0,
        title: 'Linked List Fundamentals',
        explanation: `A linked list is a sequence of nodes where each node stores data and a pointer (reference) to the next node. The first node is called the head; the last node's next pointer is null.

Unlike arrays, linked list nodes are not stored contiguously in memory. Each node is independently allocated. This means: no random access (you must traverse from head), but easy insertion/deletion anywhere (just update pointers — no shifting).

Types: Singly linked (next pointer only), Doubly linked (next and prev pointers), Circular (last node points back to head).`,
        keyPoints: ['Nodes contain data and a next pointer', 'No random access — must traverse from head for index access', 'O(1) insertion/deletion when you have a pointer to the position', 'O(n) traversal to find an element', 'Head is the entry point; null marks the end'],
        example: 'head → [1|*] → [2|*] → [3|null]\nTo insert 4 after node 2: create node [4|*], set [4|*].next = [3|null], set [2|*].next = [4|*].',
        checkpointQuestion: 'What is the main advantage of a linked list over an array for insertions, and what is the tradeoff?',
        checkpointRubric: {
          expectedKeyPoints: ['O(1) insertion', 'no shifting', 'no random access'],
          modelAnswer: 'Advantage: O(1) insertion/deletion when the position is known — just update pointers, no shifting. Tradeoff: no random access, so finding the position first takes O(n).',
          synonyms: { 'O(1) insertion': ['constant time insert', 'fast insertion'], 'no shifting': ['no moving elements', 'no copying'], 'no random access': ['sequential access', 'must traverse'] },
        },
        faq: [{ question: 'When should I use a linked list vs an array?', answer: 'Linked lists are better for frequent insertions/deletions at arbitrary positions and unknown size. Arrays are better for random access, cache performance, and fixed-size storage.' }],
      },
      {
        position: 1,
        title: 'Common Operations and Complexity',
        explanation: `Key linked list operations and their complexities:

Access/Search: O(n) — must traverse from head. No index arithmetic possible.
Insertion at head: O(1) — just update head pointer. 
Insertion at tail: O(n) without tail pointer, O(1) with tail pointer.
Deletion: O(1) if you have a pointer to the previous node; O(n) to find the node first.
Length: O(n) unless maintained as a separate counter.

Common interview problems: reverse a linked list (in-place, O(n) time, O(1) space), detect a cycle using Floyd's two-pointer algorithm (slow moves 1 step, fast moves 2 steps), find the middle using two pointers.`,
        keyPoints: ['Access: O(n), Insert at head: O(1), Insert at tail: O(1) with tail pointer', 'Detect cycle: Floyd\'s slow/fast pointer algorithm', 'Reverse: three pointers (prev, curr, next), O(n) time O(1) space', 'Merge sorted lists: compare heads, recurse or iterate'],
        checkpointQuestion: 'Describe how Floyd\'s two-pointer (tortoise and hare) algorithm detects a cycle in a linked list.',
        checkpointRubric: {
          expectedKeyPoints: ['slow pointer', 'fast pointer', 'meet', 'cycle'],
          modelAnswer: 'Two pointers: slow moves one step, fast moves two steps. If there is a cycle, fast catches up to slow (they meet inside the cycle). If no cycle, fast reaches null first.',
          synonyms: { 'slow pointer': ['slow', 'tortoise', 'one step'], 'fast pointer': ['fast', 'hare', 'two steps'], 'meet': ['collide', 'same node', 'equal'], 'cycle': ['loop', 'circular'] },
        },
        faq: [{ question: 'How do you reverse a linked list in-place?', answer: 'Three pointers: prev=null, curr=head, next=null. Loop: save next=curr.next, set curr.next=prev, advance prev=curr, curr=next. Return prev as new head.' }],
      },
    ],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const topic of TOPICS) {
      // Upsert topic
      const { rows } = await client.query(
        `INSERT INTO topics (slug, title, description, difficulty, aliases, is_predefined)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           difficulty = EXCLUDED.difficulty,
           aliases = EXCLUDED.aliases
         RETURNING id`,
        [topic.slug, topic.title, topic.description, topic.difficulty, topic.aliases]
      );
      const topicId = rows[0].id;

      for (const concept of topic.concepts) {
        // Upsert concept by (topic_id, position)
        await client.query(
          `INSERT INTO topic_concepts 
            (topic_id, position, title, explanation, key_points, example, code_snippet, checkpoint_question, checkpoint_rubric, faq)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (topic_id, position) DO UPDATE SET
             title = EXCLUDED.title,
             explanation = EXCLUDED.explanation,
             key_points = EXCLUDED.key_points,
             example = EXCLUDED.example,
             code_snippet = EXCLUDED.code_snippet,
             checkpoint_question = EXCLUDED.checkpoint_question,
             checkpoint_rubric = EXCLUDED.checkpoint_rubric,
             faq = EXCLUDED.faq`,
          [
            topicId,
            concept.position,
            concept.title,
            concept.explanation,
            JSON.stringify(concept.keyPoints || []),
            concept.example || null,
            concept.codeSnippet || null,
            concept.checkpointQuestion,
            JSON.stringify(concept.checkpointRubric || {}),
            JSON.stringify(concept.faq || []),
          ]
        );
      }
      console.log(`  ✅ Seeded: ${topic.title} (${topic.concepts.length} concepts)`);
    }
    await client.query('COMMIT');
    console.log('Seeding complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
