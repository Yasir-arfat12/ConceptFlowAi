# ConceptFlow AI — Pre-Fed DSA Learning Topics Reference

## Overview

ConceptFlow AI provides deterministic, offline-ready DSA curriculum tracks that function fully without reliance on external LLM APIs (OpenRouter / Qwen). Each supported topic is persisted in PostgreSQL as an ordered learning path containing 6 interactive concepts, checkpoint knowledge checks, contextual doubt fallbacks, and dashboard synchronization.

---

## 1. Supported DSA Topics Matrix

| Topic | Category | Concepts | Checkpoints Per Concept | Offline Ready |
| :--- | :--- | :---: | :---: | :---: |
| **Binary Search** | Algorithms (Searching) | 6 | 1–2 | Yes |
| **Stack** | Data Structures (Linear) | 6 | 1–2 | Yes |
| **Linked List** | Data Structures (Linear/Dynamic) | 6 | 1–2 | Yes |
| **Binary Tree** | Data Structures (Hierarchical) | 6 | 1–2 | Yes |

---

## 2. Topic Breakdown

### A. Binary Search
- **Canonical Title**: `Binary Search`
- **Category**: Algorithms
- **Description**: Master divide-and-conquer searching on sorted arrays, two-pointer bounds calculation, overflow prevention, and edge cases in $O(\log n)$ time.
- **Milestones**:
  1. Searching Basics and Why Sorted Data Matters
  2. Binary Search Intuition
  3. Pointer Mechanics and Mid Calculation
  4. Algorithm Implementation and Loop Invariants
  5. Edge Cases, Duplicates, and Finding Boundaries
  6. Time Complexity, Variations and Applications

---

### B. Stack
- **Canonical Title**: `Stack`
- **Category**: Data Structures
- **Description**: Master the Last-In-First-Out (LIFO) data structure, core push/pop/peek operations, memory stack frames, expression parsing, and monotonic stacks.
- **Milestones**:
  1. Stack Fundamentals & LIFO Principle
  2. Core Stack Operations: Push, Pop, Peek, and IsEmpty
  3. Stack Implementation: Array vs Linked List
  4. Practical Applications of Stacks (Call Stack, Bracket Validation)
  5. Monotonic Stacks and Classic Problems
  6. Time & Space Complexity Summary and Edge Cases

---

### C. Linked List
- **Canonical Title**: `Linked List`
- **Category**: Data Structures
- **Description**: Understand linear dynamic node collections, pointer navigation, head/tail references, insertion/deletion mechanisms, reversal algorithms, and edge-case handling.
- **Milestones**:
  1. Linked List Fundamentals & Dynamic Memory
  2. Linked List Traversal and Linear Access
  3. Insertion Operations: Head, Tail, and Middle
  4. Deletion Operations and Garbage Collection
  5. Reversing a Singly Linked List (Three-Pointer Method)
  6. Linked List Types, Fast/Slow Pointers, and Complexity

---

### D. Binary Tree
- **Canonical Title**: `Binary Tree`
- **Category**: Data Structures
- **Description**: Master hierarchical tree structures, root/child/leaf relationships, tree traversals (Preorder, Inorder, Postorder, Level Order), Binary Search Trees (BST), and recursive tree algorithms.
- **Milestones**:
  1. Tree Fundamentals and Hierarchical Data Structures
  2. Binary Tree Structure and Node Anatomy
  3. Tree Terminology: Height, Depth, Level, and Ancestors
  4. Tree Traversals: Preorder, Inorder, Postorder, and Level Order
  5. Binary Search Tree (BST) Properties and Search
  6. Tree Applications, Maximum Depth, and Complexity

---

## 3. Demo Planner Queries

The ConceptFlow Planner automatically recognizes natural language inputs and maps them to the canonical curriculum:

### Binary Search
- `"Teach me Binary Search"`
- `"Learn Binary Search from basics"`
- `"Help me master Binary Search"`
- `"Binary Search algorithm"`

### Stack
- `"Teach me Stack"`
- `"Learn Stack from basics"`
- `"Help me understand Stack"`
- `"DSA Stack"`

### Linked List
- `"Teach me Linked List"`
- `"Learn Linked List from basics"`
- `"Help me master Linked Lists"`
- `"Singly linked list"`

### Binary Tree
- `"Teach me Binary Tree"`
- `"Learn Binary Tree from basics"`
- `"Help me understand Binary Trees"`
- `"Binary Tree and BST"`

---

## 4. Demo Contextual Doubts

Inside any concept, the doubt panel evaluates student queries against contextual explanations without modifying progression state:

