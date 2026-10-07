/**
 * Prebuilt Linked List learning path.
 * Deterministic offline data — works without external AI API dependencies.
 * Contains 6 progressive concepts, rich examples, checkpoints with expectedKeywords,
 * contextual doubt fallbacks, and quiz questions.
 */

const PASS_SCORE = parseInt(process.env.CHECKPOINT_PASS_SCORE || '60', 10);

const linkedListData = {
  topic: 'Linked List',
  category: 'Data Structures',
  description: 'Understand linear dynamic node collections, pointer navigation, head/tail references, insertion/deletion mechanisms, reversal algorithms, and edge-case handling.',

  concepts: [
    {
      title: 'Linked List Fundamentals & Dynamic Memory',
      content: `A Linked List is a fundamental linear data structure consisting of a sequence of **Nodes**.

Unlike Arrays, where elements are stored in contiguous blocks of computer memory, linked list nodes are dynamically allocated at arbitrary memory locations and bound together via **Pointers** (or references).

Key structural properties:
1. **Head Pointer**: A reference pointing to the very first node of the list. If head === null, the linked list is empty.
2. **Node Structure**: Each node contains two distinct fields:
   - **Data (val)**: The value or payload stored within the node (integer, string, object).
   - **Next Pointer**: The address / reference pointing to the next subsequent node.
3. **Tail Node**: The terminal node in the list whose next pointer is null, signaling the end of the sequence.

Because memory is allocated on-demand per node, linked lists can grow and shrink dynamically without requiring costly block reallocation or element copying.`,
      examples: `Singly Linked List Diagram:

[ HEAD ]
   |
   v
+---------+------+     +---------+------+     +---------+------+
| Data 10 | Next |---->| Data 20 | Next |---->| Data 30 | NULL |
+---------+------+     +---------+------+     +---------+------+

JavaScript Node Definition:
class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

const head = new ListNode(10, new ListNode(20, new ListNode(30)));`,
      keyTakeaways: `• Linked lists store elements non-contiguously using pointer-connected nodes.
• The HEAD pointer is the entry point; losing HEAD loses the entire list.
• The last node points to NULL.
• Memory is dynamically allocated on demand per node.`,
      checkpoint: {
        question: 'What two fields does a singly linked list Node contain, and what does it mean if the head pointer is NULL?',
        expectedKeywords: ['data', 'val', 'next', 'pointer', 'reference', 'null', 'empty', 'no nodes'],
      },
    },

    {
      title: 'Linked List Traversal and Linear Access',
      content: `Because linked list nodes are scattered throughout memory, you cannot access an arbitrary element by index in O(1) time (no random access like array[i]).

To find or read any element, you must perform a **Linear Traversal** starting at the HEAD:
1. Initialize a traversal pointer: let current = head.
2. Check if current is not null.
3. Process current.val (read, print, search, or evaluate).
4. Advance the pointer to the next node: current = current.next.
5. Terminate when current reaches null.

Complexity of Traversal:
- **Time Complexity**: O(n) to traverse n elements.
- **Space Complexity**: O(1) auxiliary space (using a single pointer variable).`,
      examples: `Iterative Traversal Pattern:

function printList(head) {
  let current = head;
  let result = [];
  while (current !== null) {
    result.push(current.val);
    current = current.next; // Advance to next node
  }
  console.log(result.join(" -> ") + " -> NULL");
}

// Searching for a target value:
function search(head, target) {
  let current = head;
  let index = 0;
  while (current !== null) {
    if (current.val === target) return index;
    current = current.next;
    index++;
  }
  return -1; // Target not found
}`,
      keyTakeaways: `• Linked lists do not support O(1) random indexing; elements must be accessed sequentially.
• Traversal requires starting at HEAD and advancing current = current.next until NULL.
• Finding an item or calculating length takes O(n) linear time and O(1) space.`,
      checkpoint: {
        question: 'Why can arrays access elements at index i in O(1) time while linked lists require O(n) time?',
        expectedKeywords: ['contiguous', 'memory address', 'formula', 'pointer', 'traverse', 'sequential', 'random access', 'hop'],
      },
    },

    {
      title: 'Insertion Operations: Head, Tail, and Middle',
      content: `Insertion in a linked list involves creating a new node and updating pointer references:

1. **Insert at Head (Prepend)**:
   - Create new node: newNode = new ListNode(value).
   - Set newNode.next = head.
   - Update head: head = newNode.
   - Time Complexity: O(1) constant time!

2. **Insert at Tail (Append)**:
   - If head is null: head = newNode.
   - Otherwise, traverse to the last node (where current.next === null).
   - Set current.next = newNode.
   - Time Complexity: O(n) without tail pointer, O(1) with a maintained tail pointer.

3. **Insert After a Given Node**:
   - newNode.next = prevNode.next.
   - prevNode.next = newNode.
   - Time Complexity: O(1) once prevNode is located.`,
      examples: `Inserting at the Head (O(1)):

// Initial: 20 -> 30 -> NULL (head = 20)
// Goal: Insert 10 at head

function insertAtHead(head, val) {
  const newNode = new ListNode(val);
  newNode.next = head; // 10 -> 20 -> 30 -> NULL
  return newNode;      // New head is 10
}

Inserting After a Specific Node:
function insertAfter(prevNode, val) {
  if (!prevNode) return;
  const newNode = new ListNode(val);
  newNode.next = prevNode.next;
  prevNode.next = newNode;
}`,
      keyTakeaways: `• Insertion at HEAD is strictly O(1) constant time and does not shift any elements.
• Inserting after a known node is O(1) pointer updates.
• The order of pointer assignments matters: always link newNode.next before overwriting prev.next.`,
      checkpoint: {
        question: 'What is the step-by-step procedure to insert a new node at the beginning (head) of a linked list, and what is its time complexity?',
        expectedKeywords: ['create node', 'next = head', 'update head', 'new node', 'O(1)', 'constant time'],
      },
    },

    {
      title: 'Deletion Operations and Garbage Collection',
      content: `Deleting a node requires bypassing it in the pointer chain so that no active references point to it:

1. **Delete Head Node**:
   - If head is null: return null.
   - Update head: head = head.next.
   - In languages like JavaScript, the discarded node is automatically reclaimed by Garbage Collection.
   - Time Complexity: O(1).

2. **Delete a Specific Value / Interior Node**:
   - Handle head deletion if head.val === target.
   - Maintain a prev pointer while traversing: while (current && current.val !== target).
   - Once found: prev.next = current.next (bypasses current).
   - Time Complexity: O(n) search + O(1) unlink.

3. **Delete Tail Node**:
   - Traverse until current.next.next === null.
   - Set current.next = null.`,
      examples: `Deleting a Node by Value:

function deleteNode(head, val) {
  if (!head) return null;
  if (head.val === val) return head.next; // Head deleted

  let current = head;
  while (current.next && current.next.val !== val) {
    current = current.next;
  }

  if (current.next) {
    current.next = current.next.next; // Bypass target node
  }
  return head;
}`,
      keyTakeaways: `• Deleting the HEAD node is O(1).
• Deleting an interior node requires setting prev.next = current.next to bypass the node.
• Special cases: list is empty, deleting the only node, deleting the head, or value not found.`,
      checkpoint: {
        question: 'When deleting a node in the middle of a singly linked list, why must we maintain a reference to the previous node (prev)?',
        expectedKeywords: ['prev.next', 'bypass', 'link', 'current.next', 'singly', 'no back pointer', 'reach next'],
      },
    },

    {
      title: 'Reversing a Singly Linked List (Three-Pointer Method)',
      content: `Reversing a linked list is a quintessential algorithmic problem requiring in-place pointer manipulation.

To reverse a list from 10 -> 20 -> 30 -> NULL to 30 -> 20 -> 10 -> NULL, we maintain three pointers during traversal:
1. **prev**: Tracks the previously processed node (starts as null).
2. **curr**: Tracks the node currently being reversed (starts as head).
3. **nextTemp**: Temporarily stores curr.next before we overwrite the pointer.

**The 4-Step Reversal Loop:**
1. Save next node: nextTemp = curr.next
2. Reverse pointer: curr.next = prev
3. Advance prev: prev = curr
4. Advance curr: curr = nextTemp

When curr reaches null, prev points to the new head (30).`,
      examples: `Reversal Code & Step Trace:

function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    let nextTemp = curr.next; // 1. Save next
    curr.next = prev;         // 2. Reverse link
    prev = curr;              // 3. Move prev forward
    curr = nextTemp;          // 4. Move curr forward
  }
  return prev; // New head of reversed list
}

Trace for 1 -> 2 -> 3 -> NULL:
Start: prev=null, curr=1
Step 1: nextTemp=2, 1->null, prev=1, curr=2
Step 2: nextTemp=3, 2->1->null, prev=2, curr=3
Step 3: nextTemp=null, 3->2->1->null, prev=3, curr=null
End: Returns prev (3 -> 2 -> 1 -> NULL)`,
      keyTakeaways: `• Reversing a linked list can be done in-place with O(n) time and O(1) space.
• Crucial step: Always save curr.next into a temporary variable before assigning curr.next = prev.
• The loop terminates when curr is null, and prev becomes the new head.`,
      checkpoint: {
        question: 'Why is it necessary to save curr.next into a temporary variable before executing curr.next = prev during list reversal?',
        expectedKeywords: ['lose reference', 'broken', 'cannot advance', 'overwrite', 'save next', 'isolated', 'next node'],
      },
    },

    {
      title: 'Linked List Types, Fast/Slow Pointers, and Complexity',
      content: `Variants and Advanced Patterns:

1. **Doubly Linked List (DLL)**:
   - Each node contains data, next, AND prev pointers.
   - Allows bidirectional traversal and O(1) node deletion given just the node pointer.

2. **Circular Linked List**:
   - Tail node's next points back to the head node.

3. **Fast & Slow Pointers (Floyd Cycle Finding / Tortoise & Hare)**:
   - Slow pointer moves 1 step; Fast pointer moves 2 steps.
   - Detects cycles in O(n) time and O(1) space.
   - Finds the middle of a linked list in a single pass.

**Summary Complexity Matrix:**
- Access / Search: O(n)
- Prepend (Insert Head): O(1)
- Append (Insert Tail): O(1) with tail pointer, O(n) without
- Delete Head: O(1)
- Delete Arbitrary Node: O(n) search + O(1) deletion`,
      examples: `Finding Middle Node (Tortoise & Hare):

function findMiddle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;       // 1 step
    fast = fast.next.next;  // 2 steps
  }
  return slow; // When fast reaches end, slow is at exact middle
}`,
      keyTakeaways: `• Doubly linked lists add prev pointers to allow two-way traversal at the cost of memory.
• Floyd Cycle Detection uses two pointers moving at different speeds to detect loops without extra hash maps.
• Fast/Slow pointers locate the middle node in a single O(n) traversal.`,
      checkpoint: {
        question: 'How does the Fast & Slow pointer (Tortoise and Hare) technique find the middle of a linked list in a single pass?',
        expectedKeywords: ['fast', 'slow', '2 steps', '1 step', 'middle', 'half speed', 'reach end'],
      },
    },
  ],

  doubts: [
    {
      keywords: ['why head pointer', 'head pointer', 'need head', 'importance of head'],
      answer: 'The head pointer is the only entry point to the linked list. Because nodes are non-contiguous in memory, losing reference to the head means you lose the address of the first node and cannot reach any other node in the chain, causing a complete memory leak.',
    },
    {
      keywords: ['save current.next', 'why save next', 'temporary variable', 'reverse pointer'],
      answer: 'When reversing a node, you change `curr.next = prev`. If you do not save `curr.next` into a temporary variable before this assignment, you overwrite the only pointer to the remaining rest of the list and lose access to the subsequent nodes.',
    },
    {
      keywords: ['empty list', 'what if empty', 'head is null', 'list is null'],
      answer: 'If a linked list is empty, `head` is `null`. Any operations like search, delete, or reverse should check `if (!head)` at the beginning as a base case to prevent runtime NullPointerException or TypeError errors.',
    },
    {
      keywords: ['insertion at head o(1)', 'insert head complexity', 'prepend complexity', 'why is insertion o(1)'],
      answer: 'Insertion at the head is O(1) constant time because you only create a new node, point `newNode.next = head`, and set `head = newNode`. Unlike an array, you do not need to shift any other elements in memory.',
    },
    {
      keywords: ['cannot access directly', 'no random access', 'array vs linked list', 'direct access'],
      answer: 'Arrays allocate contiguous memory blocks, allowing the computer to compute `address = base + index * size` in O(1) time. Linked list nodes are scattered arbitrarily in heap memory, so the only way to reach index `k` is to hop through `k` intermediate pointers sequentially (O(n) time).',
    },
  ],

  // Prebuilt quiz (10 structured questions mapped across all 6 concepts)
  quiz: {
    title: 'Linked List Mastery Assessment',
    questions: [
      {
        id: 'll_q1',
        conceptIndex: 1,
        conceptTitle: 'Linked List Fundamentals & Node Structure',
        type: 'single_select',
        question: 'What are the two basic components that make up a standard Singly Linked List Node?',
        options: [
          { value: 'A', label: 'A key and a hash code', feedback: 'That is the structure of a hash table bucket.' },
          { value: 'B', label: 'Data value and a pointer/reference to the Next node', feedback: 'Correct! A singly linked list node stores its payload value and a next pointer.' },
          { value: 'C', label: 'An array index and an offset', feedback: 'Arrays use index offsets; linked lists use memory pointers.' },
          { value: 'D', label: 'Left child and right child', feedback: 'Binary tree nodes store left and right children.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Each node in a singly linked list contains a data element (`val` or `data`) and a reference (`next`) pointing to the following node in memory (or `null`).',
        hint: 'What does a node need to store its own item and connect to the next item?',
      },
      {
        id: 'll_q2',
        conceptIndex: 2,
        conceptTitle: 'Singly Linked List Operations (Insert, Delete, Search)',
        type: 'single_select',
        question: 'What is the time complexity to insert a new node at the very beginning (Head) of a singly linked list with n nodes?',
        options: [
          { value: 'A', label: 'O(n)', feedback: 'Insertion at head does not require iterating through the list.' },
          { value: 'B', label: 'O(log n)', feedback: 'Logarithmic time requires divide-and-conquer structures.' },
          { value: 'C', label: 'O(1) constant time', feedback: 'Correct! Prepending a node only requires updating two pointers, executing in O(1) time.' },
          { value: 'D', label: 'O(n^2)', feedback: 'Quadratic time is not required for basic node insertion.' },
        ],
        correctAnswer: 'C',
        correctOptionIndex: 2,
        explanation: 'Inserting at head (`newNode.next = head; head = newNode`) takes O(1) constant time because no traversal or element shifting is necessary.',
        hint: 'Do we need to loop through the list to attach a node to the existing head?',
      },
      {
        id: 'll_q3',
        conceptIndex: 3,
        conceptTitle: 'Pointer Manipulation and Traversal Patterns',
        type: 'single_select',
        question: 'What condition signals that a standard singly linked list traversal has reached the terminal end?',
        options: [
          { value: 'A', label: 'current === head', feedback: 'current === head is true only at the very start.' },
          { value: 'B', label: 'current.next === null (or current === null)', feedback: 'Correct! The final node in a standard singly linked list has its next pointer set to null.' },
          { value: 'C', label: 'current.val === 0', feedback: '0 is a valid data value, not an end-of-list sentinel.' },
          { value: 'D', label: 'current.prev === null', feedback: 'Singly linked lists do not have prev pointers.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'The terminal node of a non-circular linked list has `next === null`. While traversing, `current === null` signifies we have walked off the end.',
        hint: 'Where does the next pointer of the last node point?',
      },
      {
        id: 'll_q4',
        conceptIndex: 4,
        conceptTitle: 'Doubly Linked Lists & Circular Linked Lists',
        type: 'single_select',
        question: 'What is the primary operational advantage of a Doubly Linked List over a Singly Linked List?',
        options: [
          { value: 'A', label: 'It uses 50% less memory', feedback: 'Doubly linked lists use more memory due to the second pointer.' },
          { value: 'B', label: 'It allows O(1) deletion of a given node reference and bidirectional traversal (forward and backward)', feedback: 'Correct! With `prev` and `next` pointers, a node can unlink itself in O(1) time without searching from head.' },
          { value: 'C', label: 'It provides O(1) random index access like an array', feedback: 'Linked lists cannot compute addresses by index in O(1).' },
          { value: 'D', label: 'It automatically sorts nodes on insertion', feedback: 'Sorting is an independent operation.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'In a doubly linked list, each node has `prev` and `next` pointers. If given a pointer to a node, we can remove it in O(1) without traversing from head to find its predecessor.',
        hint: 'How does having a backward pointer (`prev`) help when deleting a node?',
      },
      {
        id: 'll_q5',
        conceptIndex: 5,
        conceptTitle: 'Classic Two-Pointer Techniques (Fast & Slow / Tortoise & Hare)',
        type: 'single_select',
        question: 'In Floyd Cycle Finding algorithm (Tortoise and Hare), how do the two pointers advance?',
        options: [
          { value: 'A', label: 'Both pointers advance 1 step per iteration', feedback: 'Both moving at the same speed would maintain a constant distance and never detect a cycle.' },
          { value: 'B', label: 'Slow advances 1 step, Fast advances 2 steps per iteration', feedback: 'Correct! The speed differential guarantees Fast will catch Slow if a cycle exists.' },
          { value: 'C', label: 'Slow advances 2 steps, Fast advances 3 steps', feedback: 'Standard Floyd algorithm uses 1 step for slow and 2 steps for fast.' },
          { value: 'D', label: 'Slow moves forward, Fast moves backward', feedback: 'Singly linked lists cannot traverse backward without prev pointers.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Floyd\'s algorithm moves `slow = slow.next` (1 step) and `fast = fast.next.next` (2 steps). If there is a cycle, `fast` closes the gap by 1 node per iteration and will eventually equal `slow`.',
        hint: 'Think about relative speed: one pointer is twice as fast as the other.',
      },
      {
        id: 'll_q6',
        conceptIndex: 5,
        conceptTitle: 'Classic Two-Pointer Techniques (Fast & Slow / Tortoise & Hare)',
        type: 'single_select',
        question: 'How do you find the Middle Node of a linked list in a single pass without computing total length first?',
        options: [
          { value: 'A', label: 'Advance Fast by 2 steps and Slow by 1 step; when Fast reaches the end, Slow is at the exact middle', feedback: 'Correct! Since Fast travels twice as fast as Slow, Slow travels exactly half the distance when Fast reaches the end.' },
          { value: 'B', label: 'Start two pointers from the head and tail simultaneously', feedback: 'Singly linked lists cannot traverse backwards from the tail.' },
          { value: 'C', label: 'Convert the linked list into a string', feedback: 'String conversion is inefficient and takes extra memory.' },
          { value: 'D', label: 'Use binary search on node addresses', feedback: 'Heap node addresses are non-contiguous.' },
        ],
        correctAnswer: 'A',
        explanation: 'When `fast` (moving 2 steps at a time) reaches the end of the list, `slow` (moving 1 step at a time) has traveled exactly half the distance, resting cleanly at the middle node.',
        hint: 'If a runner runs twice as fast, where is the slower runner when the fast runner crosses the finish line?',
      },
      {
        id: 'll_q7',
        conceptIndex: 6,
        conceptTitle: 'Reversing a Linked List and Common Interview Patterns',
        type: 'single_select',
        question: 'What three pointer variables are essential to reverse a Singly Linked List iteratively in O(1) space?',
        options: [
          { value: 'A', label: '`prev`, `current`, and `next` (or nextTemp)', feedback: 'Correct! `prev` tracks the reversed portion, `current` is the node being repointed, and `nextTemp` prevents losing the rest of the list.' },
          { value: 'B', label: '`left`, `right`, and `mid`', feedback: 'These are binary search pointers.' },
          { value: 'C', label: '`root`, `leftSubtree`, and `rightSubtree`', feedback: 'These are tree node pointers.' },
          { value: 'D', label: '`top`, `base`, and `index`', feedback: 'These are stack descriptors.' },
        ],
        correctAnswer: 'A',
        explanation: 'In iterative reversal: save `nextTemp = current.next`, repoint `current.next = prev`, shift `prev = current`, and advance `current = nextTemp`. Space is O(1).',
        hint: 'Before breaking `current.next`, what variable must hold the rest of the forward list?',
      },
      {
        id: 'll_q8',
        conceptIndex: 2,
        conceptTitle: 'Singly Linked List Operations (Insert, Delete, Search)',
        type: 'single_select',
        question: 'What is the purpose of using a **Dummy Head (Sentinel Node)** in linked list algorithms?',
        options: [
          { value: 'A', label: 'To eliminate edge cases when modifying or removing the first node (Head)', feedback: 'Correct! Having `dummy.next = head` ensures the head node can be treated uniformly like any interior node.' },
          { value: 'B', label: 'To compress the memory footprint of the list', feedback: 'Dummy nodes use a small amount of extra memory.' },
          { value: 'C', label: 'To automatically reverse all pointers', feedback: 'Dummy nodes do not reverse pointers.' },
          { value: 'D', label: 'To make the list thread-safe', feedback: 'Dummy nodes do not handle concurrency locks.' },
        ],
        correctAnswer: 'A',
        explanation: 'A dummy head simplifies operations like deleting head or merging lists because you never need special-case `if (head === target)` conditionals. `dummy.next` always points to the real head.',
        hint: 'What happens when you need to delete the very first node of a list?',
      },
      {
        id: 'll_q9',
        conceptIndex: 1,
        conceptTitle: 'Linked List Fundamentals & Node Structure',
        type: 'single_select',
        question: 'Why does accessing the k-th element of a Linked List take O(k) time whereas an Array takes O(1)?',
        options: [
          { value: 'A', label: 'Linked list nodes are scattered arbitrarily in memory; you must follow pointers node-by-node from head', feedback: 'Correct! Without contiguous memory layout, direct index arithmetic is impossible.' },
          { value: 'B', label: 'Linked lists are encrypted in memory', feedback: 'Memory pointers are direct references, not encrypted.' },
          { value: 'C', label: 'Linked lists store twice as many bytes per integer', feedback: 'Pointer overhead does not prevent indexing; lack of contiguous memory does.' },
          { value: 'D', label: 'CPUs refuse to cache linked list pointers', feedback: 'CPU cache misses occur because memory is non-contiguous, but the algorithmic complexity stems from pointer hopping.' },
        ],
        correctAnswer: 'A',
        explanation: 'Arrays allocate contiguous blocks of memory where `address = base + index * size` is computed in O(1). Linked lists store nodes in arbitrary heap locations, requiring sequential pointer traversal.',
        hint: 'Can you compute the memory address of the 5th node without reading the 4th node?',
      },
      {
        id: 'll_q10',
        conceptIndex: 6,
        conceptTitle: 'Reversing a Linked List and Common Interview Patterns',
        type: 'single_select',
        question: 'When reversing a linked list `1 -> 2 -> 3 -> null`, what will `prev` point to when the while loop terminates?',
        options: [
          { value: 'A', label: 'Node 3 (the new Head of the reversed list)', feedback: 'Correct! When `current` becomes `null`, `prev` holds the last non-null node, which is the new head.' },
          { value: 'B', label: 'Node 1', feedback: 'Node 1 is now the tail pointing to null.' },
          { value: 'C', label: 'null', feedback: '`current` becomes null, but `prev` holds the new head node.' },
          { value: 'D', label: 'Node 2', feedback: 'Node 2 is in the middle of the reversed list.' },
        ],
        correctAnswer: 'A',
        explanation: 'When the traversal finishes (`current === null`), `prev` points to the final processed node (3), which now forms the head of `3 -> 2 -> 1 -> null`.',
        hint: 'What does the reverse function return at the very end?',
      },
    ],
  },

  assignment: {
    title: 'Linked List Mastery Assignment',
    description: 'Personalized practice questions focusing on pointer manipulation, fast/slow techniques, reversal patterns, and dummy sentinels.',
    difficulty: 'developing',
  },
};

// ─── Prebuilt Question Bank for Linked List Concepts ─────────────────────────
const LINKED_LIST_QUESTION_BANK = [
  // Concept 1: Linked List Fundamentals & Node Structure
  {
    conceptTitleMatch: 'fundamentals',
    fallbackIndex: 0,
    questions: [
      {
        question: 'Why do Linked Lists allow dynamic resizing with zero memory reallocation and copy overhead compared to dynamic arrays?',
        options: [
          { value: 'A', label: 'Nodes are allocated individually in heap memory as needed and linked via pointers, without requiring contiguous memory blocks.' },
          { value: 'B', label: 'Linked lists compress data automatically.' },
          { value: 'C', label: 'Linked lists run in GPU memory.' },
          { value: 'D', label: 'Linked lists delete unused memory instantly.' }
        ],
        correctAnswer: 'A',
        explanation: 'Dynamic arrays (like vectors or ArrayLists) must allocate new contiguous memory and copy all existing items when capacity is exceeded. Linked list nodes are instantiated individually anywhere on the heap.',
        hint: 'How does allocating each node separately avoid copying the entire list?'
      },
      {
        question: 'What is the space complexity overhead per element in a standard Singly Linked List storing 32-bit integers on a 64-bit system?',
        options: [
          { value: 'A', label: '8 bytes for the 64-bit `next` memory address pointer reference.' },
          { value: 'B', label: '0 bytes.' },
          { value: 'C', label: '64 bytes.' },
          { value: 'D', label: '4 megabytes.' }
        ],
        correctAnswer: 'A',
        explanation: 'On a 64-bit architecture, each memory pointer is 8 bytes (64 bits). Storing a 4-byte integer alongside an 8-byte `next` pointer means pointer overhead is 8 bytes per node.',
        hint: 'How many bytes does a 64-bit memory pointer occupy?'
      }
    ]
  },

  // Concept 2: Singly Linked List Operations (Insert, Delete, Search)
  {
    conceptTitleMatch: 'operations',
    fallbackIndex: 1,
    questions: [
      {
        question: 'To delete a node given a pointer to its previous node `prevNode`, what is the single line pointer update in JavaScript?',
        options: [
          { value: 'A', label: '`prevNode.next = prevNode.next.next;`' },
          { value: 'B', label: '`prevNode = null;`' },
          { value: 'C', label: '`prevNode.next = prevNode;`' },
          { value: 'D', label: '`prevNode.val = 0;`' }
        ],
        correctAnswer: 'A',
        explanation: 'Setting `prevNode.next = prevNode.next.next` bypasses the target node completely, disconnecting it from the chain so it can be garbage collected.',
        hint: 'How do you bypass the middle node by linking prevNode directly to the node following it?'
      },
      {
        question: 'What is the time complexity to search for a value `target = 42` in an unsorted Singly Linked List of length n?',
        options: [
          { value: 'A', label: 'O(n) linear time because you must inspect nodes sequentially from head to tail.' },
          { value: 'B', label: 'O(log n) using binary search.' },
          { value: 'C', label: 'O(1) constant time.' },
          { value: 'D', label: 'O(n^2).' }
        ],
        correctAnswer: 'A',
        explanation: 'Because linked list nodes cannot be indexed randomly, finding a target requires sequential traversal from the head, which takes O(n) worst-case time.',
        hint: 'Can you jump to the middle node of a linked list in O(1)?'
      }
    ]
  },

  // Concept 3: Pointer Manipulation and Traversal Patterns
  {
    conceptTitleMatch: 'pointer',
    fallbackIndex: 2,
    questions: [
      {
        question: 'Why does writing `while (current !== null)` versus `while (current.next !== null)` matter during list traversal?',
        options: [
          { value: 'A', label: '`while (current !== null)` visits every node including the last one; `while (current.next !== null)` stops AT the last node.' },
          { value: 'B', label: 'Both conditions behave identically in all scenarios.' },
          { value: 'C', label: '`while (current.next !== null)` crashes on all lists.' },
          { value: 'D', label: '`while (current !== null)` skips the head node.' }
        ],
        correctAnswer: 'A',
        explanation: '`while (current !== null)` traverses the entire list and exits when `current` is null. `while (current.next !== null)` terminates with `current` pointing directly at the tail node (useful when appending).',
        hint: 'Think about which condition leaves you standing on the last element.'
      },
      {
        question: 'What error will occur if you execute `current = current.next` when `current === null`?',
        options: [
          { value: 'A', label: 'Null pointer dereference / TypeError: Cannot read properties of null (reading \'next\').' },
          { value: 'B', label: 'It loops back to the head node.' },
          { value: 'C', label: 'It returns undefined.' },
          { value: 'D', label: 'The CPU pauses execution.' }
        ],
        correctAnswer: 'A',
        explanation: 'Attempting to access `.next` on a `null` variable throws a fatal Null Pointer Exception or TypeError.',
        hint: 'Always ensure current is non-null before accessing its properties.'
      }
    ]
  },

  // Concept 4: Doubly Linked Lists & Circular Linked Lists
  {
    conceptTitleMatch: 'doubly',
    fallbackIndex: 3,
    questions: [
      {
        question: 'In a Circular Singly Linked List with head node `H`, what does the tail node\'s `next` pointer reference?',
        options: [
          { value: 'A', label: 'The head node `H`' },
          { value: 'B', label: '`null`' },
          { value: 'C', label: 'itself' },
          { value: 'D', label: 'The second node in the list' }
        ],
        correctAnswer: 'A',
        explanation: 'In a circular linked list, the tail node\'s `next` pointer points back to the `head` node rather than `null`, forming a continuous closed loop.',
        hint: 'A circular structure connects the end back to the beginning.'
      },
      {
        question: 'Why are Doubly Linked Lists commonly used to implement LRU (Least Recently Used) Caches?',
        options: [
          { value: 'A', label: 'They allow O(1) removal of any node and O(1) insertion at the head when paired with a Hash Map.' },
          { value: 'B', label: 'They consume less memory than arrays.' },
          { value: 'C', label: 'They prevent cache expiration.' },
          { value: 'D', label: 'They sort keys alphabetically.' }
        ],
        correctAnswer: 'A',
        explanation: 'An LRU cache requires moving recently accessed items to the front and evicting the least recently used item from the back in O(1) time. Doubly linked lists excel at arbitrary node detachment in O(1).',
        hint: 'Why is O(1) node detachment crucial when moving an existing item to the front?'
      }
    ]
  },

  // Concept 5: Classic Two-Pointer Techniques (Fast & Slow / Tortoise & Hare)
  {
    conceptTitleMatch: 'pointer techniques',
    fallbackIndex: 4,
    questions: [
      {
        question: 'In Floyd\'s cycle detection algorithm, if `slow` and `fast` pointers meet at node `M`, how do you find the exact START node of the cycle?',
        options: [
          { value: 'A', label: 'Reset one pointer to `head` and advance both pointers 1 step at a time; their next meeting point is the cycle start.' },
          { value: 'B', label: 'Reverse the entire list from node `M`.' },
          { value: 'C', label: 'Advance `fast` by 3 steps.' },
          { value: 'D', label: 'The meeting point `M` is always the cycle start.' }
        ],
        correctAnswer: 'A',
        explanation: 'Mathematical proof of Floyd\'s algorithm shows the distance from `head` to cycle start equals the distance from `M` to cycle start around the loop. Moving both at speed 1 finds the cycle entrance.',
        hint: 'Reset one pointer to head and move both at speed 1.'
      },
      {
        question: 'To find the k-th node from the END of a linked list in one pass, how should two pointers be initialized?',
        options: [
          { value: 'A', label: 'Advance `fast` by `k` steps first, then move both `slow` and `fast` at 1 step per iteration until `fast` reaches the end.' },
          { value: 'B', label: 'Move both pointers at speed 2.' },
          { value: 'C', label: 'Start `slow` at index 0 and `fast` at index 0 without any lead.' },
          { value: 'D', label: 'Traverse backward from the tail.' }
        ],
        correctAnswer: 'A',
        explanation: 'By giving `fast` a head-start of `k` steps, the gap between `slow` and `fast` remains `k`. When `fast` reaches `null`, `slow` is positioned exactly `k` nodes from the end.',
        hint: 'Maintain a fixed distance window of k nodes between the two pointers.'
      }
    ]
  },

  // Concept 6: Reversing a Linked List and Common Interview Patterns
  {
    conceptTitleMatch: 'reversing',
    fallbackIndex: 5,
    questions: [
      {
        question: 'In the iterative reverse algorithm, why must `nextTemp = current.next` be saved BEFORE executing `current.next = prev`?',
        options: [
          { value: 'A', label: 'Because assigning `current.next = prev` overwrites the forward link, losing access to the rest of the list if not saved.' },
          { value: 'B', label: 'To keep the list length even.' },
          { value: 'C', label: 'It is required by compiler optimization.' },
          { value: 'D', label: 'To prevent stack overflow.' }
        ],
        correctAnswer: 'A',
        explanation: 'Once `current.next` is pointed backwards to `prev`, the pointer to the next forward node is lost. Storing `nextTemp` first preserves the forward traversal path.',
        hint: 'What happens to the pointer to node 3 when node 2 points backward to node 1?'
      },
      {
        question: 'How do you check if a Singly Linked List is a Palindrome in O(n) time and O(1) auxiliary space?',
        options: [
          { value: 'A', label: 'Find middle with slow/fast, reverse the second half in-place, compare values from head and reversed second half, then restore list.' },
          { value: 'B', label: 'Convert all nodes into an array of size n.' },
          { value: 'C', label: 'Compare node memory addresses.' },
          { value: 'D', label: 'Square all node values.' }
        ],
        correctAnswer: 'A',
        explanation: 'Finding the midpoint (slow/fast) and reversing the second half in O(1) space allows two pointers to compare first half and second half element by element in linear time without extra memory.',
        hint: 'Combine slow/fast midpoint search with in-place list reversal.'
      }
    ]
  }
];

/**
 * Deterministically generates a personalized 8-question assignment for Linked List
 * weighted heavily towards the student's weakest concepts.
 */
function generatePrebuiltLinkedListAssignment(conceptsList = [], weakConceptsList = [], snapshot = {}) {
  const getConcept = (matchStr, fallbackIdx) => {
    const found = (conceptsList || []).find((c) =>
      (c.title || '').toLowerCase().includes(matchStr.toLowerCase())
    );
    return found || conceptsList[fallbackIdx] || { id: fallbackIdx + 1, title: 'Linked List Concept' };
  };

  const weakTitles = (weakConceptsList || []).map((w) => (w.title || w.conceptTitle || '').toLowerCase());
  const isReversingWeak = weakTitles.some((t) => t.includes('revers') || t.includes('interview'));
  const isTwoPointerWeak = weakTitles.some((t) => t.includes('two-pointer') || t.includes('tortoise') || t.includes('fast'));
  const isOperationsWeak = weakTitles.some((t) => t.includes('operation') || t.includes('insert') || t.includes('delete'));

  const questions = [];
  let qCounter = 1;

  const fundamentalsConcept = getConcept('fundamentals', 0);
  const operationsConcept = getConcept('operations', 1);
  const pointerConcept = getConcept('pointer', 2);
  const doublyConcept = getConcept('doubly', 3);
  const twoPointerConcept = getConcept('two-pointer', 4);
  const reversingConcept = getConcept('revers', 5);

  if (isReversingWeak || isTwoPointerWeak) {
    // Heavy focus on Reversal & Fast/Slow Two-Pointer
    LINKED_LIST_QUESTION_BANK[5].questions.forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: reversingConcept.id,
        conceptTitle: reversingConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    LINKED_LIST_QUESTION_BANK[4].questions.forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: twoPointerConcept.id,
        conceptTitle: twoPointerConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: operationsConcept.id,
      conceptTitle: operationsConcept.title,
      type: 'multiple_choice',
      ...LINKED_LIST_QUESTION_BANK[1].questions[0],
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: pointerConcept.id,
      conceptTitle: pointerConcept.title,
      type: 'multiple_choice',
      ...LINKED_LIST_QUESTION_BANK[2].questions[0],
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: doublyConcept.id,
      conceptTitle: doublyConcept.title,
      type: 'multiple_choice',
      ...LINKED_LIST_QUESTION_BANK[3].questions[0],
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: fundamentalsConcept.id,
      conceptTitle: fundamentalsConcept.title,
      type: 'multiple_choice',
      ...LINKED_LIST_QUESTION_BANK[0].questions[0],
    });
  } else {
    // Balanced distribution
    LINKED_LIST_QUESTION_BANK.forEach((group, gIdx) => {
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

    if (LINKED_LIST_QUESTION_BANK[5].questions[1]) {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: reversingConcept.id,
        conceptTitle: reversingConcept.title,
        type: 'multiple_choice',
        ...LINKED_LIST_QUESTION_BANK[5].questions[1],
      });
    }
    if (LINKED_LIST_QUESTION_BANK[4].questions[1]) {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: twoPointerConcept.id,
        conceptTitle: twoPointerConcept.title,
        type: 'multiple_choice',
        ...LINKED_LIST_QUESTION_BANK[4].questions[1],
      });
    }
  }

  const finalQuestions = questions.slice(0, 8);
  const focusTitle = snapshot.weakConcepts?.[0]?.conceptTitle || (isReversingWeak ? 'List Reversal & Pointer Rewiring' : 'Pointer Traversal & Fast/Slow Pointers');

  return {
    topic: 'Linked List',
    title: 'Personalized Linked List Practice',
    description: `Personalized 8-question practice set based on your completed learning session. Focus area: ${focusTitle}.`,
    difficulty: snapshot.difficulty || 'developing',
    sessionMastery: snapshot.overallMastery || 74,
    focusConcepts: snapshot.weakConcepts && snapshot.weakConcepts.length > 0 ? snapshot.weakConcepts : [
      { conceptId: reversingConcept.id, conceptTitle: reversingConcept.title, mastery: 48 }
    ],
    strongConcepts: snapshot.strongConcepts && snapshot.strongConcepts.length > 0 ? snapshot.strongConcepts : [
      { conceptId: fundamentalsConcept.id, conceptTitle: fundamentalsConcept.title, mastery: 92 }
    ],
    questions: finalQuestions,
  };
}

function gradeLinkedListAnswer(checkpoint, answer) {
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
    ? `Great job! Your explanation accurately covers the required Linked List mechanics (${matches}/${total} key points addressed).`
    : `Good start, but your answer is missing key concepts. Make sure to mention pointers, node structures, sequential traversal, or head reference (${matches}/${total} key points found).`;

  return { isCorrect, score, feedback };
}

function evaluateLinkedListDoubt(question) {
  if (!question || typeof question !== 'string') return null;
  const qLower = question.toLowerCase();
  for (const resp of linkedListData.doubts) {
    if (resp.keywords.some((kw) => qLower.includes(kw.toLowerCase()))) {
      return resp.answer;
    }
  }
  return null;
}

function evaluateLinkedListAssignment(submission) {
  if (!submission || submission.trim().length < 50) {
    return { score: 30, feedback: 'Your submission is very short. Make sure to complete all tasks.' };
  }
  const sub = submission.toLowerCase();
  let score = 50;
  const feedbackPoints = [];

  if (sub.includes('head') && (sub.includes('next') || sub.includes('prev'))) {
    score += 20;
    feedbackPoints.push('✓ Linked list node pointer operations are well structured.');
  }
  if (sub.includes('reverse') || sub.includes('prev = current') || sub.includes('nexttemp')) {
    score += 15;
    feedbackPoints.push('✓ Reversal / pointer rewiring mechanics recognized.');
  }
  if (sub.includes('fast') || sub.includes('slow') || sub.includes('dummy') || sub.includes('cycle')) {
    score += 15;
    feedbackPoints.push('✓ Fast/slow two-pointer or dummy sentinel pattern understood.');
  }

  score = Math.min(100, score);
  const feedback = feedbackPoints.length > 0
    ? feedbackPoints.join(' ') + (score < 80 ? ' Review edge cases for single-node or null head lists.' : ' Great work!')
    : 'Partial submission detected. Ensure you completed all linked list tasks with working code.';

  return { score, feedback };
}

module.exports = {
  linkedListData,
  gradeLinkedListAnswer,
  evaluateLinkedListDoubt,
  evaluateLinkedListAssignment,
  generatePrebuiltLinkedListAssignment,
};
