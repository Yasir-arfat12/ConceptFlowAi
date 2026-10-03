module.exports = {
  topic: "Binary Search",

  concepts: [
    {
      title: "Searching Basics and Why Sorted Data Matters",
      content: "Searching is the process of finding a specific target element within a collection of data. The simplest approach is Linear Search, which checks every element one by one from start to finish. For an array like [2, 5, 8, 12, 16, 23, 38], finding '16' takes 5 steps.\n\nHowever, if the array is large, Linear Search is very slow (O(n) time). This is where sorting helps. If we know the array is already sorted, we don't have to check every element. We can check the middle element instead. If our target is greater than the middle element, we instantly know that the target cannot be in the left half, and we can completely ignore it. This requires the data to be sorted, otherwise, the target could be anywhere.",
      checkpoint: {
        question: "Why does binary search require the data to be sorted?",
        expectedKeywords: ["discard", "ignore", "half", "know", "order", "larger", "smaller", "compare", "greater", "less"]
      }
    },
    {
      title: "Binary Search Intuition",
      content: "The intuition behind Binary Search is to repeatedly divide the search space in half. Think of searching for a word in a dictionary. You open it to the middle. If the word is alphabetically after the page you are on, you ignore the entire left half of the book and repeat the process on the right half.\n\nWe use two pointers, `left` and `right`, to mark the boundaries of our search space. We calculate the `mid` index. We compare the element at `mid` with our target.\n\nExample:\nArray: [2, 5, 8, 12, 16, 23, 38], Target: 16\n1. left=0, right=6. mid = 3 (value 12).\n2. 12 < 16. The target must be in the right half. We eliminate the left half by moving `left` to `mid + 1`.\n3. left=4, right=6. mid = 5 (value 23).\n4. 23 > 16. The target must be in the left half. We eliminate the right half by moving `right` to `mid - 1`.\n5. left=4, right=4. mid = 4 (value 16). Found it!",
      checkpoint: {
        question: "In the example array [2, 5, 8, 12, 16, 23, 38], if our target was 8, what would happen after we check the first `mid` (which is 12)?",
        expectedKeywords: ["left", "smaller", "right = mid - 1", "eliminate right", "discard right", "move right"]
      }
    },
    {
      title: "The Binary Search Algorithm",
      content: "The iterative binary search algorithm uses a `while` loop that continues as long as `left <= right`. This condition ensures we don't stop until the search space is exhausted.\n\nHere is the core logic:\n1. Find `mid = left + (right - left) // 2`.\n2. If `nums[mid] == target`, we found the answer! Return `mid`.\n3. If `nums[mid] < target`, the target must be to the right, so we update `left = mid + 1`.\n4. If `nums[mid] > target`, the target must be to the left, so we update `right = mid - 1`.\n\nNotice how we use `mid = left + (right - left) // 2` instead of `(left + right) // 2`. This is to prevent integer overflow. In languages with fixed-size integers (like Java or C++), if `left` and `right` are both very large, adding them together could exceed the maximum integer limit before dividing by 2. The subtraction method avoids this.",
      checkpoint: {
        question: "Why do we calculate the middle index using `left + (right - left) // 2` instead of `(left + right) // 2`?",
        expectedKeywords: ["overflow", "limit", "exceed", "maximum", "integer", "large"]
      }
    },
    {
      title: "Implementing Binary Search",
      content: "Let's put the algorithm into code using Python:\n\n```python\ndef binary_search(nums, target):\n    left = 0\n    right = len(nums) - 1\n\n    while left <= right:\n        mid = left + (right - left) // 2\n\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n\n    return -1 # Target not found\n```\n\nNotice that we use `left = mid + 1` and `right = mid - 1`. Because we already checked the element at `mid`, we know it is not the target. Including `mid` in our next search space is redundant and can lead to infinite loops. Thus, we shrink the boundary to completely exclude `mid`.",
      checkpoint: {
        question: "Why do we set `left = mid + 1` and `right = mid - 1` instead of `left = mid` and `right = mid`?",
        expectedKeywords: ["already checked", "infinite loop", "redundant", "exclude", "not the target", "stuck"]
      }
    },
    {
      title: "Boundary Conditions and Edge Cases",
      content: "Standard binary search is powerful, but you must be careful with edge cases:\n- **Empty array:** The loop condition `left <= right` naturally handles this (0 <= -1 is false).\n- **Target not present:** The loop will eventually terminate when `left > right`, returning -1.\n- **Duplicate values:** Standard binary search will return *an* index where the target exists, but not necessarily the first or last occurrence.\n\nVariations of binary search exist to handle duplicates. For example, to find the **first occurrence**, when `nums[mid] == target`, instead of returning immediately, you update `right = mid - 1` to keep searching in the left half to see if an earlier instance exists.\nTo find the **last occurrence**, you update `left = mid + 1` to keep searching in the right half.",
      checkpoint: {
        question: "If an array has duplicate values, how do you modify binary search to find the *first* occurrence of a target?",
        expectedKeywords: ["right = mid - 1", "keep searching left", "don't return", "continue left"]
      }
    },
    {
      title: "Time Complexity, Variations and Applications",
      content: "Binary Search is incredibly fast. Because the search space is halved at each step, its Time Complexity is O(log n). For an array of 1,000,000 elements, it takes at most ~20 steps to find a target. The Space Complexity for the iterative version is O(1) as it only uses a few pointers.\n\nBeyond simple arrays, Binary Search can be applied to any monotonic (strictly increasing or decreasing) function. This is known as 'Binary Search on Answer'.\nFor example, if you need to find the minimum capacity of a ship to transport packages within `D` days, you know the capacity must be between the max package weight and the sum of all weights. You can binary search this range, writing a helper function `canDeliver(capacity)` to check if a capacity is valid.",
      checkpoint: {
        question: "What is the time complexity of Binary Search, and roughly how many steps would it take to search an array of 1,000,000 elements?",
        expectedKeywords: ["O(log n)", "log n", "20", "twenty", "logarithmic"]
      }
    }
  ],

  doubts: [
    {
      keywords: ["sorted", "sort"],
      answer: "Binary search relies on the array being sorted so that when we look at the middle element, we can definitively rule out half of the remaining elements. If it wasn't sorted, we wouldn't know which half might contain the target."
    },
    {
      keywords: ["mid + 1", "mid - 1", "plus 1", "minus 1", "infinite loop", "stuck"],
      answer: "We use mid + 1 and mid - 1 because we have already checked the element at the 'mid' index and know it is not the target. Including it in the new search space is redundant and can cause an infinite loop where left and right pointers never cross."
    },
    {
      keywords: ["left <= right", "condition", "loop", "while"],
      answer: "The condition 'left <= right' ensures that we check every possible element, including when the search space narrows down to a single element (when left == right). If we used 'left < right', we might miss the target if it's the very last element being checked."
    },
    {
      keywords: ["not found", "absent", "-1", "return -1"],
      answer: "If the target is not in the array, the search space will keep shrinking until the 'left' pointer eventually becomes greater than the 'right' pointer. When this happens, the while loop (left <= right) terminates, and the function returns -1."
    },
    {
      keywords: ["time complexity", "o(log n)", "fast"],
      answer: "Binary search has a time complexity of O(log n) because at each step, we eliminate half of the remaining search space. This logarithmic behavior makes it extremely fast, even for billions of elements."
    },
    {
      keywords: ["(left + right)", "overflow", "mid calculation"],
      answer: "We use 'left + (right - left) // 2' instead of '(left + right) // 2' to prevent integer overflow. In languages with fixed-size integers, adding two very large indices could exceed the maximum integer value before the division happens."
    },
    {
      keywords: ["first occurrence", "duplicate"],
      answer: "To find the first occurrence of a target in an array with duplicates, you modify the standard binary search. When you find the target (nums[mid] == target), instead of returning immediately, you record the index and set 'right = mid - 1' to keep searching in the left half for an earlier match."
    },
    {
      keywords: ["last occurrence"],
      answer: "To find the last occurrence, when you find the target, you record the index and set 'left = mid + 1' to keep searching in the right half for a later match."
    }
  ],

  quiz: {
    title: "Binary Search Final Quiz",
    questions: [
      {
        question: "What is the most critical prerequisite for an array before performing Binary Search?",
        options: ["The array must have an even number of elements", "The array must be sorted", "The array must not contain duplicates", "The array must contain only positive integers"],
        correctOptionIndex: 1
      },
      {
        question: "What is the time complexity of standard Binary Search?",
        options: ["O(1)", "O(n)", "O(n log n)", "O(log n)"],
        correctOptionIndex: 3
      },
      {
        question: "Why is 'mid = left + (right - left) // 2' preferred over 'mid = (left + right) // 2'?",
        options: ["It executes faster", "It prevents integer overflow in certain languages", "It correctly handles floating point numbers", "It is easier to read"],
        correctOptionIndex: 1
      },
      {
        question: "If the target is LESS than the middle element, how should the boundaries be updated?",
        options: ["left = mid + 1", "right = mid - 1", "left = mid - 1", "right = mid + 1"],
        correctOptionIndex: 1
      },
      {
        question: "What happens if you use 'while left < right' instead of 'while left <= right'?",
        options: ["The code will result in an infinite loop", "You might miss the target if it's the only element left to check", "It is perfectly fine and works exactly the same", "The code will throw an out-of-bounds error"],
        correctOptionIndex: 1
      },
      {
        question: "To find the first occurrence of a duplicate element, what should you do when 'nums[mid] == target'?",
        options: ["Return mid immediately", "Set left = mid + 1", "Set right = mid - 1", "Set left = right"],
        correctOptionIndex: 2
      },
      {
        question: "What is the auxiliary space complexity of an iterative binary search?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
        correctOptionIndex: 0
      },
      {
        question: "In the array [10, 20, 30, 40, 50], if target is 20, what is the sequence of 'mid' values checked?",
        options: ["30 then 20", "20 directly", "30 then 10 then 20", "10 then 20"],
        correctOptionIndex: 0
      }
    ]
  },

  assignment: {
    title: "Binary Search Mastery",
    description: "Complete the following tasks to demonstrate your mastery of Binary Search.",
    tasks: [
      "Task 1: Write a function `search(nums, target)` that implements standard iterative binary search.",
      "Task 2: Write a function `findFirstOccurrence(nums, target)` that returns the index of the first occurrence of `target`. If not found, return -1.",
      "Task 3: Explain in your own words why Binary Search is O(log n)."
    ]
  },
  
  evaluateCheckpoint: (question, answer, expectedKeywords) => {
    if (!answer || answer.trim().length === 0) {
      return { score: 0, isCorrect: false, feedback: "Please provide an answer." };
    }
    
    const ansLower = answer.toLowerCase();
    let matchCount = 0;
    
    if (expectedKeywords && expectedKeywords.length > 0) {
      for (const kw of expectedKeywords) {
        if (ansLower.includes(kw.toLowerCase())) {
          matchCount++;
        }
      }
      
      if (matchCount >= 2 || (expectedKeywords.length === 1 && matchCount === 1) || (expectedKeywords.includes("o(log n)") && ansLower.includes("log n"))) {
         return { score: 100, isCorrect: true, feedback: "Excellent answer! You hit all the key points." };
      } else if (matchCount === 1) {
         return { score: 60, isCorrect: true, feedback: "You're on the right track, but consider expanding your answer." };
      } else {
         return { score: 30, isCorrect: false, feedback: "Not quite. Think about the specific mechanics of the binary search algorithm we discussed." };
      }
    }
    
    // Fallback if no keywords provided
    return { score: 80, isCorrect: true, feedback: "Good effort!" };
  },

  evaluateDoubt: (doubtsList, question) => {
    const qLower = question.toLowerCase();
    
    for (const doubt of doubtsList) {
      for (const kw of doubt.keywords) {
        if (qLower.includes(kw.toLowerCase())) {
          return doubt.answer;
        }
      }
    }
    
    return "I can answer questions about the Binary Search concepts covered in this demo. Try asking about sorted arrays, left/right pointers, mid, boundary conditions, complexity, or first/last occurrence.";
  },

  evaluateAssignment: (assignmentData, submission) => {
    // Simple deterministic evaluation for the demo assignment
    if (!submission || submission.trim().length < 50) {
       return { score: 40, feedback: "Your submission is very short. Make sure to complete all tasks." };
    }
    if (submission.toLowerCase().includes("while") && submission.toLowerCase().includes("log n")) {
       return { score: 95, feedback: "Great job! Your implementation and explanation look solid." };
    }
    return { score: 75, feedback: "Good effort. Review the boundary conditions for finding the first occurrence." };
  }
};
