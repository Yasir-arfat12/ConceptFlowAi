/**
 * Prebuilt Stack learning path.
 * Deterministic offline data — works without external AI API dependencies.
 * Contains 6 progressive concepts, rich examples, checkpoints with expectedKeywords,
 * contextual doubt fallbacks, and quiz questions.
 */

const PASS_SCORE = parseInt(process.env.CHECKPOINT_PASS_SCORE || '60', 10);

const stackData = {
  topic: 'Stack',
  category: 'Data Structures',
  description: 'Master the Last-In-First-Out (LIFO) data structure, core push/pop/peek operations, memory stack frames, expression parsing, and algorithmic problem solving.',

  concepts: [
    {
      title: 'Stack Fundamentals & LIFO Principle',
      content: `A Stack is a linear data structure that follows the strict Last-In, First-Out (LIFO) principle (also known as First-In, Last-Out or FILO).

In a stack, elements are added and removed exclusively from one end, designated as the **top** of the stack. The opposite end is called the **base** or bottom.

Think of a real-world stack of dinner plates in a cafeteria:
1. You place new plates on top of the pile.
2. When someone takes a plate, they take the one on top (the most recently placed plate).
3. You cannot safely remove a plate from the bottom or middle without first removing all plates above it.

This structural constraint makes the stack ideal for tracking history, reversing sequences, maintaining active execution contexts, and matching paired tokens.`,
      examples: `Visualizing a Stack:

        +-------+
  TOP ->|   30  |  <-- Most recently pushed (will be popped first)
        +-------+
        |   20  |
        +-------+
        |   10  |  <-- Base of the stack (first inserted, popped last)
        +-------+

State after operations:
1. push(10)  -> Stack: [10] (top is 10)
2. push(20)  -> Stack: [10, 20] (top is 20)
3. push(30)  -> Stack: [10, 20, 30] (top is 30)
4. pop()     -> Returns 30. Stack becomes [10, 20] (top is 20)`,
      keyTakeaways: `• Stack is a linear collection governed by the LIFO (Last-In, First-Out) rule.
• All insertions and deletions take place at a single location called TOP.
• Access to arbitrary interior elements is prohibited without popping elements above.
• Standard operations provide O(1) constant time efficiency.`,
      checkpoint: {
        question: 'What fundamental principle does a Stack follow, and from which position are elements added and removed?',
        expectedKeywords: ['LIFO', 'last in', 'first out', 'top', 'same end', 'only top'],
      },
    },

    {
      title: 'Core Stack Operations: Push, Pop, Peek, and IsEmpty',
      content: `Every standard stack implementation provides four primary operations, all executing in O(1) constant time:

1. **push(item)**: Adds a new element onto the top of the stack.
   - If the stack has a fixed capacity and is already full, attempting to push causes a Stack Overflow error.

2. **pop()**: Removes and returns the element currently at the top of the stack.
   - If the stack is empty, attempting to pop causes a Stack Underflow error.

3. **peek()** (or top()): Returns the value of the top element without removing it.
   - Useful when inspecting the next candidate item before deciding whether to pop.

4. **isEmpty()**: Returns a boolean (true or false) indicating whether the stack contains zero elements. Useful for boundary conditions before calling pop().

5. **size()**: Returns the current number of elements in the stack.`,
      examples: `Step-by-step Operation Trace:

let s = new Stack();      // []
s.push(10);               // [10] (top: 10)
s.push(20);               // [10, 20] (top: 20)
s.push(30);               // [10, 20, 30] (top: 30)

console.log(s.peek());    // Prints 30 (stack remains [10, 20, 30])
console.log(s.pop());     // Prints 30 (stack is now [10, 20])
console.log(s.pop());     // Prints 20 (stack is now [10])
console.log(s.isEmpty()); // Prints false
console.log(s.pop());     // Prints 10 (stack is now [])
console.log(s.isEmpty()); // Prints true`,
      keyTakeaways: `• push() adds to top in O(1) time.
• pop() removes from top in O(1) time.
• peek() inspects the top item without mutating state in O(1) time.
• Always guard pop() and peek() with isEmpty() checks to avoid underflow exceptions.`,
      checkpoint: {
        question: 'If a stack contains [10, 20, 30] where 30 is at the top, what does peek() return versus what does pop() return, and what will the stack contain afterwards?',
        expectedKeywords: ['30', 'peek', 'pop', '10, 20', 'removes', 'without removing', 'remains'],
      },
    },

    {
      title: 'Stack Implementation: Array vs Linked List',
      content: `A stack can be constructed using either a contiguous Array or a Singly Linked List.

1. **Array-Based Stack**:
   - Push appends to the end of the array (e.g., array.push(x)) in amortized O(1) time.
   - Pop removes from the end (e.g., array.pop()) in O(1) time.
   - Peek inspects array[array.length - 1] in O(1) time.
   - Advantage: Excellent CPU cache locality and minimal memory overhead per element.
   - Disadvantage: Dynamic arrays occasionally resize (O(n) worst-case spike).

2. **Linked-List-Based Stack**:
   - Head node represents the TOP of the stack.
   - Push creates a new node and sets new_node.next = head, then head = new_node (O(1) strictly).
   - Pop sets head = head.next and returns previous head value (O(1) strictly).
   - Advantage: Never requires reallocation or resizing arrays.
   - Disadvantage: Extra pointer memory per node and poorer cache performance.`,
      examples: `JavaScript Class Implementation (Array-backed):

class Stack {
  constructor() {
    this.items = [];
  }
  push(element) {
    this.items.push(element);
  }
  pop() {
    if (this.isEmpty()) throw new Error("Stack Underflow");
    return this.items.pop();
  }
  peek() {
    if (this.isEmpty()) return null;
    return this.items[this.items.length - 1];
  }
  isEmpty() {
    return this.items.length === 0;
  }
  size() {
    return this.items.length;
  }
}`,
      keyTakeaways: `• Array implementation uses the end of the array as TOP to avoid O(n) element shifts.
• Linked list implementation uses HEAD as TOP for O(1) insertion/removal.
• Both implementations achieve O(1) time for push, pop, and peek.`,
      checkpoint: {
        question: 'Why do array-based stack implementations treat the end of the array as the top rather than index 0?',
        expectedKeywords: ['O(1)', 'O(n)', 'shift', 'index 0', 'end', 'efficient', 'move elements', 'constant time'],
      },
    },

    {
      title: 'Practical Applications of Stacks',
      content: `Stacks are fundamental to computer systems and software engineering algorithms:

1. **Function Call Stack & Recursion**:
   - Every time a function is invoked, an activation record (stack frame) with local variables and return address is pushed onto the system call stack.
   - When the function finishes, its frame is popped, returning execution control to the caller.

2. **Undo / Redo Mechanisms**:
   - Text editors push each typed action or state onto an Undo stack.
   - Pressing Undo pops the last action and pushes it onto a Redo stack.

3. **Browser History Navigation**:
   - The Back button pops previous URLs from a history stack.

4. **Balanced Parentheses & Syntax Verification**:
   - Compilers verify brackets like (), {}, and [] by pushing opening brackets and popping them when a matching closing bracket is encountered.

5. **Expression Evaluation & Conversion**:
   - Infix to Postfix (Reverse Polish Notation) conversion and postfix arithmetic calculation (Dijkstra Shunting-Yard algorithm).

6. **Graph Depth-First Search (DFS)**:
   - Iterative DFS utilizes an explicit stack to backtrack through visited vertices.`,
      examples: `Algorithm: Balanced Parentheses Check

function isValidParentheses(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };

  for (let char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else if (map[char]) {
      if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    }
  }
  return stack.length === 0;
}

// Trace for "{[()]}":
// 1. push '{' -> ['{']
// 2. push '[' -> ['{', '[']
// 3. push '(' -> ['{', '[', '(']
// 4. ')' matches pop '(' -> ['{', '[']
// 5. ']' matches pop '[' -> ['{']
// 6. '}' matches pop '{' -> [] -> valid!`,
      keyTakeaways: `• Stacks naturally model nested and reverse-chronological problem domains.
• Call stacks handle recursive execution and local variable scope.
• Balanced delimiters can be validated in O(n) time and O(n) space using a single stack.`,
      checkpoint: {
        question: 'Explain how a stack is used to verify whether a string containing parentheses like {[()]} is balanced.',
        expectedKeywords: ['open', 'push', 'closing', 'pop', 'match', 'empty', 'balanced', 'bracket'],
      },
    },

    {
      title: 'Monotonic Stacks and Classic Problems',
      content: `A **Monotonic Stack** is a specialized stack pattern where elements are strictly kept in either monotonically increasing or decreasing order.

Whenever a new element violates the monotonicity condition:
- Existing elements are repeatedly popped until the invariant is restored.
- The popped elements process their "Next Greater Element" or boundary limits.

Classic Stack Algorithmic Patterns:
1. **Next Greater Element**: Find the first element to the right that is strictly larger than nums[i] in O(n) total time.
2. **Daily Temperatures**: Calculate how many days to wait until a warmer temperature occurs.
3. **Largest Rectangle in Histogram**: Calculate the maximum rectangular area formed by contiguous histogram bars in linear O(n) time.
4. **Min Stack**: Design a stack that supports push, pop, top, and retrieving the minimum element in O(1) constant time (by keeping a secondary stack of minimums).`,
      examples: `MinStack with O(1) getMin():

class MinStack {
  constructor() {
    this.stack = [];
    this.minStack = [];
  }
  push(val) {
    this.stack.push(val);
    if (this.minStack.length === 0 || val <= this.minStack[this.minStack.length - 1]) {
      this.minStack.push(val);
    }
  }
  pop() {
    const val = this.stack.pop();
    if (val === this.minStack[this.minStack.length - 1]) {
      this.minStack.pop();
    }
    return val;
  }
  getMin() {
    return this.minStack[this.minStack.length - 1];
  }
}`,
      keyTakeaways: `• Monotonic stacks optimize brute-force O(n^2) nested loops into linear O(n) time.
• Each element is pushed and popped at most once across the entire iteration.
• MinStack achieves O(1) retrieval using auxiliary minimum tracking.`,
      checkpoint: {
        question: 'In the Next Greater Element problem, why does using a stack reduce the time complexity from O(n^2) to O(n)?',
        expectedKeywords: ['pushed once', 'popped once', 'linear', 'O(n)', 'monotonic', 'each element', 'at most once'],
      },
    },

    {
      title: 'Time & Space Complexity Summary and Edge Cases',
      content: `Understanding stack complexity profiles and edge case boundaries is essential for engineering interviews and production reliability:

**Complexity Profile:**
- **push()**: O(1) time complexity (amortized O(1) with dynamic arrays).
- **pop()**: O(1) time complexity.
- **peek()**: O(1) time complexity.
- **Search (finding a specific element)**: O(n) time complexity (must pop or traverse).
- **Space Complexity**: O(n) to store n elements.

**Critical Edge Cases to Test:**
1. **Empty Stack Operations**: Calling pop() or peek() on an empty stack (Stack Underflow). Always verify isEmpty() first.
2. **Single Element Stack**: Popping when size === 1 transitions the stack to empty; verify pointers/indices reset cleanly.
3. **Capacity Constraints**: Fixed-size arrays reaching limit (Stack Overflow).
4. **Unmatched Closing or Opening Tokens**: Ensure strings with leftover opening brackets (like "((()") return false because stack.isEmpty() === false at the end.`,
      examples: `Complexity Cheat Sheet:

+---------------+-----------------+------------------+
| Operation     | Time Complexity | Space Complexity |
+---------------+-----------------+------------------+
| Push          | O(1)            | O(1)             |
| Pop           | O(1)            | O(1)             |
| Peek / Top    | O(1)            | O(1)             |
| Search / Find | O(n)            | O(n)             |
| Total Stack   | -               | O(n)             |
+---------------+-----------------+------------------+`,
      keyTakeaways: `• All core stack operations (push, pop, peek, isEmpty) are O(1) constant time.
• Stack search is O(n) because random indexing is not permitted by definition.
• Always guard against Stack Underflow on empty collections.`,
      checkpoint: {
        question: 'What is the time complexity of push, pop, and peek operations on a stack, and why is searching for an arbitrary value O(n)?',
        expectedKeywords: ['O(1)', 'constant', 'O(n)', 'linear', 'traverse', 'pop', 'no random access', 'inspect each'],
      },
    },
  ],

  doubts: [
    {
      keywords: ['lifo', 'why lifo', 'last in', 'principle'],
      answer: 'A Stack uses LIFO (Last-In, First-Out) because elements can only be inserted and removed from the TOP. The most recently added item sits on top and blocks access to the items beneath it until it is removed, making it the first one to exit.',
    },
    {
      keywords: ['difference between pop and peek', 'pop vs peek', 'peek vs pop', 'what is peek'],
      answer: 'The key difference is state mutation: `pop()` removes and returns the top element from the stack (modifying the stack size), whereas `peek()` only reads and returns the top element without removing it or altering the stack state.',
    },
    {
      keywords: ['why is push o(1)', 'push complexity', 'push time', 'push constant'],
      answer: '`push()` is O(1) constant time because elements are always added directly at the top. It does not require shifting any existing elements or iterating through the collection. In linked-list implementations, it simply repoints head; in arrays, it inserts at the tail index.',
    },
    {
      keywords: ['recursion', 'call stack', 'how stacks used in recursion', 'recursive'],
      answer: 'When a function calls itself recursively, the runtime pushes a new stack frame onto the Call Stack containing the function arguments, local variables, and return address. When the base case is reached, the frames are popped in reverse order (LIFO), returning values step-by-step.',
    },
    {
      keywords: ['parentheses', 'balanced', 'brackets', 'balanced parentheses'],
      answer: 'When checking balanced parentheses, an opening bracket (`(`, `{`, `[`) is pushed onto the stack. When a closing bracket is encountered, the stack pops the top item to check if it is the matching pair. If it matches, we continue; if not or if the stack is empty, the string is unbalanced. At the end, an empty stack confirms balance.',
    },
    {
      keywords: ['underflow', 'overflow', 'stack overflow', 'stack underflow'],
      answer: 'Stack Overflow occurs when you attempt to `push()` an element onto a fixed-size stack that is already full (or when infinite recursion exceeds the call stack memory limit). Stack Underflow occurs when you attempt to `pop()` or `peek()` on an empty stack.',
    },
  ],

  // Prebuilt quiz (10 structured questions mapped across all 6 concepts)
  quiz: {
    title: 'Stack Mastery Assessment',
    questions: [
      {
        id: 'stk_q1',
        conceptIndex: 1,
        conceptTitle: 'Stack Fundamentals & LIFO Principle',
        type: 'single_select',
        question: 'Which principle governs the order of insertion and deletion in a Stack?',
        options: [
          { value: 'A', label: 'FIFO (First-In, First-Out)', feedback: 'FIFO is the principle followed by Queues, not Stacks.' },
          { value: 'B', label: 'LIFO (Last-In, First-Out)', feedback: 'Correct! Stacks strictly follow LIFO where the newest element is the first one removed.' },
          { value: 'C', label: 'Random Access by index', feedback: 'Stacks do not permit arbitrary index access.' },
          { value: 'D', label: 'Priority-based extraction', feedback: 'Priority queues use priority ordering, whereas stacks use insertion recency.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Stacks strictly enforce Last-In, First-Out (LIFO) semantics, where all push and pop operations occur at the TOP of the structure.',
        hint: 'Think about a stack of cafeteria plates — which one is removed first?',
      },
      {
        id: 'stk_q2',
        conceptIndex: 2,
        conceptTitle: 'Core Stack Operations: Push, Pop, Peek, and IsEmpty',
        type: 'single_select',
        question: 'What is the time complexity of the pop() operation on an efficient stack?',
        options: [
          { value: 'A', label: 'O(n)', feedback: 'Pop does not require iterating through elements.' },
          { value: 'B', label: 'O(log n)', feedback: 'Logarithmic time is for divide-and-conquer structures, not stacks.' },
          { value: 'C', label: 'O(1) constant time', feedback: 'Correct! Removing from the top executes in O(1) constant time.' },
          { value: 'D', label: 'O(n log n)', feedback: 'Linearithmic time is for sorting algorithms.' },
        ],
        correctAnswer: 'C',
        correctOptionIndex: 2,
        explanation: 'Because push and pop only touch the topmost element, they run in O(1) constant time without shifting elements.',
        hint: 'Does pop() need to inspect other elements in the stack?',
      },
      {
        id: 'stk_q3',
        conceptIndex: 2,
        conceptTitle: 'Core Stack Operations: Push, Pop, Peek, and IsEmpty',
        type: 'single_select',
        question: 'Given an empty stack, the following operations are executed: push(5), push(10), pop(), push(15), peek(). What is the returned value?',
        options: [
          { value: 'A', label: '5', feedback: '5 is at the base of the stack, not the top.' },
          { value: 'B', label: '10', feedback: '10 was removed by the pop() operation.' },
          { value: 'C', label: '15', feedback: 'Correct! After popping 10 and pushing 15, peek() reads the top element which is 15.' },
          { value: 'D', label: 'null / undefined', feedback: 'The stack currently contains [5, 15], so peek() returns 15.' },
        ],
        correctAnswer: 'C',
        correctOptionIndex: 2,
        explanation: 'push(5)->[5], push(10)->[5,10], pop()->returns 10 leaving [5], push(15)->[5,15], peek()->returns 15 without removing it.',
        hint: 'Trace the stack state step-by-step.',
      },
      {
        id: 'stk_q4',
        conceptIndex: 2,
        conceptTitle: 'Core Stack Operations: Push, Pop, Peek, and IsEmpty',
        type: 'single_select',
        question: 'What is the key functional difference between `pop()` and `peek()`?',
        options: [
          { value: 'A', label: 'pop() returns the bottom element while peek() returns the top', feedback: 'Both access the top element.' },
          { value: 'B', label: 'pop() removes the top element while peek() inspects it without removal', feedback: 'Correct! pop() modifies stack state by removing the top item; peek() is a non-destructive read.' },
          { value: 'C', label: 'peek() takes O(n) time while pop() takes O(1) time', feedback: 'Both operations run in O(1) time.' },
          { value: 'D', label: 'pop() only works on numbers while peek() works on any data type', feedback: 'Both work on any data type.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: '`pop()` mutates the stack by removing the top element. `peek()` is a read-only operation that inspects the top element without removing it.',
        hint: 'Consider whether the stack size changes after calling each function.',
      },
      {
        id: 'stk_q5',
        conceptIndex: 3,
        conceptTitle: 'Stack Implementation: Array vs Linked List',
        type: 'single_select',
        question: 'When implementing a Stack using a Singly Linked List, which end should serve as the Stack TOP for O(1) operations?',
        options: [
          { value: 'A', label: 'The Head of the linked list', feedback: 'Correct! Inserting and removing at the head takes O(1) constant time without traversal.' },
          { value: 'B', label: 'The Tail of the singly linked list (without tail pointer)', feedback: 'Deleting from the tail of a singly linked list requires O(n) traversal to find the second-to-last node.' },
          { value: 'C', label: 'The Middle node', feedback: 'Finding the middle node takes O(n) time.' },
          { value: 'D', label: 'Any arbitrary node chosen at random', feedback: 'A stack must have a single consistent top pointer.' },
        ],
        correctAnswer: 'A',
        correctOptionIndex: 0,
        explanation: 'In a singly linked list, prepending a node at the head (`newNode.next = head; head = newNode`) and popping the head (`head = head.next`) both take O(1) time.',
        hint: 'Which end of a singly linked list allows O(1) insertion and O(1) deletion without back-pointers?',
      },
      {
        id: 'stk_q6',
        conceptIndex: 4,
        conceptTitle: 'The Call Stack and Recursion Mechanics',
        type: 'single_select',
        question: 'What happens in memory when a recursive function fails to hit its base case?',
        options: [
          { value: 'A', label: 'Memory is automatically garbage collected and returns null', feedback: 'Unbounded recursive frames consume memory until capacity is exhausted.' },
          { value: 'B', label: 'A Stack Overflow exception is thrown as the Call Stack exceeds its allocated memory limit', feedback: 'Correct! Each recursive invocation pushes a new stack frame until stack memory is exhausted.' },
          { value: 'C', label: 'The function automatically switches to iterative execution', feedback: 'Runtimes cannot convert infinite recursion to iteration automatically.' },
          { value: 'D', label: 'A Stack Underflow exception occurs', feedback: 'Stack underflow happens when popping from an empty stack, not pushing infinitely.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Each function call pushes a stack frame (parameters, local variables, return address). Without a base case, recursive calls consume all available call stack memory, triggering a Stack Overflow.',
        hint: 'Think about what error name is given to excessive nested function calls.',
      },
      {
        id: 'stk_q7',
        conceptIndex: 5,
        conceptTitle: 'Expression Evaluation & Syntax Parsing (Balanced Parentheses)',
        type: 'single_select',
        question: 'When checking if a string containing parentheses `{[()]}` is valid, what action is taken when encountering a closing bracket `]`?',
        options: [
          { value: 'A', label: 'Push the closing bracket onto the stack', feedback: 'Closing brackets are compared against the stack top, not pushed.' },
          { value: 'B', label: 'Pop the top element from the stack and verify it is the matching opening bracket `[`', feedback: 'Correct! The most recently opened bracket must match the current closing bracket.' },
          { value: 'C', label: 'Clear the entire stack immediately', feedback: 'Clearing the stack would lose track of outer matching brackets.' },
          { value: 'D', label: 'Reverse the remaining characters in the string', feedback: 'Reversing is not part of the standard balanced bracket algorithm.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'When a closing bracket is seen, we pop the top of the stack. If the stack is empty or the popped bracket does not match the corresponding opening type, the string is invalid.',
        hint: 'What does LIFO order tell us about the most recently opened bracket?',
      },
      {
        id: 'stk_q8',
        conceptIndex: 5,
        conceptTitle: 'Expression Evaluation & Syntax Parsing (Balanced Parentheses)',
        type: 'single_select',
        question: 'Why does evaluating Postfix (Reverse Polish) notation like `[3, 4, +, 2, *]` use a Stack?',
        options: [
          { value: 'A', label: 'Operands are pushed onto the stack, and operators pop the two most recent operands to compute the result', feedback: 'Correct! Postfix operators apply immediately to the two preceding operands stored on the stack top.' },
          { value: 'B', label: 'Operators are stored in sorted alphabetical order', feedback: 'Postfix evaluates in the order tokens appear.' },
          { value: 'C', label: 'It eliminates the need for any arithmetic operations', feedback: 'The arithmetic operations are performed when operators are encountered.' },
          { value: 'D', label: 'It prevents using memory registers', feedback: 'Stacks utilize memory efficiently to hold intermediate values.' },
        ],
        correctAnswer: 'A',
        correctOptionIndex: 0,
        explanation: 'In postfix notation, numbers are pushed onto the stack. When an operator (+, -, *, /) appears, the top two numbers are popped, the operation is applied, and the result is pushed back.',
        hint: 'How are operands retrieved when an operator is encountered?',
      },
      {
        id: 'stk_q9',
        conceptIndex: 6,
        conceptTitle: 'Monotonic Stack & Algorithmic Applications',
        type: 'single_select',
        question: 'What is a Monotonic Decreasing Stack used for in algorithmic problem solving?',
        options: [
          { value: 'A', label: 'Finding the Next Greater Element for each item in an array in O(n) total time', feedback: 'Correct! Maintaining elements in decreasing order allows resolving the next greater element in linear time.' },
          { value: 'B', label: 'Sorting an array in O(1) time', feedback: 'Comparison-based sorting requires at least O(n log n) time.' },
          { value: 'C', label: 'Binary searching an unsorted array', feedback: 'Monotonic stacks are used for nearest neighbor queries, not binary search.' },
          { value: 'D', label: 'Replacing heap memory with global variables', feedback: 'Monotonic stacks are algorithmic data structures, not memory managers.' },
        ],
        correctAnswer: 'A',
        correctOptionIndex: 0,
        explanation: 'A monotonic decreasing stack keeps elements in descending order. When an incoming element is larger than the stack top, it pops smaller elements and serves as their Next Greater Element, achieving O(n) overall complexity.',
        hint: 'Think about how Next Greater Element problems achieve O(n) instead of O(n^2).',
      },
      {
        id: 'stk_q10',
        conceptIndex: 2,
        conceptTitle: 'Core Stack Operations: Push, Pop, Peek, and IsEmpty',
        type: 'single_select',
        question: 'What exception occurs if a program attempts to `pop()` from a stack with zero elements?',
        options: [
          { value: 'A', label: 'Stack Overflow', feedback: 'Stack overflow occurs when pushing to a full capacity stack.' },
          { value: 'B', label: 'Stack Underflow', feedback: 'Correct! Attempting to pop or peek an empty stack triggers a stack underflow.' },
          { value: 'C', label: 'Segmentation Fault', feedback: 'In managed runtimes, it raises an Underflow or EmptyStackException.' },
          { value: 'D', label: 'Deadlock', feedback: 'Deadlock is a concurrency issue with locks.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Stack Underflow occurs when an extraction operation (`pop()` or `peek()`) is attempted on a stack that contains no elements.',
        hint: 'The opposite of overflow is underflow.',
      },
    ],
  },

  assignment: {
    title: 'Stack Mastery Assignment',
    description: 'Targeted practice questions focusing on LIFO principles, stack implementation, balanced parentheses, and monotonic stack patterns.',
    difficulty: 'developing',
  },
};

// ─── Prebuilt Question Bank for Stack Concepts ───────────────────────────────
const STACK_QUESTION_BANK = [
  // Concept 1: Stack Fundamentals & LIFO Principle
  {
    conceptTitleMatch: 'fundamentals',
    fallbackIndex: 0,
    questions: [
      {
        question: 'Why is a stack considered a restricted data structure compared to an array?',
        options: [
          { value: 'A', label: 'Because elements can only be added and removed from the TOP, preventing arbitrary index access.' },
          { value: 'B', label: 'Because stacks can only store integer numbers.' },
          { value: 'C', label: 'Because stacks require specialized hardware.' },
          { value: 'D', label: 'Because stacks cannot be resized dynamically.' }
        ],
        correctAnswer: 'A',
        explanation: 'Arrays allow random access to any index in O(1) time (`arr[i]`). A stack deliberately restricts access so that only the top element can be inspected or removed, enforcing LIFO discipline.',
        hint: 'Consider whether you can access `stack[3]` directly without popping.'
      },
      {
        question: 'If elements [A, B, C, D] are pushed onto a stack in that order, what is the exact order they will be popped?',
        options: [
          { value: 'A', label: 'D, C, B, A' },
          { value: 'B', label: 'A, B, C, D' },
          { value: 'C', label: 'A, C, B, D' },
          { value: 'D', label: 'B, A, D, C' }
        ],
        correctAnswer: 'A',
        explanation: 'Since D was the last element pushed, it is at the top and will be popped first. The full pop sequence reverses the insertion order: D, C, B, A.',
        hint: 'Last-In, First-Out reverses the order of elements.'
      }
    ]
  },

  // Concept 2: Core Stack Operations: Push, Pop, Peek, and IsEmpty
  {
    conceptTitleMatch: 'operations',
    fallbackIndex: 1,
    questions: [
      {
        question: 'What is the return value and stack state after: `let s = []; s.push(1); s.push(2); s.pop(); s.push(3); s.push(4); s.pop(); s.peek()`?',
        options: [
          { value: 'A', label: 'peek() returns 3; stack contains [1, 3]' },
          { value: 'B', label: 'peek() returns 4; stack contains [1, 2, 3, 4]' },
          { value: 'C', label: 'peek() returns 1; stack contains [1]' },
          { value: 'D', label: 'peek() returns 2; stack contains [2, 3]' }
        ],
        correctAnswer: 'A',
        explanation: 'Trace: push(1)->[1], push(2)->[1,2], pop()->returns 2 leaving [1], push(3)->[1,3], push(4)->[1,3,4], pop()->returns 4 leaving [1,3], peek()->returns 3.',
        hint: 'Step through each push and pop sequentially.'
      },
      {
        question: 'Why should `isEmpty()` always be called before executing `pop()` in production code?',
        options: [
          { value: 'A', label: 'To prevent Stack Underflow errors or undefined index access on an empty structure.' },
          { value: 'B', label: 'To clear old data from memory.' },
          { value: 'C', label: 'To reset the stack capacity.' },
          { value: 'D', label: 'Because isEmpty() speeds up subsequent pop operations.' }
        ],
        correctAnswer: 'A',
        explanation: 'Attempting to pop an empty stack causes a Stack Underflow error or returns undefined/null, which can crash downstream code.',
        hint: 'What happens when you take an item from an empty container?'
      }
    ]
  },

  // Concept 3: Stack Implementation: Array vs Linked List
  {
    conceptTitleMatch: 'implementation',
    fallbackIndex: 2,
    questions: [
      {
        question: 'Why does an array-based stack use `array.push()` and `array.pop()` at the END of the array instead of `unshift()` and `shift()` at index 0?',
        options: [
          { value: 'A', label: 'Pushing/popping at the end takes O(1) amortized time, whereas index 0 takes O(n) due to shifting all remaining elements.' },
          { value: 'B', label: 'JavaScript does not support shifting at index 0.' },
          { value: 'C', label: 'The end of an array consumes less memory than index 0.' },
          { value: 'D', label: 'Index 0 is reserved for metadata.' }
        ],
        correctAnswer: 'A',
        explanation: 'Inserting or deleting at index 0 of an array requires shifting all n elements by one index, taking O(n) time. Appending/popping at the end takes O(1) time.',
        hint: 'Think about what happens to subsequent elements when index 0 is deleted from an array.'
      },
      {
        question: 'In a Linked List implementation of a Stack, what is the space complexity overhead per element?',
        options: [
          { value: 'A', label: 'O(1) extra space per node for the `next` pointer reference.' },
          { value: 'B', label: 'O(n) extra space per node.' },
          { value: 'C', label: 'Zero extra space.' },
          { value: 'D', label: 'O(log n) extra space.' }
        ],
        correctAnswer: 'A',
        explanation: 'Each linked list node stores the data value plus one pointer (`next`) pointing to the next node, adding O(1) pointer overhead per element.',
        hint: 'A linked list node contains two fields: value and next pointer.'
      }
    ]
  },

  // Concept 4: The Call Stack and Recursion Mechanics
  {
    conceptTitleMatch: 'call stack',
    fallbackIndex: 3,
    questions: [
      {
        question: 'What information is stored inside each stack frame on the program Call Stack?',
        options: [
          { value: 'A', label: 'Function arguments, local variables, and the return address to resume execution after return.' },
          { value: 'B', label: 'The entire source code of the application.' },
          { value: 'C', label: 'Global database records.' },
          { value: 'D', label: 'CSS styles and DOM nodes.' }
        ],
        correctAnswer: 'A',
        explanation: 'A call stack frame encapsulates the local execution context of an active function call, including parameter values, local variables, and the instruction pointer return address.',
        hint: 'What does a function need to resume after a sub-function finishes?'
      },
      {
        question: 'Why can any recursive algorithm be rewritten iteratively using an explicit Stack data structure?',
        options: [
          { value: 'A', label: 'Because the system Call Stack is fundamentally a stack; managing your own stack mimics runtime call frames manually.' },
          { value: 'B', label: 'Because recursion is always slower than loops.' },
          { value: 'C', label: 'Because compilers automatically delete recursion.' },
          { value: 'D', label: 'Because iterative algorithms use zero memory.' }
        ],
        correctAnswer: 'A',
        explanation: 'Recursion relies on the implicit system call stack. By instantiating an explicit `Stack` object on the heap, you can simulate function state transitions iteratively without call stack depth limits.',
        hint: 'What data structure is the runtime using to manage recursive function calls?'
      }
    ]
  },

  // Concept 5: Expression Evaluation & Syntax Parsing (Balanced Parentheses)
  {
    conceptTitleMatch: 'expression',
    fallbackIndex: 4,
    questions: [
      {
        question: 'Given the bracket string `"{[()]}"`, trace the stack state after processing the first 4 characters (`{`, `[`, `(`, `)`). What is the stack state?',
        options: [
          { value: 'A', label: 'Stack contains `[\'{\', \'[\']` because `(` was popped when `)` matched it.' },
          { value: 'B', label: 'Stack is completely empty.' },
          { value: 'C', label: 'Stack contains `[\'{\', \'[\', \'(\', \')\']`' },
          { value: 'D', label: 'Stack throws an error.' }
        ],
        correctAnswer: 'A',
        explanation: 'Characters 1-3 push `{`, `[`, `(`. Character 4 is `)`, which matches top `(`, popping it. The stack is left with `[\'{\', \'[\']`.',
        hint: 'Match the inner pair `()` and see what remains.'
      },
      {
        question: 'When evaluating postfix expression `[6, 2, \'/\', 3, \'+\']`, what is the final calculated result?',
        options: [
          { value: 'A', label: '6 (6 / 2 = 3, then 3 + 3 = 6)' },
          { value: 'B', label: '12' },
          { value: 'C', label: '5' },
          { value: 'D', label: '3' }
        ],
        correctAnswer: 'A',
        explanation: 'Push 6, push 2. See `/`: pop 2, pop 6, compute 6/2 = 3, push 3. Push 3. See `+`: pop 3, pop 3, compute 3+3 = 6, push 6. Final result is 6.',
        hint: 'Perform 6/2 first, then add 3.'
      }
    ]
  },

  // Concept 6: Monotonic Stack & Algorithmic Applications
  {
    conceptTitleMatch: 'monotonic',
    fallbackIndex: 5,
    questions: [
      {
        question: 'For array `[2, 1, 2, 4, 3]`, what is the Next Greater Element array computed using a monotonic stack?',
        options: [
          { value: 'A', label: '`[4, 2, 4, -1, -1]`' },
          { value: 'B', label: '`[4, 4, 4, 4, -1]`' },
          { value: 'C', label: '`[1, 2, 4, 3, -1]`' },
          { value: 'D', label: '`[-1, -1, -1, -1, -1]`' }
        ],
        correctAnswer: 'A',
        explanation: 'For 2: next greater is 4 (or next index 2 has 2 <= 2, next is 4). For 1: next greater is 2. For 2 (idx 2): next greater is 4. For 4: none (-1). For 3: none (-1). Result: `[4, 2, 4, -1, -1]`.',
        hint: 'For each element, look right for the first strictly greater element.'
      },
      {
        question: 'Why does a Monotonic Stack solve Next Greater Element in O(n) total time even though it contains nested while loops?',
        options: [
          { value: 'A', label: 'Because every element is pushed onto the stack exactly once and popped at most once across the entire algorithm (amortized O(1) per element).' },
          { value: 'B', label: 'Because the array is sorted before processing.' },
          { value: 'C', label: 'Because the stack uses multi-threading.' },
          { value: 'D', label: 'Because the loop terminates after 2 iterations.' }
        ],
        correctAnswer: 'A',
        explanation: 'Even with a nested while loop, each index enters the stack at most once and leaves at most once. Total push/pop operations across all n iterations is at most 2n, giving strictly O(n) total time complexity.',
        hint: 'Count the total number of push and pop operations across the entire array.'
      }
    ]
  }
];

/**
 * Deterministically generates a personalized 8-question assignment for Stack
 * weighted heavily towards the student\'s weakest concepts.
 */
function generatePrebuiltStackAssignment(conceptsList = [], weakConceptsList = [], snapshot = {}) {
  const getConcept = (matchStr, fallbackIdx) => {
    const found = (conceptsList || []).find((c) =>
      (c.title || '').toLowerCase().includes(matchStr.toLowerCase())
    );
    return found || conceptsList[fallbackIdx] || { id: fallbackIdx + 1, title: 'Stack Concept' };
  };

  const weakTitles = (weakConceptsList || []).map((w) => (w.title || w.conceptTitle || '').toLowerCase());
  const isExpressionWeak = weakTitles.some((t) => t.includes('expression') || t.includes('parentheses') || t.includes('parsing'));
  const isMonotonicWeak = weakTitles.some((t) => t.includes('monotonic') || t.includes('greater'));
  const isOperationsWeak = weakTitles.some((t) => t.includes('operations') || t.includes('push') || t.includes('pop'));

  const questions = [];
  let qCounter = 1;

  const fundamentalsConcept = getConcept('fundamentals', 0);
  const operationsConcept = getConcept('operations', 1);
  const implementationConcept = getConcept('implementation', 2);
  const callStackConcept = getConcept('call stack', 3);
  const expressionConcept = getConcept('expression', 4);
  const monotonicConcept = getConcept('monotonic', 5);

  if (isExpressionWeak || isMonotonicWeak) {
    // Heavy focus on Expression & Monotonic Stack
    STACK_QUESTION_BANK[4].questions.forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: expressionConcept.id,
        conceptTitle: expressionConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    STACK_QUESTION_BANK[5].questions.forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: monotonicConcept.id,
        conceptTitle: monotonicConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: operationsConcept.id,
      conceptTitle: operationsConcept.title,
      type: 'multiple_choice',
      ...STACK_QUESTION_BANK[1].questions[0],
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: implementationConcept.id,
      conceptTitle: implementationConcept.title,
      type: 'multiple_choice',
      ...STACK_QUESTION_BANK[2].questions[0],
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: callStackConcept.id,
      conceptTitle: callStackConcept.title,
      type: 'multiple_choice',
      ...STACK_QUESTION_BANK[3].questions[0],
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: fundamentalsConcept.id,
      conceptTitle: fundamentalsConcept.title,
      type: 'multiple_choice',
      ...STACK_QUESTION_BANK[0].questions[0],
    });
  } else {
    // Balanced distribution (1 from each of the 6 concepts + 2 targeted)
    STACK_QUESTION_BANK.forEach((group, gIdx) => {
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

    if (STACK_QUESTION_BANK[4].questions[1]) {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: expressionConcept.id,
        conceptTitle: expressionConcept.title,
        type: 'multiple_choice',
        ...STACK_QUESTION_BANK[4].questions[1],
      });
    }
    if (STACK_QUESTION_BANK[1].questions[1]) {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: operationsConcept.id,
        conceptTitle: operationsConcept.title,
        type: 'multiple_choice',
        ...STACK_QUESTION_BANK[1].questions[1],
      });
    }
  }

  const finalQuestions = questions.slice(0, 8);
  const focusTitle = snapshot.weakConcepts?.[0]?.conceptTitle || (isExpressionWeak ? 'Expression Evaluation & Parsing' : 'Stack Operations & LIFO Ordering');

  return {
    topic: 'Stack',
    title: 'Personalized Stack Practice',
    description: `Personalized 8-question practice set based on your completed learning session. Focus area: ${focusTitle}.`,
    difficulty: snapshot.difficulty || 'developing',
    sessionMastery: snapshot.overallMastery || 75,
    focusConcepts: snapshot.weakConcepts && snapshot.weakConcepts.length > 0 ? snapshot.weakConcepts : [
      { conceptId: expressionConcept.id, conceptTitle: expressionConcept.title, mastery: 50 }
    ],
    strongConcepts: snapshot.strongConcepts && snapshot.strongConcepts.length > 0 ? snapshot.strongConcepts : [
      { conceptId: fundamentalsConcept.id, conceptTitle: fundamentalsConcept.title, mastery: 90 }
    ],
    questions: finalQuestions,
  };
}

function gradeStackAnswer(checkpoint, answer) {
  if (!answer || typeof answer !== 'string') {
    return { isCorrect: false, score: 0, feedback: 'Please provide a written explanation.' };
  }

  const normalized = answer.toLowerCase();
  const keywords = checkpoint.expectedKeywords || [];
  let matches = 0;

  for (const kw of keywords) {
    if (normalized.includes(kw.toLowerCase())) {
      matches++;
    }
  }

  const total = keywords.length;
  const matchRatio = total > 0 ? matches / total : 0;
  const wordCount = answer.trim().split(/\s+/).length;

  let score = Math.round(matchRatio * 75);
  if (wordCount >= 6 && matchRatio > 0.2) {
    score += 25;
  }
  score = Math.min(100, Math.max(score, matchRatio > 0 ? 40 : 15));

  const isCorrect = score >= PASS_SCORE;
  const feedback = isCorrect
    ? `Excellent answer! You correctly identified the core Stack concepts (${matches}/${total} key points addressed).`
    : `Good attempt, but your answer could be more complete. Focus on key Stack concepts like LIFO ordering, top manipulation, and O(1) operations (${matches}/${total} key points found).`;

  return { isCorrect, score, feedback };
}

function evaluateStackDoubt(question) {
  if (!question || typeof question !== 'string') return null;
  const qLower = question.toLowerCase();
  for (const resp of stackData.doubts) {
    if (resp.keywords.some((kw) => qLower.includes(kw.toLowerCase()))) {
      return resp.answer;
    }
  }
  return null;
}

function evaluateStackAssignment(submission) {
  if (!submission || submission.trim().length < 50) {
    return { score: 30, feedback: 'Your submission is very short. Make sure to complete all tasks.' };
  }
  const sub = submission.toLowerCase();
  let score = 50;
  const feedbackPoints = [];

  if (sub.includes('push') && sub.includes('pop') && sub.includes('top')) {
    score += 20;
    feedbackPoints.push('✓ Core stack manipulation (push, pop, top) is well implemented.');
  }
  if (sub.includes('lifo') || sub.includes('last-in') || sub.includes('peek')) {
    score += 15;
    feedbackPoints.push('✓ LIFO ordering and inspection mechanics recognized.');
  }
  if (sub.includes('parentheses') || sub.includes('monotonic') || sub.includes('balance')) {
    score += 15;
    feedbackPoints.push('✓ Advanced syntax parsing / monotonic stack pattern understood.');
  }

  score = Math.min(100, score);
  const feedback = feedbackPoints.length > 0
    ? feedbackPoints.join(' ') + (score < 80 ? ' Strengthen edge case handling for empty stack checks.' : ' Great work!')
    : 'Partial submission detected. Ensure you completed all stack tasks with working code.';

  return { score, feedback };
}

module.exports = {
  stackData,
  gradeStackAnswer,
  evaluateStackDoubt,
  evaluateStackAssignment,
  generatePrebuiltStackAssignment,
};
