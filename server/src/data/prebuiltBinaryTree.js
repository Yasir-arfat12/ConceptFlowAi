/**
 * Prebuilt Binary Tree learning path.
 * Deterministic offline data — works without external AI API dependencies.
 * Contains 6 progressive concepts, rich examples, checkpoints with expectedKeywords,
 * contextual doubt fallbacks, and quiz questions.
 */

const PASS_SCORE = parseInt(process.env.CHECKPOINT_PASS_SCORE || '60', 10);

const binaryTreeData = {
  topic: 'Binary Tree',
  category: 'Data Structures',
  description: 'Master hierarchical tree structures, root/child/leaf relationships, tree traversals (Preorder, Inorder, Postorder, Level Order), Binary Search Trees (BST), and recursive tree algorithms.',

  concepts: [
    {
      title: 'Tree Fundamentals and Hierarchical Data Structures',
      content: `A Tree is a non-linear, hierarchical data structure composed of nodes connected by directed edges.

Unlike linear structures (Arrays, Linked Lists, Stacks, Queues) where elements follow a strict sequential order, trees organize data in parent-child relationships, making them ideal for modeling file systems, organizational charts, HTML DOMs, and decision trees.

**Key Definitions:**
- **Node**: An entity containing a key/value and links to its child nodes.
- **Root**: The topmost node of the tree. A tree has exactly one root, which has no parent.
- **Edge**: The connecting link between a parent node and a child node. A tree with N nodes always contains exactly N - 1 edges.
- **Leaf (Terminal Node)**: A node with no children (both left and right links are null).
- **Subtree**: Any node in the tree along with all its descendants.`,
      examples: `Tree Visual Hierarchy:

          [ 10 ]  <-- ROOT (Topmost node)
          /    \\
      [ 5 ]    [ 15 ]  <-- Internal / Child Nodes
      /   \\        \\
    [ 3 ]  [ 7 ]   [ 20 ] <-- LEAF NODES (no children)

Number of Nodes (N) = 6
Number of Edges = 5 (N - 1)`,
      keyTakeaways: `• Trees represent hierarchical data non-linearly.
• The ROOT is the single entry node with no parent.
• LEAF nodes are terminal nodes with zero children.
• A tree with N nodes always has exactly N - 1 edges and no cycles.`,
      checkpoint: {
        question: 'What is the root of a tree, what is a leaf node, and how many edges connect a tree with N nodes?',
        expectedKeywords: ['root', 'topmost', 'no parent', 'leaf', 'no children', 'N - 1', 'edges'],
      },
    },

    {
      title: 'Binary Tree Structure and Node Anatomy',
      content: `A **Binary Tree** is a specialized tree structure in which every node has **at most two children**, typically referred to as the **left child** and the **right child**.

**Binary Tree Node Anatomy:**
Each node contains:
1. **val (data)**: The stored value or payload.
2. **left**: A pointer/reference to the left child node (or null).
3. **right**: A pointer/reference to the right child node (or null).

**Types of Binary Trees:**
1. **Full Binary Tree**: Every node has either 0 or 2 children (no node has only 1 child).
2. **Complete Binary Tree**: All levels are completely filled except possibly the last level, where nodes are positioned as far left as possible.
3. **Perfect Binary Tree**: All internal nodes have 2 children, and all leaves are at the exact same depth. A perfect binary tree of height h contains 2^(h+1) - 1 nodes.
4. **Balanced Binary Tree**: For every node, the height difference between the left and right subtrees is at most 1.`,
      examples: `JavaScript Binary Tree Node:

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Building:
//       1
//      / \\
//     2   3
const root = new TreeNode(1, new TreeNode(2), new TreeNode(3));`,
      keyTakeaways: `• In a binary tree, each node has at most two children: left and right.
• Full binary tree = 0 or 2 children per node.
• Perfect binary tree = all levels completely filled.
• Balanced trees ensure O(log n) height for efficient operations.`,
      checkpoint: {
        question: 'What defines a Binary Tree, and what is the difference between a Full Binary Tree and a Complete Binary Tree?',
        expectedKeywords: ['at most 2', 'left and right', '0 or 2', 'last level', 'as far left', 'complete', 'full'],
      },
    },

    {
      title: 'Tree Terminology: Height, Depth, Level, and Ancestors',
      content: `Precise terminology is critical for analyzing tree properties and recursive algorithms:

1. **Depth of a Node**: The number of edges along the path from the ROOT down to that specific node.
   - Depth of the Root node = 0.
2. **Height of a Node**: The number of edges on the longest downward path from that node to a leaf.
   - Height of a Leaf node = 0.
3. **Height of a Tree**: The height of the Root node (i.e., maximum depth of any node in the tree).
4. **Level of a Node**: Often defined as depth + 1 (Root is at Level 1).
5. **Parent & Child**: If node A points to node B, A is parent of B, and B is child of A.
6. **Ancestor & Descendant**: Any node on the path from root to node X is an ancestor of X. Any node reachable downwards from X is a descendant of X.`,
      examples: `Height vs Depth Reference:

         [ A ]  (Depth: 0, Height: 2) <-- Root
        /     \\
      [ B ]   [ C ]  (Depth: 1, Height: 1)
      /
    [ D ]  (Depth: 2, Height: 0) <-- Leaf

Tree Height = 2 (Longest path: A -> B -> D)`,
      keyTakeaways: `• Depth measures distance DOWN from the Root (Root depth = 0).
• Height measures distance UP from the deepest Leaf (Leaf height = 0).
• Tree Height equals the maximum depth among all nodes.`,
      checkpoint: {
        question: 'What is the difference between the depth of a node and the height of a node in a binary tree?',
        expectedKeywords: ['depth', 'from root', 'downward', 'height', 'to leaf', 'longest path', 'edges'],
      },
    },

    {
      title: 'Tree Traversals: Preorder, Inorder, Postorder, and Level Order',
      content: `Tree traversal is the process of visiting every node in a tree exactly once. There are four standard traversals:

**Depth-First Search (DFS) Traversals (Recursive):**
1. **Preorder (Root -> Left -> Right)**:
   - Process Root first, then traverse Left subtree, then Right subtree.
   - Used for cloning/serializing trees and expression prefix notation.
2. **Inorder (Left -> Root -> Right)**:
   - Traverse Left subtree, process Root, then traverse Right subtree.
   - Crucial property: Inorder traversal of a Binary Search Tree (BST) visits nodes in strictly SORTED ascending order!
3. **Postorder (Left -> Right -> Root)**:
   - Traverse Left subtree, traverse Right subtree, then process Root.
   - Used for bottom-up calculations (e.g., tree deletion, calculating directory sizes, post-fix expressions).

**Breadth-First Search (BFS) Traversal:**
4. **Level Order (BFS)**:
   - Visit nodes level-by-level from top to bottom, left to right, using an auxiliary FIFO Queue.`,
      examples: `Traversing this Tree:
        10
       /  \\
      5    15
     / \\     \\
    3   7     20

1. Preorder (Root, Left, Right):  10 -> 5 -> 3 -> 7 -> 15 -> 20
2. Inorder (Left, Root, Right):    3 -> 5 -> 7 -> 10 -> 15 -> 20 (Sorted!)
3. Postorder (Left, Right, Root): 3 -> 7 -> 5 -> 20 -> 15 -> 10
4. Level Order (BFS):             10 -> 5 -> 15 -> 3 -> 7 -> 20`,
      keyTakeaways: `• Preorder: Root -> Left -> Right (useful for serialization).
• Inorder: Left -> Root -> Right (produces sorted order in BSTs).
• Postorder: Left -> Right -> Root (useful for bottom-up deletion and sizing).
• Level Order uses a FIFO Queue for breadth-first traversal.`,
      checkpoint: {
        question: 'What is the visiting order for Preorder, Inorder, and Postorder traversals, and what special result does Inorder produce on a Binary Search Tree?',
        expectedKeywords: ['preorder', 'root left right', 'inorder', 'left root right', 'postorder', 'left right root', 'sorted', 'ascending'],
      },
    },

    {
      title: 'Binary Search Tree (BST) Properties and Search',
      content: `A **Binary Search Tree (BST)** is a binary tree with a fundamental ordering invariant:

**The BST Invariant:**
For every node with value K:
- All values in its **Left Subtree** are strictly LESS than K: (Left.val < K).
- All values in its **Right Subtree** are strictly GREATER than K: (Right.val > K).
- Both left and right subtrees must themselves also be valid Binary Search Trees.

**Why BSTs are Powerful:**
Because of the ordering invariant, searching in a BST is analogous to Binary Search on sorted arrays:
- If target === root.val: Found!
- If target < root.val: Discard right subtree and search left.
- If target > root.val: Discard left subtree and search right.

**Complexity:**
- **Average Time Complexity**: O(log n) for Search, Insertion, and Deletion on balanced BSTs.
- **Worst-Case Time Complexity**: O(n) when elements are inserted in sorted order, degrading the tree into a skewed linear linked list.`,
      examples: `Binary Search Tree (BST):

         [ 8 ]
        /     \\
      [ 3 ]   [ 10 ]
      /   \\        \\
    [ 1 ]  [ 6 ]   [ 14 ]

Search for 6:
1. Compare with 8: 6 < 8 -> Go Left to 3.
2. Compare with 3: 6 > 3 -> Go Right to 6.
3. Compare with 6: 6 === 6 -> Found in 3 comparisons!`,
      keyTakeaways: `• BST Rule: Left Subtree < Root < Right Subtree.
• Inorder traversal on any BST produces elements in strictly sorted order.
• Search/Insert/Delete takes O(log n) average time on balanced trees.
• Skewed BSTs can degrade to O(n) linear performance.`,
      checkpoint: {
        question: 'State the BST ordering property, and explain why searching in a balanced BST takes O(log n) time.',
        expectedKeywords: ['left < root', 'right > root', 'smaller', 'greater', 'halves', 'discard', 'O(log n)', 'binary search'],
      },
    },

    {
      title: 'Tree Applications, Maximum Depth, and Complexity',
      content: `Trees are widely used across computing architectures and algorithms:

1. **System & Engineering Applications**:
   - **DOM (Document Object Model)**: Web browsers parse HTML into a tree of DOM nodes.
   - **File Systems**: Hierarchical directories and files.
   - **Database Indexing**: B-Trees and B+ Trees index millions of rows in relational databases.
   - **Abstract Syntax Trees (AST)**: Compilers parse source code into AST trees for syntax validation and code generation.
   - **Heaps & Priority Queues**: Complete binary trees used in Heapsort and Dijkstra shortest path algorithm.

2. **Calculating Maximum Depth (Height) Recursively**:
   - maxDepth(root) = 1 + Math.max(maxDepth(root.left), maxDepth(root.right))
   - Base case: if (!root) return 0.`,
      examples: `Recursive Maximum Depth Implementation:

function maxDepth(root) {
  if (root === null) return 0; // Base case: empty tree has depth 0
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);
  return 1 + Math.max(leftDepth, rightDepth);
}

// Inverting a Binary Tree:
function invertTree(root) {
  if (!root) return null;
  const temp = root.left;
  root.left = invertTree(root.right);
  root.right = invertTree(temp);
  return root;
}`,
      keyTakeaways: `• Most tree problems are solved elegantly using Divide-and-Conquer recursion.
• Max depth is calculated as 1 + Math.max(leftDepth, rightDepth).
• Trees power real-world systems including B-tree DB indices, DOM trees, and ASTs.`,
      checkpoint: {
        question: 'Write the recursive formula or logic to compute the maximum depth of a binary tree given its root node.',
        expectedKeywords: ['base case', 'null', '0', '1 + max', 'left', 'right', 'depth', 'recursive'],
      },
    },
  ],

  doubts: [
    {
      keywords: ['depth vs height', 'difference between depth and height', 'height vs depth'],
      answer: 'Depth measures the number of edges from the ROOT down to a specific node (Root depth = 0). Height measures the number of edges on the longest path from a node down to a LEAF (Leaf height = 0). The height of the whole tree is the height of its root.',
    },
    {
      keywords: ['why is inorder left root right', 'inorder traversal', 'why inorder', 'how inorder works'],
      answer: 'Inorder traversal visits `Left -> Root -> Right`. By visiting all smaller nodes in the left subtree first, then the root itself, and finally all larger nodes in the right subtree, it systematically processes nodes in ascending order in a Binary Search Tree.',
    },
    {
      keywords: ['remember preorder', 'how to remember preorder', 'preorder mnemonic'],
      answer: 'Remember "PRE" means "BEFORE": the ROOT is processed *before* its children (`Root -> Left -> Right`). In contrast, "IN" means root is *in-between* children (`Left -> Root -> Right`), and "POST" means root is *after* children (`Left -> Right -> Root`).',
    },
    {
      keywords: ['bst sorted order', 'why bst gives sorted', 'inorder bst sorted'],
      answer: 'A BST enforces the rule that `Left < Root < Right`. Inorder traversal visits the left subtree (all smaller elements), then the root (middle value), then the right subtree (all larger elements). Recursively applying this produces the complete set of values in sorted ascending order.',
    },
    {
      keywords: ['what makes a tree binary', 'definition of binary tree', 'why called binary tree'],
      answer: 'A tree is called a *Binary* Tree because each node can have at most TWO children (traditionally designated as `left` and `right`). If a node could have three or more children, it would be a multi-way or N-ary tree.',
    },
  ],

  // Prebuilt quiz (10 structured questions mapped across all 6 concepts)
  quiz: {
    title: 'Binary Tree Mastery Assessment',
    questions: [
      {
        id: 'bt_q1',
        conceptIndex: 1,
        conceptTitle: 'Tree Fundamentals: Hierarchical Structure & Terminology',
        type: 'single_select',
        question: 'How many edges are in any valid tree data structure containing N nodes?',
        options: [
          { value: 'A', label: 'N', feedback: 'A tree with N nodes cannot have N edges without forming a cycle.' },
          { value: 'B', label: 'N - 1', feedback: 'Correct! Every node except the root has exactly one incoming parent edge, so total edges = N - 1.' },
          { value: 'C', label: 'N + 1', feedback: 'A tree with N + 1 edges would contain cycles.' },
          { value: 'D', label: '2N', feedback: 'Trees are minimally connected acyclic graphs.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'In a tree with N nodes, every node except the root has exactly one unique parent edge entering it. Therefore, there are exactly N - 1 edges.',
        hint: 'Which node in a tree has NO incoming edge from a parent?',
      },
      {
        id: 'bt_q2',
        conceptIndex: 2,
        conceptTitle: 'Binary Tree Properties & Node Representation',
        type: 'single_select',
        question: 'What is the maximum number of children any node in a Binary Tree can possess?',
        options: [
          { value: 'A', label: '1 child', feedback: 'A tree with at most 1 child is a degenerate linked list.' },
          { value: 'B', label: '2 children (left and right)', feedback: 'Correct! By definition, each node in a binary tree has at most two children.' },
          { value: 'C', label: '3 children', feedback: 'A tree with 3 children is a ternary tree.' },
          { value: 'D', label: 'Unlimited children', feedback: 'That is a general or N-ary tree.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'The prefix "Binary" means two: every node in a binary tree has 0, 1, or 2 children, conventionally called `left` and `right`.',
        hint: 'What does "Binary" mean in computer science?',
      },
      {
        id: 'bt_q3',
        conceptIndex: 3,
        conceptTitle: 'Depth-First Search (DFS) Traversals: Preorder, Inorder, Postorder',
        type: 'single_select',
        question: 'In which traversal order is the Root node visited BEFORE its left and right subtrees?',
        options: [
          { value: 'A', label: 'Preorder Traversal (Root -> Left -> Right)', feedback: 'Correct! "Pre" signifies processing the root before any subtrees.' },
          { value: 'B', label: 'Inorder Traversal (Left -> Root -> Right)', feedback: 'Inorder visits the left subtree before the root.' },
          { value: 'C', label: 'Postorder Traversal (Left -> Right -> Root)', feedback: 'Postorder visits the root after both subtrees.' },
          { value: 'D', label: 'Level Order Traversal', feedback: 'Level order visits nodes row-by-row.' },
        ],
        correctAnswer: 'A',
        explanation: 'Preorder traversal visits `Root -> Left -> Right`. It is frequently used for creating copies/clones of a tree or serializing hierarchy.',
        hint: 'The prefix "Pre" means before.',
      },
      {
        id: 'bt_q4',
        conceptIndex: 3,
        conceptTitle: 'Depth-First Search (DFS) Traversals: Preorder, Inorder, Postorder',
        type: 'single_select',
        question: 'In a Binary Search Tree (BST), which traversal order is guaranteed to visit all node keys in strictly ascending sorted order?',
        options: [
          { value: 'A', label: 'Preorder Traversal', feedback: 'Preorder visits the root first, which is not the minimum value.' },
          { value: 'B', label: 'Inorder Traversal (Left -> Root -> Right)', feedback: 'Correct! Visiting all smaller values in left subtree, then root, then larger values in right subtree produces sorted order.' },
          { value: 'C', label: 'Postorder Traversal', feedback: 'Postorder visits leaves first, not sorted order.' },
          { value: 'D', label: 'Level Order Traversal', feedback: 'Level order visits by depth levels.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Because a BST enforces `Left < Root < Right`, Inorder traversal visits items in ascending numeric order.',
        hint: 'Which traversal puts the Root in between the smaller Left values and larger Right values?',
      },
      {
        id: 'bt_q5',
        conceptIndex: 4,
        conceptTitle: 'Breadth-First Search (BFS) / Level Order Traversal',
        type: 'single_select',
        question: 'Which auxiliary data structure is standard for implementing Level Order (BFS) traversal iteratively?',
        options: [
          { value: 'A', label: 'Stack (LIFO)', feedback: 'A stack produces Depth-First Search (DFS).' },
          { value: 'B', label: 'Queue (FIFO)', feedback: 'Correct! A FIFO Queue processes nodes level by level in the exact order they are discovered.' },
          { value: 'C', label: 'Priority Queue (Heap)', feedback: 'A priority queue orders by priority value, not tree level.' },
          { value: 'D', label: 'Hash Set', feedback: 'A hash set only tracks membership, not FIFO sequence.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'Level Order traversal enqueues the root, then repeatedly dequeues a node and enqueues its left and right children using a First-In, First-Out (FIFO) Queue.',
        hint: 'Which data structure enforces First-In, First-Out ordering?',
      },
      {
        id: 'bt_q6',
        conceptIndex: 5,
        conceptTitle: 'Binary Search Tree (BST) Properties & Operations',
        type: 'single_select',
        question: 'What is the average time complexity to search for a key in a balanced Binary Search Tree with n nodes?',
        options: [
          { value: 'A', label: 'O(1)', feedback: 'O(1) lookup is achieved by Hash Tables, not tree comparisons.' },
          { value: 'B', label: 'O(log n)', feedback: 'Correct! In a balanced BST, each comparison halves the remaining search tree in O(log n) time.' },
          { value: 'C', label: 'O(n)', feedback: 'O(n) occurs only in worst-case degenerate (skewed) trees.' },
          { value: 'D', label: 'O(n log n)', feedback: 'O(n log n) is for sorting all nodes.' },
        ],
        correctAnswer: 'B',
        correctOptionIndex: 1,
        explanation: 'In a balanced BST, tree height is log2(n). At each step, comparing target with `node.val` eliminates either the left or right subtree, yielding O(log n) average time.',
        hint: 'Like Binary Search on an array, each step halves the remaining candidate nodes.'
      },
      {
        id: 'bt_q7',
        conceptIndex: 5,
        conceptTitle: 'Binary Search Tree (BST) Properties & Operations',
        type: 'single_select',
        question: 'What is the fundamental invariant of a valid Binary Search Tree (BST)?',
        options: [
          { value: 'A', label: 'All nodes in the left subtree must be strictly less than the root, and all nodes in the right subtree must be strictly greater than the root', feedback: 'Correct! This property must hold recursively for EVERY node in the tree.' },
          { value: 'B', label: 'The tree must have all leaves on the same level', feedback: 'That describes a perfect binary tree, not BST property.' },
          { value: 'C', label: 'The root value must always be zero', feedback: 'Node values can be any comparable values.' },
          { value: 'D', label: 'Every node must have exactly two children', feedback: 'BST nodes can have 0, 1, or 2 children.' },
        ],
        correctAnswer: 'A',
        explanation: 'A BST satisfies `max(LeftSubtree) < Root < min(RightSubtree)` for every node across the entire tree hierarchy.',
        hint: 'How are keys organized relative to the parent node?',
      },
      {
        id: 'bt_q8',
        conceptIndex: 6,
        conceptTitle: 'Common Tree Problems: Max Depth, Invert Tree, and Validation',
        type: 'single_select',
        question: 'How is the Maximum Depth (Height) of a binary tree computed recursively?',
        options: [
          { value: 'A', label: '`maxDepth(root) = 1 + Math.max(maxDepth(root.left), maxDepth(root.right))` (with base case null -> 0)', feedback: 'Correct! The depth of a node is 1 plus the maximum depth of its two subtrees.' },
          { value: 'B', label: '`maxDepth(root) = maxDepth(root.left) + maxDepth(root.right)`', feedback: 'Summing depths counts total nodes instead of longest path.' },
          { value: 'C', label: '`maxDepth(root) = Math.min(maxDepth(root.left), maxDepth(root.right))`', feedback: 'Min calculates minimum depth, not maximum depth.' },
          { value: 'D', label: '`maxDepth(root) = root.val`', feedback: 'Depth is a structural count of levels, not node value.' },
        ],
        correctAnswer: 'A',
        explanation: 'Max depth equals the longest path from root to leaf: compute depth of left and right subtrees, take the larger one, and add 1 for the current node.',
        hint: 'What is 1 plus the larger of the two subtree depths?',
      },
      {
        id: 'bt_q9',
        conceptIndex: 6,
        conceptTitle: 'Common Tree Problems: Max Depth, Invert Tree, and Validation',
        type: 'single_select',
        question: 'When Inverting (Mirroring) a Binary Tree, what operation is performed at each node?',
        options: [
          { value: 'A', label: 'Swap `node.left` and `node.right` pointers, then recursively invert both subtrees', feedback: 'Correct! Swapping left and right child pointers at every level mirrors the tree structure.' },
          { value: 'B', label: 'Multiply node values by -1', feedback: 'Inverting modifies tree structure pointers, not numeric values.' },
          { value: 'C', label: 'Delete all leaf nodes', feedback: 'Leaf nodes are preserved in mirrored positions.' },
          { value: 'D', label: 'Reverse the node values using an array', feedback: 'Tree inversion swaps left and right child references directly.' },
        ],
        correctAnswer: 'A',
        explanation: 'Inverting a binary tree swaps the left child and right child pointers for every node throughout the tree recursively.',
        hint: 'Think about swapping the left and right child references.',
      },
      {
        id: 'bt_q10',
        conceptIndex: 1,
        conceptTitle: 'Tree Fundamentals: Hierarchical Structure & Terminology',
        type: 'single_select',
        question: 'What is a **Leaf Node** in a tree?',
        options: [
          { value: 'A', label: 'A node that has zero children (both left and right are null)', feedback: 'Correct! Leaf nodes are the terminal boundary nodes of the tree.' },
          { value: 'B', label: 'The top-most node with no parent', feedback: 'The top-most node with no parent is the Root node.' },
          { value: 'C', label: 'A node with exactly one child', feedback: 'A node with one child is an internal node.' },
          { value: 'D', label: 'A node containing the maximum value', feedback: 'A leaf can hold any value.' },
        ],
        correctAnswer: 'A',
        explanation: 'A leaf node (or external node) is any node that has no children (`left === null && right === null`).',
        hint: 'What does a leaf on a real tree represent at the end of a branch?',
      },
    ],
  },

  assignment: {
    title: 'Binary Tree Mastery Assignment',
    description: 'Personalized practice questions targeting tree traversals (DFS/BFS), BST invariants, tree depth, and mirror inversion.',
    difficulty: 'developing',
  },
};

// ─── Prebuilt Question Bank for Binary Tree Concepts ─────────────────────────
const BINARY_TREE_QUESTION_BANK = [
  // Concept 1: Tree Fundamentals: Hierarchical Structure & Terminology
  {
    conceptTitleMatch: 'fundamentals',
    fallbackIndex: 0,
    questions: [
      {
        question: 'What is the difference between Node Depth and Node Height in a Tree?',
        options: [
          { value: 'A', label: 'Depth is the number of edges from the ROOT down to the node; Height is the number of edges on the longest path from the node down to a LEAF.' },
          { value: 'B', label: 'Depth and Height are completely identical terms.' },
          { value: 'C', label: 'Height is measured from the root; Depth is measured from the leaves.' },
          { value: 'D', label: 'Depth measures node values while Height measures byte sizes.' }
        ],
        correctAnswer: 'A',
        explanation: 'Depth measures top-down distance from the Root (Root depth = 0). Height measures bottom-up distance from the deepest Leaf (Leaf height = 0).',
        hint: 'Depth goes top-down from root; Height goes bottom-up from leaves.'
      },
      {
        question: 'Why is a Tree classified as a Non-Linear, Hierarchical data structure?',
        options: [
          { value: 'A', label: 'Elements are arranged in parent-child relationships with branching pathways rather than in a single sequential line.' },
          { value: 'B', label: 'Because it cannot be stored in RAM.' },
          { value: 'C', label: 'Because all node keys must be prime numbers.' },
          { value: 'D', label: 'Because it requires circular pointers.' }
        ],
        correctAnswer: 'A',
        explanation: 'Unlike arrays, stacks, and linked lists (which are linear), trees branch out from a root node into subtrees, modeling hierarchies (like DOM trees or file systems).',
        hint: 'Think about how a parent node branches into multiple child subtrees.'
      }
    ]
  },

  // Concept 2: Binary Tree Properties & Node Representation
  {
    conceptTitleMatch: 'properties',
    fallbackIndex: 1,
    questions: [
      {
        question: 'In a Full Binary Tree with depth D (where root is at depth 0), what is the maximum number of nodes at depth D?',
        options: [
          { value: 'A', label: '`2^D`' },
          { value: 'B', label: '`2D`' },
          { value: 'C', label: '`D^2`' },
          { value: 'D', label: '`D + 1`' }
        ],
        correctAnswer: 'A',
        explanation: 'At depth 0: 2^0 = 1 node. At depth 1: 2^1 = 2 nodes. At depth 2: 2^2 = 4 nodes. At depth D, the maximum number of nodes is 2^D.',
        hint: 'Each level doubles the capacity of the previous level.'
      },
      {
        question: 'How is a Binary Tree node conventionally represented in JavaScript?',
        options: [
          { value: 'A', label: '`class TreeNode { constructor(val) { this.val = val; this.left = null; this.right = null; } }`' },
          { value: 'B', label: '`class TreeNode { constructor(val) { this.data = [val]; } }`' },
          { value: 'C', label: '`let node = { top: 0, bottom: 0 };`' },
          { value: 'D', label: '`let node = [left, right];`' }
        ],
        correctAnswer: 'A',
        explanation: 'A binary tree node encapsulates its payload `val` and two pointer fields: `left` and `right`, both initialized to `null`.',
        hint: 'What two child pointers does a binary tree node store?'
      }
    ]
  },

  // Concept 3: Depth-First Search (DFS) Traversals: Preorder, Inorder, Postorder
  {
    conceptTitleMatch: 'dfs',
    fallbackIndex: 2,
    questions: [
      {
        question: 'Given binary tree with Root `A`, Left child `B`, Right child `C`, what are the Preorder, Inorder, and Postorder traversal outputs?',
        options: [
          { value: 'A', label: 'Preorder: A-B-C; Inorder: B-A-C; Postorder: B-C-A' },
          { value: 'B', label: 'Preorder: B-A-C; Inorder: A-B-C; Postorder: C-B-A' },
          { value: 'C', label: 'Preorder: C-B-A; Inorder: B-C-A; Postorder: A-B-C' },
          { value: 'D', label: 'Preorder: A-C-B; Inorder: A-B-C; Postorder: B-A-C' }
        ],
        correctAnswer: 'A',
        explanation: 'Preorder: Root(A)->Left(B)->Right(C) = A,B,C. Inorder: Left(B)->Root(A)->Right(C) = B,A,C. Postorder: Left(B)->Right(C)->Root(A) = B,C,A.',
        hint: 'Pre = Root first; In = Root in middle; Post = Root last.'
      },
      {
        question: 'Why is Postorder traversal (Left -> Right -> Root) used when deleting a tree or calculating directory sizes?',
        options: [
          { value: 'A', label: 'Because you must process/free both subtrees BEFORE you can safely process or delete the parent root.' },
          { value: 'B', label: 'Because Postorder is faster than Inorder.' },
          { value: 'C', label: 'Because Postorder requires zero stack memory.' },
          { value: 'D', label: 'Because Postorder automatically sorts files.' }
        ],
        correctAnswer: 'A',
        explanation: 'To compute total folder size or free tree memory, children must be aggregated or freed first before discarding the parent node.',
        hint: 'Can you delete a parent node before deleting its children without memory leaks?'
      }
    ]
  },

  // Concept 4: Breadth-First Search (BFS) / Level Order Traversal
  {
    conceptTitleMatch: 'bfs',
    fallbackIndex: 3,
    questions: [
      {
        question: 'In Level Order traversal, how do you group nodes level-by-level into subarrays (e.g. `[[1], [2, 3], [4, 5]]`)?',
        options: [
          { value: 'A', label: 'Capture `const levelSize = queue.length` at the start of each level loop and dequeue exactly that many nodes.' },
          { value: 'B', label: 'Use recursion with an array of length 2.' },
          { value: 'C', label: 'Sort all nodes by memory address.' },
          { value: 'D', label: 'Empty the queue into a hash map.' }
        ],
        correctAnswer: 'A',
        explanation: 'Capturing `queue.length` before pushing children lets you loop through all nodes in the current level as a discrete batch.',
        hint: 'How do you know how many nodes belong to the current horizontal level?'
      },
      {
        question: 'What is the Space Complexity of Level Order Traversal on a balanced binary tree of n nodes?',
        options: [
          { value: 'A', label: 'O(n) because the queue must hold all nodes on the widest level (up to n/2 nodes at the leaf level).' },
          { value: 'B', label: 'O(1) auxiliary space.' },
          { value: 'C', label: 'O(log n) maximum queue size.' },
          { value: 'D', label: 'O(n^2).' }
        ],
        correctAnswer: 'A',
        explanation: 'In a balanced binary tree, the bottom leaf level contains n/2 nodes. The BFS queue holds up to O(n) nodes at maximum width.',
        hint: 'How many leaf nodes are at the bottom level of a balanced tree with n total nodes?'
      }
    ]
  },

  // Concept 5: Binary Search Tree (BST) Properties & Operations
  {
    conceptTitleMatch: 'bst',
    fallbackIndex: 4,
    questions: [
      {
        question: 'Why does validating a BST require passing `min` and `max` constraints recursively rather than just checking `node.val > node.left.val && node.val < node.right.val`?',
        options: [
          { value: 'A', label: 'Because checking only immediate children fails if a right subtree contains a deeply nested node smaller than an ancestor root.' },
          { value: 'B', label: 'Because JavaScript cannot compare node values directly.' },
          { value: 'C', label: 'Because trees can have negative numbers.' },
          { value: 'D', label: 'Because min and max speed up the compiler.' }
        ],
        correctAnswer: 'A',
        explanation: 'A classic trap: in `[10, 5, 15, null, null, 6, 20]`, 6 > 15 is false, but 6 is in the right subtree of 10! A node must satisfy bounds imposed by ALL ancestors.',
        hint: 'Think about a node in the right subtree that is smaller than the root node.'
      },
      {
        question: 'How is a new key inserted into a Binary Search Tree?',
        options: [
          { value: 'A', label: 'Compare key with root: if smaller, recurse left; if larger, recurse right; attach new node when reaching null.' },
          { value: 'B', label: 'Always insert at the root and push existing nodes down.' },
          { value: 'C', label: 'Insert at random leaf position.' },
          { value: 'D', label: 'Insert at the head of a queue.' }
        ],
        correctAnswer: 'A',
        explanation: 'BST insertion navigates down the tree following `val < node.val` (left) or `val > node.val` (right) until hitting a null reference where the new leaf attaches.',
        hint: 'Follow the BST ordering invariant until an empty slot is reached.'
      }
    ]
  },

  // Concept 6: Common Tree Problems: Max Depth, Invert Tree, and Validation
  {
    conceptTitleMatch: 'problems',
    fallbackIndex: 5,
    questions: [
      {
        question: 'How do you check if two binary trees `p` and `q` are **Same Tree (Identical)**?',
        options: [
          { value: 'A', label: '`if (!p && !q) return true; if (!p || !q || p.val !== q.val) return false; return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);`' },
          { value: 'B', label: '`return p === q;`' },
          { value: 'C', label: 'Compare their total node counts only.' },
          { value: 'D', label: 'Compare only root values.' }
        ],
        correctAnswer: 'A',
        explanation: 'Two trees are identical if both are null, or both are non-null with identical values and recursively identical left and right subtrees.',
        hint: 'Base cases: both null = true, one null = false, values match + both subtrees match.'
      },
      {
        question: 'What is the time complexity of Inverting a Binary Tree with n nodes?',
        options: [
          { value: 'A', label: 'O(n) time because every node in the tree is visited exactly once to swap its child pointers.' },
          { value: 'B', label: 'O(log n) time.' },
          { value: 'C', label: 'O(n^2) time.' },
          { value: 'D', label: 'O(1) time.' }
        ],
        correctAnswer: 'A',
        explanation: 'Invert tree visits each of the n nodes once, performing an O(1) swap on `left` and `right`, giving linear O(n) runtime.',
        hint: 'How many nodes must be visited to swap every left and right pointer?'
      }
    ]
  }
];

/**
 * Deterministically generates a personalized 8-question assignment for Binary Tree
 * weighted heavily towards the student's weakest concepts.
 */
function generatePrebuiltBinaryTreeAssignment(conceptsList = [], weakConceptsList = [], snapshot = {}) {
  const getConcept = (matchStr, fallbackIdx) => {
    const found = (conceptsList || []).find((c) =>
      (c.title || '').toLowerCase().includes(matchStr.toLowerCase())
    );
    return found || conceptsList[fallbackIdx] || { id: fallbackIdx + 1, title: 'Binary Tree Concept' };
  };

  const weakTitles = (weakConceptsList || []).map((w) => (w.title || w.conceptTitle || '').toLowerCase());
  const isBstWeak = weakTitles.some((t) => t.includes('bst') || t.includes('search tree'));
  const isDfsWeak = weakTitles.some((t) => t.includes('dfs') || t.includes('traversal') || t.includes('inorder'));
  const isProblemsWeak = weakTitles.some((t) => t.includes('depth') || t.includes('invert') || t.includes('validation'));

  const questions = [];
  let qCounter = 1;

  const fundamentalsConcept = getConcept('fundamentals', 0);
  const propertiesConcept = getConcept('properties', 1);
  const dfsConcept = getConcept('dfs', 2);
  const bfsConcept = getConcept('bfs', 3);
  const bstConcept = getConcept('bst', 4);
  const problemsConcept = getConcept('problem', 5);

  if (isBstWeak || isDfsWeak) {
    // Heavy focus on BST & DFS Traversals
    BINARY_TREE_QUESTION_BANK[4].questions.forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: bstConcept.id,
        conceptTitle: bstConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    BINARY_TREE_QUESTION_BANK[2].questions.forEach((q) => {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: dfsConcept.id,
        conceptTitle: dfsConcept.title,
        type: 'multiple_choice',
        ...q,
      });
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: problemsConcept.id,
      conceptTitle: problemsConcept.title,
      type: 'multiple_choice',
      ...BINARY_TREE_QUESTION_BANK[5].questions[0],
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: bfsConcept.id,
      conceptTitle: bfsConcept.title,
      type: 'multiple_choice',
      ...BINARY_TREE_QUESTION_BANK[3].questions[0],
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: propertiesConcept.id,
      conceptTitle: propertiesConcept.title,
      type: 'multiple_choice',
      ...BINARY_TREE_QUESTION_BANK[1].questions[0],
    });

    questions.push({
      id: `q${qCounter++}`,
      conceptId: fundamentalsConcept.id,
      conceptTitle: fundamentalsConcept.title,
      type: 'multiple_choice',
      ...BINARY_TREE_QUESTION_BANK[0].questions[0],
    });
  } else {
    // Balanced distribution
    BINARY_TREE_QUESTION_BANK.forEach((group, gIdx) => {
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

    if (BINARY_TREE_QUESTION_BANK[4].questions[1]) {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: bstConcept.id,
        conceptTitle: bstConcept.title,
        type: 'multiple_choice',
        ...BINARY_TREE_QUESTION_BANK[4].questions[1],
      });
    }
    if (BINARY_TREE_QUESTION_BANK[2].questions[1]) {
      questions.push({
        id: `q${qCounter++}`,
        conceptId: dfsConcept.id,
        conceptTitle: dfsConcept.title,
        type: 'multiple_choice',
        ...BINARY_TREE_QUESTION_BANK[2].questions[1],
      });
    }
  }

  const finalQuestions = questions.slice(0, 8);
  const focusTitle = snapshot.weakConcepts?.[0]?.conceptTitle || (isBstWeak ? 'BST Invariants & Search' : 'Tree Traversals & Depth Recursion');

  return {
    topic: 'Binary Tree',
    title: 'Personalized Binary Tree Practice',
    description: `Personalized 8-question practice set based on your completed learning session. Focus area: ${focusTitle}.`,
    difficulty: snapshot.difficulty || 'developing',
    sessionMastery: snapshot.overallMastery || 73,
    focusConcepts: snapshot.weakConcepts && snapshot.weakConcepts.length > 0 ? snapshot.weakConcepts : [
      { conceptId: bstConcept.id, conceptTitle: bstConcept.title, mastery: 45 }
    ],
    strongConcepts: snapshot.strongConcepts && snapshot.strongConcepts.length > 0 ? snapshot.strongConcepts : [
      { conceptId: fundamentalsConcept.id, conceptTitle: fundamentalsConcept.title, mastery: 94 }
    ],
    questions: finalQuestions,
  };
}

function gradeBinaryTreeAnswer(checkpoint, answer) {
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
    ? `Outstanding answer! You clearly explained the Binary Tree concepts (${matches}/${total} key points addressed).`
    : `Good attempt, but your answer could be improved. Mention tree hierarchy, left/right subtrees, root/leaf properties, or traversal rules (${matches}/${total} key points found).`;

  return { isCorrect, score, feedback };
}

function evaluateBinaryTreeDoubt(question) {
  if (!question || typeof question !== 'string') return null;
  const qLower = question.toLowerCase();
  for (const resp of binaryTreeData.doubts) {
    if (resp.keywords.some((kw) => qLower.includes(kw.toLowerCase()))) {
      return resp.answer;
    }
  }
  return null;
}

function evaluateBinaryTreeAssignment(submission) {
  if (!submission || submission.trim().length < 50) {
    return { score: 30, feedback: 'Your submission is very short. Make sure to complete all tasks.' };
  }
  const sub = submission.toLowerCase();
  let score = 50;
  const feedbackPoints = [];

  if (sub.includes('treenode') || (sub.includes('left') && sub.includes('right'))) {
    score += 20;
    feedbackPoints.push('✓ Binary tree node structure and child links are well defined.');
  }
  if (sub.includes('inorder') || sub.includes('preorder') || sub.includes('postorder') || sub.includes('traversal')) {
    score += 15;
    feedbackPoints.push('✓ DFS / Inorder tree traversal mechanics recognized.');
  }
  if (sub.includes('maxdepth') || sub.includes('bst') || sub.includes('invert') || sub.includes('queue')) {
    score += 15;
    feedbackPoints.push('✓ Recursive depth / BST search / level-order pattern understood.');
  }

  score = Math.min(100, score);
  const feedback = feedbackPoints.length > 0
    ? feedbackPoints.join(' ') + (score < 80 ? ' Review base case checks for null root nodes.' : ' Great work!')
    : 'Partial submission detected. Ensure you completed all binary tree tasks with working code.';

  return { score, feedback };
}

module.exports = {
  binaryTreeData,
  gradeBinaryTreeAnswer,
  evaluateBinaryTreeDoubt,
  evaluateBinaryTreeAssignment,
  generatePrebuiltBinaryTreeAssignment,
};