### Stack Doubts
- *"Why does a stack use LIFO?"*
- *"What is the difference between pop and peek?"*
- *"Why is push usually O(1)?"*
- *"Why are stacks used in recursion?"*
- *"How does a stack help with balanced parentheses?"*

### Linked List Doubts
- *"Why do we need the head pointer?"*
- *"Why do we save current.next before reversing?"*
- *"What happens if the linked list is empty?"*
- *"Why is insertion at the head O(1)?"*
- *"Why can't we access a linked list element directly like an array?"*

### Binary Tree Doubts
- *"What is the difference between depth and height?"*
- *"Why is inorder traversal left root right?"*
- *"How do I remember preorder?"*
- *"Why does inorder traversal of a BST produce sorted values?"*
- *"What makes a tree a binary tree?"*

### Binary Search Doubts
- *"Why does binary search require sorted data?"*
- *"Why do we calculate mid this way?"*
- *"Why do we use mid + 1?"*
- *"Why is binary search O(log n)?"*

---

## 5. PostgreSQL Inspection Queries (pgAdmin / psql)

### A. List All Active Learning Sessions
```sql
SELECT 
  id AS session_id,
  user_id,
  topic,
  status,
  progress_percentage,
  current_concept_id,
  created_at,
  updated_at
FROM learning_sessions
ORDER BY created_at DESC;
```

### B. List Concepts for a Given Topic (e.g., Stack)
```sql
SELECT 
  s.id AS session_id,
  s.topic,
  c.id AS concept_id,
  c.order_index,
  c.title,
  c.status,
  c.score,
  c.completed_at
FROM learning_sessions s
JOIN learning_concepts c ON c.session_id = s.id
WHERE LOWER(s.topic) LIKE '%stack%'
ORDER BY s.id, c.order_index;
```

### C. List Concepts for Linked List
```sql
SELECT 
  s.id AS session_id,
  s.topic,
  c.id AS concept_id,
  c.order_index,
  c.title,
  c.status,
  c.score
FROM learning_sessions s
JOIN learning_concepts c ON c.session_id = s.id
WHERE LOWER(s.topic) LIKE '%linked list%'
ORDER BY s.id, c.order_index;
```

### D. List Concepts for Binary Tree
```sql
SELECT 
  s.id AS session_id,
  s.topic,
  c.id AS concept_id,
  c.order_index,
  c.title,
  c.status,
  c.score
FROM learning_sessions s
JOIN learning_concepts c ON c.session_id = s.id
WHERE LOWER(s.topic) LIKE '%tree%'
ORDER BY s.id, c.order_index;
```

### E. List Concepts for Binary Search
```sql
SELECT 
  s.id AS session_id,
  s.topic,
  c.id AS concept_id,
  c.order_index,
  c.title,
  c.status,
  c.score
FROM learning_sessions s
JOIN learning_concepts c ON c.session_id = s.id
WHERE LOWER(s.topic) LIKE '%binary search%'
ORDER BY s.id, c.order_index;
```

### F. List Checkpoints and Expected Keywords
```sql
SELECT 
  cp.id AS checkpoint_id,
  lc.id AS concept_id,
  lc.title AS concept_title,
  cp.question,
  cp.expected_keywords,
  cp.order_index
FROM checkpoints cp
JOIN learning_concepts lc ON lc.id = cp.learning_concept_id
ORDER BY lc.id, cp.order_index;
```

### G. Full End-to-End Hierarchy Join (Topic → Session → Concept → Checkpoint → Responses)
```sql
SELECT 
  ls.id AS session_id,
  ls.topic,
  ls.status AS session_status,
  lc.id AS concept_id,
  lc.order_index AS concept_order,
  lc.title AS concept_title,
  lc.status AS concept_status,
  cp.id AS checkpoint_id,
  cp.question,
  cr.answer_text AS student_answer,
  cr.score AS checkpoint_score,
  cr.is_correct
FROM learning_sessions ls
JOIN learning_concepts lc ON lc.session_id = ls.id
LEFT JOIN checkpoints cp ON cp.learning_concept_id = lc.id
LEFT JOIN checkpoint_responses cr ON cr.checkpoint_id = cp.id
ORDER BY ls.id DESC, lc.order_index, cp.order_index;
```

### H. Inspect Stored Doubt Interactions
```sql
SELECT 
  dm.id AS message_id,
  dm.session_id,
  ls.topic,
  lc.title AS concept_title,
  dm.role,
  dm.message,
  dm.created_at
FROM doubt_messages dm
JOIN learning_sessions ls ON ls.id = dm.session_id
JOIN learning_concepts lc ON lc.id = dm.concept_id
ORDER BY dm.created_at DESC;
```
