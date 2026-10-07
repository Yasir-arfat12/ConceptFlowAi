/**
 * Prebuilt Binary Search learning path.
 * Works completely offline — no AI required.
 * Each concept has rich content and a checkpoint with expectedKeywords for grading.
 */

const PASS_SCORE = parseInt(process.env.CHECKPOINT_PASS_SCORE || '60', 10);

const binarySearchData = {
  topic: 'Binary Search',
  category: 'Algorithms',
  description: 'Master divide-and-conquer searching on sorted arrays, two-pointer bounds calculation, overflow prevention, and edge cases in O(log n) time.',

  concepts: [
    {
      title: 'Searching Basics and Why Sorted Data Matters',
      content: `Searching is the process of finding a specific target element within a collection of data. The simplest approach is Linear Search, which checks every element one by one from start to finish. For an array like [2, 5, 8, 12, 16, 23, 38], finding '16' by linear search takes 5 comparisons.

However, if the array is large, Linear Search is very slow — it has O(n) time complexity. For 1,000,000 elements, that's up to 1,000,000 comparisons.

This is where sorting helps. If we know the array is already sorted, we don't have to check every element. We can check the middle element instead. If our target is greater than the middle element, we instantly know the target cannot be in the left half — and we can completely ignore it, cutting our search space in half.

This critical insight requires the data to be sorted. Without sorting, the target could be anywhere, and eliminating half the array would be invalid. Sorted order gives us the guarantee: if target > middle, then target > everything to the left of middle.`,
      examples: `Example: Linear Search vs insight from sorting
Array: [2, 5, 8, 12, 16, 23, 38], Target: 16

Linear Search: check 2, 5, 8, 12, 16 → 5 steps
Sorted Array Insight: 
  Middle = 12. Since 16 > 12, we KNOW 16 is in the right half [16, 23, 38]
  We just eliminated 4 elements instantly!`,
      keyTakeaways: `• Sorted order lets us eliminate half the search space at each step
• Linear Search is O(n) — too slow for large datasets  
• The sorted property guarantees which half cannot contain the target`,
      checkpoint: {
        question: 'Why does binary search require the data to be sorted before it can work?',
        expectedKeywords: ['sorted', 'half', 'eliminate', 'discard', 'ignore', 'greater', 'less', 'know', 'compare', 'guarantee'],
      },
    },
    {
      title: 'Binary Search Intuition',
      content: `The intuition behind Binary Search is to repeatedly divide the search space in half. Think of searching for a word in a physical dictionary. You open it to the middle. If the word is alphabetically after the page you're on, you ignore the entire left half and repeat the process on the right half. You keep halving until you find the word.

We implement this with two pointers:
- left: the start of our current search space
- right: the end of our current search space

We calculate mid = left + (right - left) // 2, which gives us the middle index.

We compare the element at mid with our target:
- If nums[mid] === target → Found! Return mid.
- If nums[mid] < target → Target must be in the right half. Move left = mid + 1.
- If nums[mid] > target → Target must be in the left half. Move right = mid - 1.

We repeat until left > right (target not found).`,
      examples: `Example: Array [2, 5, 8, 12, 16, 23, 38], Target = 16

Step 1: left=0, right=6 → mid=3, nums[3]=12
  12 < 16, so target is in right half → left = 4

Step 2: left=4, right=6 → mid=5, nums[5]=23
  23 > 16, so target is in left half → right = 4

Step 3: left=4, right=4 → mid=4, nums[4]=16
  16 === 16 → FOUND at index 4! ✓

Total: 3 comparisons instead of 5 with linear search.`,
      keyTakeaways: `• Two pointers (left, right) define the active search space
• mid is always recalculated from the current left and right
• Each step eliminates half the remaining elements`,
      checkpoint: {
        question: 'In array [2, 5, 8, 12, 16, 23, 38] searching for target=8, after checking mid=12, what happens?',
        expectedKeywords: ['left', 'right', 'smaller', 'less', 'eliminate', 'discard', 'right = mid - 1', 'move right', 'right half excluded'],
      },
    },
    {
      title: 'The Binary Search Algorithm',
      content: `The iterative Binary Search algorithm uses a while loop that continues as long as left <= right. This condition is crucial — it ensures we keep searching even when the search space narrows to a single element (left === right).

Core Algorithm Steps:
1. Initialize left = 0, right = array.length - 1
2. While left <= right:
   a. Calculate mid = left + (right - left) // 2
   b. If nums[mid] === target → return mid (found!)
   c. If nums[mid] < target → left = mid + 1 (search right half)
   d. If nums[mid] > target → right = mid - 1 (search left half)
3. Return -1 (target not found)

IMPORTANT: We use mid = left + (right - left) // 2 instead of (left + right) // 2.

Why? Integer overflow protection! In languages with fixed-size integers (Java, C++), if left and right are both very large numbers (like 2 billion), adding them together can exceed the maximum integer value before dividing by 2. The subtraction form avoids this: (right - left) will always fit in a valid integer.`,
      examples: `Python Implementation:
def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        
        if nums[mid] == target:
            return mid          # Found!
        elif nums[mid] < target:
            left = mid + 1      # Search right half
        else:
            right = mid - 1     # Search left half
    
    return -1  # Not found`,
      keyTakeaways: `• Condition is left <= right (not left < right) to handle single-element search spaces
• Use mid = left + (right - left) // 2 to prevent integer overflow
• Return -1 when loop exits without finding target`,
      checkpoint: {
        question: 'Why do we calculate mid as `left + (right - left) // 2` instead of `(left + right) // 2`?',
        expectedKeywords: ['overflow', 'integer overflow', 'exceed', 'maximum', 'large', 'limit', 'fixed', 'safe'],
      },
    },
    {
      title: 'Implementing Binary Search',
      content: `Let's look at a complete, working implementation and understand every line.

The while condition left <= right handles all cases:
- When the array has one element: left === right, we check that single element
- When the target is absent: left eventually becomes > right, loop exits, we return -1
- When target is found: we return immediately

Why left = mid + 1 and right = mid - 1 (not mid)?

Because we already checked the element at mid and confirmed it is NOT the target. Including mid in the next search would be redundant. Worse, in edge cases it can cause an infinite loop:
- If left === right and we set left = mid (same value), left would never become > right
- The loop would run forever!

By using mid + 1 and mid - 1, we always shrink the search space, guaranteeing the loop terminates.`,
      examples: `Complete Python implementation with test cases:

def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Test cases:
arr = [1, 3, 5, 7, 9, 11, 15]
print(binary_search(arr, 7))   # → 3
print(binary_search(arr, 1))   # → 0 (first element)
print(binary_search(arr, 15))  # → 6 (last element)
print(binary_search(arr, 4))   # → -1 (not found)`,
      keyTakeaways: `• left = mid + 1 and right = mid - 1 prevent infinite loops
• We exclude mid because it was already checked and is not the target
• Works correctly for first element, last element, and missing elements`,
      checkpoint: {
        question: 'Why do we set left = mid + 1 and right = mid - 1 instead of left = mid and right = mid?',
        expectedKeywords: ['infinite loop', 'already checked', 'redundant', 'exclude', 'shrink', 'stuck', 'not the target', 'terminate'],
      },
    },
    {
      title: 'Boundary Conditions and Edge Cases',
      content: `Standard binary search handles most cases naturally, but you must be aware of edge cases:

1. Empty array: The initial condition left=0, right=-1 means the while loop (0 <= -1) immediately exits. Returns -1. ✓

2. Target not present: The search space keeps shrinking until left > right, then returns -1. ✓

3. Single element array: left === right = 0. We check mid = 0. Found or not found, loop exits correctly. ✓

4. Duplicate values: Standard binary search returns SOME index where the target exists, but not necessarily the FIRST or LAST occurrence.

Finding the FIRST occurrence:
- When nums[mid] === target, instead of returning immediately, record the answer and set right = mid - 1
- This forces us to keep searching LEFT for an earlier occurrence

Finding the LAST occurrence:
- When nums[mid] === target, record the answer and set left = mid + 1  
- This forces us to keep searching RIGHT for a later occurrence`,
      examples: `Finding First and Last Occurrence:

def find_first(nums, target):
    left, right, result = 0, len(nums) - 1, -1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            result = mid        # Record this match
            right = mid - 1     # Keep searching LEFT for earlier match
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return result

# Test: [1, 2, 2, 2, 3], target=2
# find_first → 1 (not 2 or 3)`,
      keyTakeaways: `• Empty/single-element arrays work naturally with left <= right condition
• Duplicate targets require modification: don't return on match, keep searching
• First occurrence: continue LEFT (right = mid - 1) when match found
• Last occurrence: continue RIGHT (left = mid + 1) when match found`,
      checkpoint: {
        question: 'If an array has duplicate values [1,2,2,2,3] and target=2, how do you modify binary search to find the FIRST occurrence?',
        expectedKeywords: ['right = mid - 1', 'keep searching left', 'continue left', "don't return", 'record', 'result', 'continue searching'],
      },
    },
    {
      title: 'Time Complexity, Variations and Applications',
      content: `Time Complexity: O(log n)
Binary search is exceptionally fast. At each step, we halve the search space:
- After 1 step: n/2 elements remain
- After 2 steps: n/4 elements remain  
- After k steps: n/2^k elements remain
- We stop when 1 element remains: 2^k = n → k = log₂(n)

For 1,000,000 elements: at most log₂(1,000,000) ≈ 20 steps!
For 1 billion elements: at most log₂(1,000,000,000) ≈ 30 steps!

Space Complexity: O(1) for iterative binary search (only a few pointer variables)

Binary Search on Answer:
Beyond arrays, binary search applies to any MONOTONIC function — where the output is consistently increasing or decreasing with respect to the input.

Pattern: "Find minimum X such that condition(X) is true"
- You know the answer lies in a range [lo, hi]
- Write a predicate function canAchieve(X)
- Binary search the range

Examples:
- Minimum capacity to ship packages in D days
- Find square root (integer) of a number
- Minimum days to make m bouquets`,
      examples: `Example: Binary Search on Answer
"What's the smallest capacity for a ship to deliver all packages in D=3 days?"
packages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

lo = max(packages) = 10 (must carry at least heaviest)
hi = sum(packages) = 55 (could carry all in one trip)

Binary search [10, 55]:
  mid=32: canDeliver(32)? → need 2 days → YES
  mid=21: canDeliver(21)? → need 3 days → YES  
  mid=15: canDeliver(15)? → need 4 days → NO
  mid=18: canDeliver(18)? → need 3 days → YES
  mid=16: canDeliver(16)? → need 4 days → NO
  Answer: 15`,
      keyTakeaways: `• O(log n) time — 20 steps for 1 million elements, 30 for 1 billion
• O(1) space for iterative version
• Applies to any monotonic function, not just sorted arrays
• "Binary Search on Answer" is a powerful competitive programming pattern`,
      checkpoint: {
        question: 'What is the time complexity of Binary Search and roughly how many steps would it take to search 1,000,000 elements?',
        expectedKeywords: ['O(log n)', 'log n', 'logarithmic', '20', 'twenty', 'log', '~20'],
      },
    },
  ],

  // Prebuilt doubt responses (keyword-based matching)
  doubtResponses: [
    {
      keywords: ['sorted', 'sort', 'why sorted', 'must be sorted', 'unsorted'],
      answer: 'Binary search relies strictly on sorted order so that when we compare the target with the middle element, we can definitively eliminate half of the remaining elements. If the array were unsorted, examining the middle provides zero guarantees about which side contains the target, rendering divide-and-conquer impossible.',
    },
    {
      keywords: ['mid + 1', 'mid - 1', 'plus 1', 'minus 1', 'infinite loop', 'stuck', 'loop forever'],
      answer: 'We use `left = mid + 1` and `right = mid - 1` because `nums[mid]` has already been evaluated and confirmed not to be our target. Excluding `mid` strictly reduces the search space interval on every iteration, preventing fatal infinite loops when `left` and `right` are adjacent.',
    },
    {
      keywords: ['left <= right', 'left < right', 'condition', 'while condition', 'while loop', 'loop condition'],
      answer: 'The condition `while (left <= right)` is critical. If you wrote `while (left < right)`, the loop would terminate prematurely when the search space narrows to a single element (`left === right`), missing the target if it happens to sit at that exact index.',
    },
    {
      keywords: ['overflow', 'integer overflow', '(left + right)', 'mid calculation', 'large numbers', '32-bit'],
      answer: 'We write `mid = left + (right - left) // 2` instead of `(left + right) // 2` to prevent 32-bit integer overflow. In strongly-typed languages like Java, C, and C++, adding two large integer pointers can exceed 2,147,483,647 (INT_MAX) and wrap into negative numbers before division.',
    },
    {
      keywords: ['time complexity', 'o(log n)', 'log n', 'fast', 'how fast', 'big o', 'steps', 'comparisons'],
      answer: 'Binary search runs in O(log n) time complexity because each comparison halves the remaining search interval (n/2, n/4, n/8... down to 1). For 1,000,000 elements, it takes at most ~20 comparisons (since 2^20 ≈ 1,048,576). For 1,000,000,000 elements, it takes at most ~30 steps!',
    },
    {
      keywords: ['space complexity', 'o(1)', 'memory', 'auxiliary', 'recursive vs iterative'],
      answer: 'Iterative binary search uses O(1) auxiliary space because it only maintains three pointer variables (`left`, `right`, `mid`). Recursive binary search uses O(log n) space due to call stack frames.',
    },
    {
      keywords: ['first occurrence', 'duplicate', 'last occurrence', 'multiple matches', 'bisect', 'lower bound', 'upper bound'],
      answer: 'To find the FIRST occurrence in duplicate arrays: when `nums[mid] == target`, record `result = mid` and set `right = mid - 1` to continue searching the left half. To find the LAST occurrence: when `nums[mid] == target`, record `result = mid` and set `left = mid + 1` to continue searching the right half.',
    },
    {
      keywords: ['linear search vs binary search', 'difference', 'compare', 'linear vs binary', 'linear search'],
      answer: 'Linear search scans items sequentially one by one in O(n) time and works on any array. Binary search requires sorted data, examines the midpoint, and cuts the search space in half each step in O(log n) time. For 1 million elements, Linear Search takes up to 1,000,000 comparisons, while Binary Search takes at most 20.',
    },
    {
      keywords: ['answer', 'binary search on answer', 'monotonic', 'predicate', 'koko', 'ship'],
      answer: 'Binary Search on Answer applies when you need to find the minimum or maximum parameter X satisfying a monotonic condition `canAchieve(X)`. You define a search range [min_val, max_val] and binary search the range using an O(n) feasibility check.',
    },
    {
      keywords: ['empty', 'edge case', 'single element', 'missing', 'not found', '-1'],
      answer: 'For an empty array (`left = 0`, `right = -1`), the condition `left <= right` is immediately false, so the loop exits safely returning `-1`. For a missing target, the pointers eventually cross (`left > right`), loop terminates, and `-1` is returned.',
    },
  ],

  // Prebuilt quiz (10 structured questions mapped across all 6 concepts)
  quiz: {
    title: 'Binary Search Mastery Assessment',
    questions: [
      {
        id: 'bs_q1',
        conceptIndex: 1,
        conceptTitle: 'Searching Basics and Why Sorted Data Matters',
        type: 'single_select',
        question: 'What is the fundamental prerequisite that allows Binary Search to eliminate half the search space?',
        options: [
          { value: 'A', label: 'The array elements must be strictly positive numbers', feedback: 'Array elements can be negative, zero, or positive.' },
          { value: 'B', label: 'The array must be sorted in monotonic order', feedback: 'Sorted order guarantees that comparing against the middle element allows eliminating half the elements.' },
          { value: 'C', label: 'The array must have an even length', feedback: 'Binary search works equally well on arrays of odd or even length.' },
          { value: 'D', label: 'The array must contain no duplicate values', feedback: 'Binary search can operate with duplicates, though finding specific occurrences requires minor adjustments.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Binary Search relies strictly on sorted data. Sorted order guarantees that if target > middle element, the target cannot possibly exist in the left half.',
        hint: 'Think about why we can safely ignore half the elements after just one comparison.',
      },
      {
        id: 'bs_q2',
        conceptIndex: 2,
        conceptTitle: 'Binary Search Intuition',
        type: 'single_select',
        question: 'In an array [2, 5, 8, 12, 16, 23, 38], searching for target 8 with left=0 and right=6 (mid=3, nums[3]=12), how are pointers updated?',
        options: [
          { value: 'A', label: 'left is updated to mid + 1 (4)', feedback: '12 is greater than 8, so 8 cannot be in the right half.' },
          { value: 'B', label: 'right is updated to mid - 1 (2)', feedback: 'Correct! Since 8 < 12, the target must reside in the left half [2, 5, 8].' },
          { value: 'C', label: 'right is set to mid (3)', feedback: 'Since 12 is already checked and not equal to 8, we exclude it by using mid - 1.' },
          { value: 'D', label: 'left is updated to 0 and right is updated to 6', feedback: 'Pointers must narrow down the search space.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Because 8 < 12 (nums[mid]), the target must be in the left partition. We set right = mid - 1 = 2.',
        hint: 'Compare target 8 with nums[mid]=12.',
      },
      {
        id: 'bs_q3',
        conceptIndex: 3,
        conceptTitle: 'The Binary Search Algorithm',
        type: 'single_select',
        question: 'Why do we compute the middle pointer as `left + (right - left) // 2` instead of `(left + right) // 2`?',
        options: [
          { value: 'A', label: 'It executes in fewer CPU cycles', feedback: 'Both are elementary arithmetic operations.' },
          { value: 'B', label: 'It avoids integer overflow when left and right are large integers', feedback: 'Correct! In languages like Java or C++, adding two large 32-bit integers can overflow before division.' },
          { value: 'C', label: 'It guarantees that mid rounds up instead of down', feedback: 'Integer division truncates downwards in both expressions.' },
          { value: 'D', label: 'It is required by Python syntax', feedback: 'Python supports both expressions, but subtraction is the canonical safe pattern.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'When left and right are large (near INT_MAX), (left + right) can overflow into negative values. Using left + (right - left) // 2 avoids exceeding integer bounds.',
        hint: 'Consider what happens when left + right exceeds maximum 32-bit integer capacity.',
      },
      {
        id: 'bs_q4',
        conceptIndex: 4,
        conceptTitle: 'Implementing Binary Search',
        type: 'single_select',
        question: 'What is the correct while loop condition for a standard iterative binary search?',
        options: [
          { value: 'A', label: 'while left < right', feedback: 'left < right misses the case when the search space narrows to a single element where left === right.' },
          { value: 'B', label: 'while left <= right', feedback: 'Correct! left <= right ensures single-element search spaces (left === right) are evaluated.' },
          { value: 'C', label: 'while left != right', feedback: 'This can cause an infinite loop if left and right cross past each other.' },
          { value: 'D', label: 'while right > 0', feedback: 'This does not account for the moving left pointer.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'The condition `while left <= right` is critical because when only one element remains, left equals right, and that single element must still be inspected.',
        hint: 'Make sure your loop inspects arrays with length 1.',
      },
      {
        id: 'bs_q5',
        conceptIndex: 5,
        conceptTitle: 'Boundary Conditions and Edge Cases',
        type: 'single_select',
        question: 'When searching for target 2 in duplicate array [1, 2, 2, 2, 3], how do you locate the FIRST occurrence?',
        options: [
          { value: 'A', label: 'Return mid immediately upon finding nums[mid] == 2', feedback: 'Returning immediately might return the middle or last occurrence.' },
          { value: 'B', label: 'Set left = mid + 1 upon match', feedback: 'Moving right would search for later occurrences.' },
          { value: 'C', label: 'Record mid as candidate answer and set right = mid - 1 to keep searching left', feedback: 'Correct! Recording the match and continuing left discovers earlier occurrences.' },
          { value: 'D', label: 'Restart binary search from index 0', feedback: 'Binary search can locate boundaries in O(log n) without linear restart.' },
        ],
        correctAnswer: 'C',
        correctOptionIndex: 2,
        explanation: 'To find the first occurrence, when nums[mid] === target, record `result = mid` and move `right = mid - 1` to search the left partition for an earlier index.',
        hint: 'Do not exit on first match; keep searching leftward while remembering the best answer.',
      },
      {
        id: 'bs_q6',
        conceptIndex: 5,
        conceptTitle: 'Boundary Conditions and Edge Cases',
        type: 'single_select',
        question: 'How does standard binary search behave on an empty array `[]` with target = 5?',
        options: [
          { value: 'A', label: 'Throws an IndexError / out-of-bounds exception', feedback: 'With left=0 and right=-1, the while loop never executes.' },
          { value: 'B', label: 'Initializes left=0, right=-1, loop condition 0 <= -1 fails immediately, returns -1', feedback: 'Correct! The standard loop safely exits immediately without accessing any elements.' },
          { value: 'C', label: 'Enters an infinite loop', feedback: 'The loop condition is false from the start.' },
          { value: 'D', label: 'Returns index 0', feedback: 'Empty arrays contain no valid indexes.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'For an empty array of length 0, right is initialized to len - 1 = -1. The while condition `left <= right` (0 <= -1) evaluates to false immediately, returning -1 safely.',
        hint: 'Check initial values of left and right.',
      },
      {
        id: 'bs_q7',
        conceptIndex: 6,
        conceptTitle: 'Time Complexity, Variations and Applications',
        type: 'single_select',
        question: 'What is the maximum number of comparisons Binary Search takes on an array of 1,000,000 elements?',
        options: [
          { value: 'A', label: 'Approximately 20 comparisons', feedback: 'Correct! log2(1,000,000) is approximately 19.93, so at most 20 comparisons are needed.' },
          { value: 'B', label: '500,000 comparisons', feedback: 'That would be average linear search.' },
          { value: 'C', label: '1,000 comparisons', feedback: 'Binary search is much faster than square root search.' },
          { value: 'D', label: '100 comparisons', feedback: '2^20 is already 1,048,576.' },
        ],
        correctAnswer: 'A',
        correctOptionIndex: 0,
        explanation: 'Binary Search has O(log₂ n) time complexity. Since 2²⁰ = 1,048,576 > 1,000,000, it takes at most 20 iterations.',
        hint: 'Calculate the power of 2 that surpasses 1 million.',
      },
      {
        id: 'bs_q8',
        conceptIndex: 5,
        conceptTitle: 'Boundary Conditions and Edge Cases',
        type: 'single_select',
        question: 'What state indicates that the target does NOT exist in the array after the while loop completes?',
        options: [
          { value: 'A', label: 'left == right', feedback: 'When left == right, the last remaining element is being evaluated.' },
          { value: 'B', label: 'left > right', feedback: 'Correct! When left exceeds right, the search space is exhausted and the target is absent.' },
          { value: 'C', label: 'mid == 0', feedback: 'Index 0 is a valid position in the array.' },
          { value: 'D', label: 'nums[mid] is negative', feedback: 'Array values can be negative.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'When left crosses right (left > right), the search range becomes invalid [left, right], confirming that the target is not present in the array.',
        hint: 'Consider the condition that causes the `while left <= right` loop to terminate.',
      },
      {
        id: 'bs_q9',
        conceptIndex: 4,
        conceptTitle: 'Implementing Binary Search',
        type: 'single_select',
        question: 'Why do we update pointers to `left = mid + 1` and `right = mid - 1` rather than `left = mid` and `right = mid`?',
        options: [
          { value: 'A', label: 'To reduce memory overhead', feedback: 'Pointer arithmetic uses identical registers.' },
          { value: 'B', label: 'Because mid has already been inspected, and using mid directly causes infinite loops', feedback: 'Correct! Setting left=mid when left===right or right=left+1 can prevent pointers from making progress, causing infinite loops.' },
          { value: 'C', label: 'To keep the array size even', feedback: 'Pointer positions do not alter array structure.' },
          { value: 'D', label: 'It is a style recommendation only', feedback: 'It is a functional requirement to prevent infinite loops.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Since nums[mid] was already compared with the target, including mid again is redundant and can stall the search space (e.g., when left and right differ by 1), leading to an infinite loop.',
        hint: 'Think about what happens when left = 0, right = 1 and we do left = mid.',
      },
      {
        id: 'bs_q10',
        conceptIndex: 6,
        conceptTitle: 'Time Complexity, Variations and Applications',
        type: 'single_select',
        question: 'What is the "Binary Search on Answer" pattern commonly used for in problem solving?',
        options: [
          { value: 'A', label: 'Searching an unsorted hash map', feedback: 'Hash maps already provide O(1) lookups.' },
          { value: 'B', label: 'Finding the optimal minimum/maximum value over a monotonic feasibility function', feedback: 'Correct! When a check(x) function is monotonic (e.g. false, false, true, true), binary search finds the transition boundary.' },
          { value: 'C', label: 'Sorting strings alphabetically', feedback: 'Sorting is achieved with algorithms like QuickSort or MergeSort.' },
          { value: 'D', label: 'Compressing text files', feedback: 'Text compression uses Huffman coding or LZW.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Binary Search on Answer applies when a predicate function `canAchieve(X)` is monotonic over a search range [min, max], allowing O(log(range) * cost) optimization.',
        hint: 'Think about monotonic functions where if X works, all values > X also work.',
      },
    ],
  },

  // Prebuilt default assignment metadata
  assignment: {
    title: 'Binary Search Mastery Assignment',
    description: 'Personalized practice questions targeting edge cases, implementation details, and boundary conditions.',
    difficulty: 'developing',
  },
};

// ─── Prebuilt Question Bank for Binary Search Concepts ────────────────────────
const BINARY_SEARCH_QUESTION_BANK = [
  // Concept 1: Searching Basics and Why Sorted Data Matters
  {
    conceptTitleMatch: 'basics',
    fallbackIndex: 0,
    questions: [
      {
        question: 'Why does Binary Search fail on an unsorted array such as `[7, 2, 9, 1, 5]` when searching for `target = 5`?',
        options: [
          { value: 'A', label: 'Linear search is faster on unsorted arrays.' },
          { value: 'B', label: 'Checking the middle element does not give any guarantee about which half contains the target, so discarding half the array might eliminate the target.' },
          { value: 'C', label: 'Unsorted arrays cannot be indexed using two pointers.' },
          { value: 'D', label: 'The middle index calculation produces a decimal number on unsorted arrays.' }
        ],
        correctAnswer: 'B',
        explanation: 'The fundamental invariant of binary search is that if target > nums[mid], the target CANNOT be in the left half. This guarantee only holds when every element before mid is <= nums[mid]. Without sorted order, discarding half of the elements is completely invalid.',
        hint: 'Think about what property allows binary search to safely throw away half of the remaining items.'
      },
      {
        question: 'In the best-case scenario, how many comparisons does Linear Search take versus Binary Search to find the target?',
        options: [
          { value: 'A', label: 'Linear Search: 1 comparison; Binary Search: 1 comparison (if target is at index 0 and mid respectively).' },
          { value: 'B', label: 'Linear Search: O(n); Binary Search: O(log n) always.' },
          { value: 'C', label: 'Linear Search: 0 comparisons; Binary Search: 2 comparisons.' },
          { value: 'D', label: 'Both always take exactly n/2 comparisons.' }
        ],
        correctAnswer: 'A',
        explanation: 'Both algorithms have a best-case time complexity of O(1). Linear search finds it in 1 step if the target is the first element (index 0); binary search finds it in 1 step if the target happens to be at the exact middle index.',
        hint: 'Consider what happens when the first element checked by each algorithm happens to be the target.'
      }
    ]
  },

  // Concept 2: Binary Search Intuition
  {
    conceptTitleMatch: 'intuition',
    fallbackIndex: 1,
    questions: [
      {
        question: 'Given sorted array `nums = [3, 8, 12, 17, 24, 35, 42]`, you are searching for `target = 35`. In the first step, `left = 0`, `right = 6`, `mid = 3` (`nums[3] = 17`). What is the exact update in the next step?',
        options: [
          { value: 'A', label: 'right = 2 (search left half [3, 8, 12])' },
          { value: 'B', label: 'left = 4 (search right half [24, 35, 42])' },
          { value: 'C', label: 'left = 3 (keep mid in search space)' },
          { value: 'D', label: 'right = 3 (search left half including 17)' }
        ],
        correctAnswer: 'B',
        explanation: 'Since nums[mid] (17) < target (35), we know 35 cannot exist in the left half [3, 8, 12] nor at mid (17). Therefore, we update `left = mid + 1` (left = 4) to search the sub-array [24, 35, 42].',
        hint: 'When nums[mid] < target, which half is discarded and where does left move?'
      },
      {
        question: 'How does binary search eliminate half the search space at each iteration?',
        options: [
          { value: 'A', label: 'By sorting the remaining sub-array on each step.' },
          { value: 'B', label: 'By comparing target with the middle element and moving one pointer past mid.' },
          { value: 'C', label: 'By deleting elements from memory dynamically.' },
          { value: 'D', label: 'By checking both the first and last elements simultaneously.' }
        ],
        correctAnswer: 'B',
        explanation: 'Binary search maintains two pointers (left and right). By comparing nums[mid] to the target, it resets either left to mid + 1 or right to mid - 1, thereby cutting the active pointer window in half.',
        hint: 'Review how the left and right boundary pointers shrink the window.'
      }
    ]
  },

  // Concept 3: The Binary Search Algorithm
  {
    conceptTitleMatch: 'algorithm',
    fallbackIndex: 2,
    questions: [
      {
        question: 'Why do production libraries write `mid = left + (right - left) // 2` instead of `mid = (left + right) // 2`?',
        options: [
          { value: 'A', label: 'To avoid potential 32-bit integer overflow when left + right exceeds 2,147,483,647.' },
          { value: 'B', label: 'Because division by 2 is slower than subtraction.' },
          { value: 'C', label: 'To round up instead of rounding down.' },
          { value: 'D', label: 'It is required only for arrays of odd length.' }
        ],
        correctAnswer: 'A',
        explanation: 'If `left` and `right` are large positive integers (e.g., in languages with fixed 32-bit integers like Java, C, C++), adding them `(left + right)` can exceed 2^31 - 1 and wrap into negative numbers. Using `left + (right - left) / 2` mathematically computes the same midpoint while keeping all intermediate operations within bounds.',
        hint: 'Consider what happens when adding two huge numbers in fixed-width integer memory.'
      },
      {
        question: 'What is the correct while loop condition for standard binary search?',
        options: [
          { value: 'A', label: '`while (left <= right)`' },
          { value: 'B', label: '`while (left < right)`' },
          { value: 'C', label: '`while (left != right)`' },
          { value: 'D', label: '`while (left + 1 < right)`' }
        ],
        correctAnswer: 'A',
        explanation: '`while (left <= right)` is necessary so that when the search space shrinks to a single element (`left === right`), that final element is still checked! Using `left < right` would exit prematurely and miss targets located at that single remaining position.',
        hint: 'What happens when search space shrinks to only 1 element where left == right?'
      }
    ]
  },

  // Concept 4: Implementing Binary Search
  {
    conceptTitleMatch: 'implement',
    fallbackIndex: 3,
    questions: [
      {
        question: 'Look at this buggy binary search code. What bug will occur?\n```python\nwhile left <= right:\n    mid = (left + right) // 2\n    if nums[mid] == target:\n        return mid\n    elif nums[mid] < target:\n        left = mid   # <--- BUG HERE\n    else:\n        right = mid  # <--- BUG HERE\n```',
        options: [
          { value: 'A', label: 'It causes an infinite loop when the target is missing or when left + 1 == right.' },
          { value: 'B', label: 'It throws an IndexError on empty arrays.' },
          { value: 'C', label: 'It always returns index 0.' },
          { value: 'D', label: 'It returns None instead of -1.' }
        ],
        correctAnswer: 'A',
        explanation: 'When `left = mid` is used instead of `left = mid + 1`, the search space does not shrink if `mid == left`. If `left = 0, right = 1`, `mid = 0`, and `nums[0] < target`, `left` stays `0`, creating an infinite loop where the pointers never cross.',
        hint: 'If left is never strictly increased past mid, does the while loop ever terminate when left and right are adjacent?'
      },
      {
        question: 'If `nums = [1, 3, 5, 7, 9, 11]` and we execute standard binary search for `target = 8`, what sequence of `mid` values is inspected?',
        options: [
          { value: 'A', label: 'mid=2 (5), mid=4 (9), mid=3 (7)' },
          { value: 'B', label: 'mid=2 (5), mid=3 (7), mid=4 (9)' },
          { value: 'C', label: 'mid=3 (7), mid=4 (9)' },
          { value: 'D', label: 'mid=0 (1), mid=1 (3), mid=2 (5)' }
        ],
        correctAnswer: 'A',
        explanation: 'Initial: left=0, right=5 -> mid=2 (nums[2]=5 < 8) -> left=3. Next: left=3, right=5 -> mid=4 (nums[4]=9 > 8) -> right=3. Next: left=3, right=3 -> mid=3 (nums[3]=7 < 8) -> left=4. Now left(4) > right(3), loop exits -> returns -1.',
        hint: 'Trace the mid calculation step by step: (0+5)//2=2, then (3+5)//2=4, then (3+3)//2=3.'
      }
    ]
  },

  // Concept 5: Boundary Conditions and Edge Cases
  {
    conceptTitleMatch: 'boundary',
    fallbackIndex: 4,
    questions: [
      {
        question: 'In an array with duplicate elements `nums = [1, 2, 2, 2, 3]`, how do you modify binary search to guarantee finding the FIRST occurrence of `target = 2`?',
        options: [
          { value: 'A', label: 'When `nums[mid] == target`, record `result = mid` and set `right = mid - 1` to continue searching the left half.' },
          { value: 'B', label: 'When `nums[mid] == target`, return `mid - 1` immediately.' },
          { value: 'C', label: 'Perform linear search from left to right as soon as target is seen.' },
          { value: 'D', label: 'Set `left = mid + 1` to push pointers to the beginning.' }
        ],
        correctAnswer: 'A',
        explanation: 'Standard binary search returns any index matching target. To find the FIRST occurrence, upon seeing `nums[mid] == target`, save `result = mid` as a candidate and force the search to continue in the left half by setting `right = mid - 1`. If an earlier duplicate exists, it will overwrite result with a smaller index.',
        hint: 'To find the earliest index on the left, which pointer must be moved leftward upon matching target?'
      },
      {
        question: 'In the same array `nums = [1, 2, 2, 2, 3]`, how do you find the LAST occurrence of `target = 2`?',
        options: [
          { value: 'A', label: 'When `nums[mid] == target`, record `result = mid` and set `left = mid + 1` to continue searching the right half.' },
          { value: 'B', label: 'When `nums[mid] == target`, return `mid + 1` immediately.' },
          { value: 'C', label: 'Search from right to left using linear search.' },
          { value: 'D', label: 'Set `right = mid - 1` when nums[mid] == target.' }
        ],
        correctAnswer: 'A',
        explanation: 'For the LAST occurrence, when `nums[mid] == target`, store `result = mid` and search the right half by setting `left = mid + 1`. This finds any subsequent duplicates on the right while preserving the highest match found so far.',
        hint: 'To find the latest occurrence on the right, which pointer moves rightward?'
      },
      {
        question: 'What happens when binary search is executed on an empty array `nums = []` with `target = 10`?',
        options: [
          { value: 'A', label: '`left = 0`, `right = -1`, the condition `0 <= -1` evaluates to False immediately, and the function safely returns `-1` without errors.' },
          { value: 'B', label: 'It raises an `IndexError: list index out of range`.' },
          { value: 'C', label: 'It results in a division by zero error.' },
          { value: 'D', label: 'It returns `0`.' }
        ],
        correctAnswer: 'A',
        explanation: 'For an empty array, len(nums) is 0. Initializing `left = 0` and `right = -1` makes `left <= right` (0 <= -1) immediately false. The loop body never executes, and -1 is safely returned without accessing any array indices.',
        hint: 'Check the initial values of left and right: left=0, right=len-1=-1.'
      },
      {
        question: 'When `target` is not found in a sorted array, what does the final value of the `left` pointer represent?',
        options: [
          { value: 'A', label: 'The insertion index (where target should be inserted to keep the array sorted).' },
          { value: 'B', label: 'The maximum value in the array.' },
          { value: 'C', label: 'Always index 0.' },
          { value: 'D', label: 'Always index len(nums) - 1.' }
        ],
        correctAnswer: 'A',
        explanation: 'This is the basis of Python\'s `bisect_left` and C++\'s `lower_bound`. When binary search terminates without finding the target, `left` points exactly to the first element greater than target, which is the exact index where target would be inserted.',
        hint: 'Think about Python’s bisect_left / lower_bound function behavior.'
      }
    ]
  },

  // Concept 6: Time Complexity, Variations and Applications
  {
    conceptTitleMatch: 'complexity',
    fallbackIndex: 5,
    questions: [
      {
        question: 'If an array has 1,000,000 elements, what is the MAXIMUM number of comparisons binary search will ever make?',
        options: [
          { value: 'A', label: 'Approximately 20 comparisons (since 2^20 ≈ 1,048,576)' },
          { value: 'B', label: '500,000 comparisons' },
          { value: 'C', label: '1,000 comparisons' },
          { value: 'D', label: '100 comparisons' }
        ],
        correctAnswer: 'A',
        explanation: 'Because binary search cuts the search space in half at every step, the number of steps is ceil(log2(n)). For 1,000,000 elements, ceil(log2(1,000,000)) = 20 comparisons at most!',
        hint: 'Compute ceil(log2(1,000,000)). 2^10 = 1024, 2^20 ≈ 1,000,000.'
      },
      {
        question: 'What is "Binary Search on Answer" (monotonic predicate search)?',
        options: [
          { value: 'A', label: 'Applying binary search over a range of possible answers [min_val, max_val] where a condition function `check(x)` transitions monotonically from False to True.' },
          { value: 'B', label: 'Guessing the answer at random and verifying with linear search.' },
          { value: 'C', label: 'Sorting the output array after search completion.' },
          { value: 'D', label: 'Searching backwards from right to left.' }
        ],
        correctAnswer: 'A',
        explanation: 'Binary Search on Answer is a powerful problem-solving pattern used in LeetCode problems (like "Koko Eating Bananas" or "Ship Within D Days"). You search over the numerical answer range [lo, hi] by testing if a candidate value `mid` is feasible with an O(n) predicate.',
        hint: 'Consider how we find the minimum capacity or speed that satisfies a condition.'
      }
    ]
  }
];

/**
 * Deterministically generates a personalized 8-question assignment for Binary Search
 * weighted heavily towards the student's weakest concepts.
 */
function generatePrebuiltBinarySearchAssignment(conceptsList = [], weakConceptsList = [], snapshot = {}) {
  // Map concept IDs to questions
  const conceptMap = new Map();
  (conceptsList || []).forEach((c, idx) => {
    conceptMap.set(c.id, c);
    conceptMap.set(idx, c);
  });

  const getConcept = (matchStr, fallbackIdx) => {
    const found = conceptsList.find((c) =>
      (c.title || '').toLowerCase().includes(matchStr.toLowerCase())
    );
    return found || conceptsList[fallbackIdx] || { id: fallbackIdx + 1, title: 'Binary Search Concept' };
  };

  // Determine weak concepts in Binary Search
  const weakTitles = (weakConceptsList || []).map((w) => (w.title || w.conceptTitle || '').toLowerCase());
  const isBoundaryWeak = weakTitles.some((t) => t.includes('boundary') || t.includes('edge') || t.includes('duplicate'));
  const isImplementationWeak = weakTitles.some((t) => t.includes('implement') || t.includes('while'));
  const isAlgorithmWeak = weakTitles.some((t) => t.includes('algorithm') || t.includes('overflow'));

  const questions = [];
  let qCounter = 1;

  const boundaryConcept = getConcept('boundary', 4);
  const implementConcept = getConcept('implement', 3);
  const algorithmConcept = getConcept('algorithm', 2);
  const intuitionConcept = getConcept('intuition', 1);
  const basicsConcept = getConcept('basics', 0);
  const complexityConcept = getConcept('complexity', 5);

  // If boundary is weak, prioritize boundary & implementation questions (70% weak, 30% reinforcement)
  if (isBoundaryWeak || (!isImplementationWeak && !isAlgorithmWeak)) {
    // 4 Boundary questions (Weak focus - 50%)
    BINARY_SEARCH_QUESTION_BANK[4].questions.forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: boundaryConcept.id,
        conceptTitle: boundaryConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    // 2 Implementation questions (Secondary focus - 25%)
    BINARY_SEARCH_QUESTION_BANK[3].questions.forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: implementConcept.id,
        conceptTitle: implementConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    // 1 Algorithm question (Reinforcement)
    questions.push({
      id: `q${qCounter++}`,
      conceptId: algorithmConcept.id,
      conceptTitle: algorithmConcept.title,
      type: 'multiple_choice',
      ...BINARY_SEARCH_QUESTION_BANK[2].questions[0],
    });

    // 1 Complexity question (Reinforcement)
    questions.push({
      id: `q${qCounter++}`,
      conceptId: complexityConcept.id,
      conceptTitle: complexityConcept.title,
      type: 'multiple_choice',
      ...BINARY_SEARCH_QUESTION_BANK[5].questions[0],
    });
  } else if (isImplementationWeak) {
    // 2 Implementation questions (Focus)
    BINARY_SEARCH_QUESTION_BANK[3].questions.forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: implementConcept.id,
        conceptTitle: implementConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    // 2 Boundary questions
    BINARY_SEARCH_QUESTION_BANK[4].questions.slice(0, 2).forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: boundaryConcept.id,
        conceptTitle: boundaryConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    // 2 Algorithm questions
    BINARY_SEARCH_QUESTION_BANK[2].questions.forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: algorithmConcept.id,
        conceptTitle: algorithmConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    // 1 Basics question
    questions.push({
      id: `q${qCounter++}`,
      conceptId: basicsConcept.id,
      conceptTitle: basicsConcept.title,
      type: 'multiple_choice',
      ...BINARY_SEARCH_QUESTION_BANK[0].questions[0],
    });

    // 1 Complexity question
    questions.push({
      id: `q${qCounter++}`,
      conceptId: complexityConcept.id,
      conceptTitle: complexityConcept.title,
      type: 'multiple_choice',
      ...BINARY_SEARCH_QUESTION_BANK[5].questions[0],
    });
  } else {
    // Balanced distribution targeting weak concepts (Total 8 questions)
    // 1 from each of the 6 concepts
    BINARY_SEARCH_QUESTION_BANK.forEach((group, gIdx) => {
      const c = conceptsList[gIdx] || { id: gIdx + 1, title: 'Concept ' + (gIdx + 1) };
      if (group.questions[0]) {
        questions.push({
          id: `q${qCounter++}`,
          conceptId: c.id,
          conceptTitle: c.title,
          type: 'multiple_choice',
          ...group.questions[0],
        });
      }
    });

    // Plus 2 additional targeted questions from Boundary / Implementation
    if (BINARY_SEARCH_QUESTION_BANK[4].questions[1]) {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: boundaryConcept.id,
        conceptTitle: boundaryConcept.title,
        type: 'multiple_choice',
        ...BINARY_SEARCH_QUESTION_BANK[4].questions[1],
      });
    }
    if (BINARY_SEARCH_QUESTION_BANK[3].questions[1]) {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: implementConcept.id,
        conceptTitle: implementConcept.title,
        type: 'multiple_choice',
        ...BINARY_SEARCH_QUESTION_BANK[3].questions[1],
      });
    }
  }

  // Ensure exactly 8 questions
  const finalQuestions = questions.slice(0, 8);

  const focusTitle = snapshot.weakConcepts?.[0]?.conceptTitle || (isBoundaryWeak ? 'Boundary Conditions and Edge Cases' : 'Implementation');

  return {
    topic: 'Binary Search',
    title: `Personalized Binary Search Practice`,
    description: `Personalized 8-question practice set based on your completed learning session. Focus area: ${focusTitle}.`,
    difficulty: snapshot.difficulty || 'developing',
    sessionMastery: snapshot.overallMastery || 71,
    focusConcepts: snapshot.weakConcepts && snapshot.weakConcepts.length > 0 ? snapshot.weakConcepts : [
      { conceptId: boundaryConcept.id, conceptTitle: boundaryConcept.title, mastery: 43 }
    ],
    strongConcepts: snapshot.strongConcepts && snapshot.strongConcepts.length > 0 ? snapshot.strongConcepts : [
      { conceptId: basicsConcept.id, conceptTitle: basicsConcept.title, mastery: 91 }
    ],
    questions: finalQuestions,
  };
}

// ─── Evaluation Functions ────────────────────────────────────────────────────

/**
 * Evaluate a checkpoint answer using keyword matching.
 * Returns: { score, isCorrect, feedback, masteryLevel }
 */
function evaluateCheckpoint(answer, expectedKeywords) {
  const PASS_SCORE = parseInt(process.env.CHECKPOINT_PASS_SCORE || '60', 10);

  if (!answer || answer.trim().length === 0) {
    return { score: 0, isCorrect: false, feedback: 'Please provide an answer.', masteryLevel: 'needs_improvement' };
  }

  if (answer.trim().split(/\s+/).length < 3) {
    return { score: 20, isCorrect: false, feedback: 'Your answer is too short. Please explain your thinking in a full sentence.', masteryLevel: 'needs_improvement' };
  }

  const ansLower = answer.toLowerCase();

  if (!expectedKeywords || expectedKeywords.length === 0) {
    return { score: 80, isCorrect: true, feedback: 'Good effort! Continue to the next concept.', masteryLevel: 'good_understanding' };
  }

  let matchCount = 0;
  for (const kw of expectedKeywords) {
    if (ansLower.includes(kw.toLowerCase())) {
      matchCount++;
    }
  }

  const ratio = matchCount / expectedKeywords.length;
  let score, feedback, masteryLevel;

  const words = answer.trim().split(/\s+/);
  if (ratio >= 0.25 || matchCount >= 2 || (matchCount >= 1 && words.length >= 6)) {
    score = Math.min(100, Math.round(60 + Math.max(ratio, 0.25) * 40));
    isCorrectVal = score >= PASS_SCORE;
    masteryLevel = score >= 80 ? 'strong_understanding' : 'good_understanding';
    feedback = score >= 90
      ? 'Excellent! You covered all the key points.'
      : 'Great answer! You got the main idea. Keep going!';
  } else if (matchCount === 1) {
    score = 50;
    isCorrectVal = false;
    masteryLevel = 'developing';
    feedback = "You're on the right track! Think about the specific mechanism — why does this work?";
  } else {
    score = 20;
    isCorrectVal = false;
    masteryLevel = 'needs_improvement';
    feedback = 'Not quite. Review the concept explanation and focus on the key terms highlighted there.';
  }

  return { score, isCorrect: isCorrectVal, feedback, masteryLevel };
}

/**
 * Answer a doubt about Binary Search using keyword matching.
 * Returns a string answer or null if no match.
 */
function evaluateDoubt(question) {
  if (!question || typeof question !== 'string') return null;
  const qLower = question.toLowerCase();
  for (const response of binarySearchData.doubtResponses) {
    if (response.keywords.some((kw) => qLower.includes(kw.toLowerCase()))) {
      return response.answer;
    }
  }
  return null;
}

/**
 * Evaluate an assignment submission.
 * Returns: { score, feedback }
 */
function evaluateAssignment(submission) {
  if (!submission || submission.trim().length < 50) {
    return { score: 30, feedback: 'Your submission is very short. Make sure to complete all tasks.' };
  }
  const sub = submission.toLowerCase();
  let score = 50;
  const feedbackPoints = [];

  if (sub.includes('while') && (sub.includes('left') || sub.includes('right') || sub.includes('low') || sub.includes('high'))) {
    score += 20;
    feedbackPoints.push('✓ Binary search implementation looks complete.');
  }
  if (sub.includes('first') || sub.includes('right = mid - 1') || sub.includes('high = mid - 1') || sub.includes('return mid')) {
    score += 15;
    feedbackPoints.push('✓ Search modification / target match logic is present.');
  }
  if (sub.includes('log n') || sub.includes('halv') || sub.includes('half') || sub.includes('divide')) {
    score += 15;
    feedbackPoints.push('✓ Complexity explanation or divide-and-conquer logic recognized.');
  }

  score = Math.min(100, score);
  const feedback = feedbackPoints.length > 0
    ? feedbackPoints.join(' ') + (score < 80 ? ' Review boundary conditions for find_first_occurrence.' : ' Excellent work!')
    : 'Partial submission detected. Ensure you completed all tasks with working code and explanation.';

  return { score, feedback };
}

module.exports = {
  binarySearchData,
  evaluateCheckpoint,
  evaluateDoubt,
  evaluateAssignment,
  generatePrebuiltBinarySearchAssignment,
  PASS_SCORE,
};

