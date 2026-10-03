/**
 * Lesson content + grading. Hand-written lessons exist for the three
 * suggested prompts; any other topic gets a generated outline (placeholder
 * until the Qwen integration returns real content).
 */
import { slugify } from './format';

const norm = (t = '') => t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export const CURRICULUM = {
  'binary-search': {
    title: 'Binary Search', skill: 'dsa', match: ['binary search'],
    concepts: [
      {
        title: 'Introduction',
        body: [
          'Searching is one of the most fundamental operations in computer science, used everywhere from search engines to database lookups.',
          'The simplest approach is **Linear Search**, which inspects elements one by one from start to finish until the target is found.',
          'In an unsorted collection of size `n`, finding an item or proving it is missing requires up to `n` comparisons, giving it **O(n)** time complexity.',
          'For datasets containing millions or billions of records, checking every single element is unacceptably slow and resource-heavy.',
          '**Binary Search** solves this challenge by employing a divide-and-conquer strategy on a **sorted** collection of data.',
          'When elements are arranged in sorted order, examining any element provides a definitive guarantee about all elements around it.',
          'If the target value is greater than the middle element, we know with certainty that the target cannot exist in the left half.',
          'Conversely, if the target is smaller than the middle element, the entire right half of the collection can be safely discarded.',
          'This powerful elimination process cuts the remaining candidate search space in half after every single comparison.',
          'Without **sorted order**, elements could appear anywhere, making it impossible to discard either half without checking each entry.',
        ],
        checkpoint: { question: 'Why must the array be sorted before using binary search?', keywords: [['sorted', 'order', 'ordered'], ['half', 'discard', 'eliminate', 'ignore']], model: 'Order tells us which half cannot contain the target, so we can safely discard it.' }
      },
      {
        title: 'How Binary Search Works',
        body: [
          'Binary search operates intuitively like looking up a word in a printed dictionary by repeatedly opening to the middle.',
          'We maintain two boundary pointers to track the current window of interest: `low` (start index) and `high` (end index).',
          'At each step, we calculate the middle index `mid` and compare the value at `array[mid]` with our desired target.',
          'If the middle element matches our target, the search succeeds immediately and returns the target index.',
          'If `array[mid] < target`, the target must reside in the upper portion, so we discard the left half by setting `low = mid + 1`.',
          'If `array[mid] > target`, the target must reside in the lower portion, so we discard the right half by setting `high = mid - 1`.',
          'With every comparison made, the remaining search space is **cut in half** (reduced by 50%).',
          'A search space of 1,000 items reduces to 500, then 250, 125, 63, 31, 16, 8, 4, 2, and finally a single element.',
          'Even an array containing 1,000,000 items requires at most 20 comparisons to either locate the item or confirm it is absent.',
          'The search completes either when the item is found or when `low > high`, indicating the search window is completely exhausted.',
        ],
        example: [
          '// Searching for 7 in this sorted array:',
          '[1, 3, 5, 7, 9, 11, 15]',
          'Step 1: Check middle element (7). Is it the target? Yes!',
          'Target found at index 3.'
        ],
        checkpoint: { question: 'What happens to the search space after each step of binary search?', keywords: [['half', 'halved', 'halves', 'divid', '50%', 'reduc', 'shrink']], model: 'The search space is cut in half after every comparison.' }
      },
      {
        title: 'Binary Search Algorithm',
        body: [
          'Translating the binary search concept into robust code requires careful handling of pointer boundaries and loop invariants.',
          'We begin by initializing the search boundaries: `low = 0` at the first index and `high = array.length - 1` at the final index.',
          'The search runs inside a loop with the condition `while (low <= high)`, which ensures single-element intervals are also evaluated.',
          'In each iteration, we calculate `mid = low + Math.floor((high - low) / 2)` to safely prevent integer overflow on large arrays.',
          'We compare the middle value: if `array[mid] === target`, we have found the element and return `mid` immediately.',
          'When `array[mid] < target`, the middle value is smaller than what we seek, meaning the target must be in the upper/right half.',
          'Therefore, we advance the lower boundary past the middle element by updating `low = mid + 1`.',
          'When `array[mid] > target`, the middle value is larger than what we seek, so we shift the upper boundary: `high = mid - 1`.',
          'We use `mid + 1` and `mid - 1` rather than `mid` because `array[mid]` was already verified and cannot be the target.',
          'If the loop terminates because `low > high` without finding the target, we conclude the item is absent and return `-1`.',
        ],
        checkpoint: { question: 'Which pointer moves when the middle value is smaller than the target?', keywords: [['low', 'left', 'start'], ['mid', 'middle', 'past', 'right', 'upper']], model: 'Move `low` to mid + 1 because the target must be in the upper half.' }
      },
      {
        title: 'Time Complexity',
        body: [
          'Time complexity measures how the runtime of an algorithm scales as the input size `n` increases.',
          'In Linear Search, checking an array twice as large takes twice as many operations, resulting in **O(n)** linear time.',
          'Binary search is dramatically faster because every single comparison divides the remaining candidates by two.',
          'Mathematically, we ask: how many times can an array of size `n` be halved until only 1 element remains?',
          'The equation `2^k = n` solves to `k = log2(n)`, making the worst-case and average-case time complexity **O(log n)**.',
          'For an input array of 1,000 items, linear search takes up to 1,000 comparisons, whereas binary search takes only 10.',
          'For an array of 1,000,000 items, linear search takes up to 1,000,000 comparisons, while binary search takes at most 20.',
          'For an array of 1,000,000,000 items (1 billion), binary search finishes in a maximum of 30 comparisons.',
          'In the best-case scenario where the target happens to be at the exact middle index on the first step, it runs in **O(1)** time.',
          'Because the iterative algorithm only requires a few pointer variables (`low`, `high`, `mid`), its auxiliary space complexity is **O(1)**.',
        ],
        checkpoint: { question: 'What is the time complexity of binary search and why?', keywords: [['log', 'logarithmic', 'o(log'], ['half', 'divid', 'halving']], model: 'O(log n), because every step halves the remaining search space.' }
      },
    ],
  },
  photosynthesis: {
    title: 'Photosynthesis', skill: 'science', match: ['photosynthesis'],
    concepts: [
      {
        title: 'Overview',
        body: [
          'Photosynthesis is the fundamental biological process that powers life on Earth by converting solar radiant energy into chemical energy.',
          'Plants, algae, and cyanobacteria perform this transformation inside specialized plant cell organelles called **chloroplasts**.',
          'The green pigment **chlorophyll**, housed within chloroplasts, captures light energy across specific wavelengths of sunlight.',
          'The overall chemical process requires two primary external raw materials: liquid **water (H2O)** and gaseous **carbon dioxide (CO2)**.',
          'Plant roots absorb water from the soil and transport it through xylem vessels directly to leaves.',
          'Simultaneously, microscopic pores on leaf surfaces called stomata take in carbon dioxide directly from the surrounding air.',
          'Using photon energy, the plant breaks down water and carbon dioxide to synthesize high-energy **glucose (C6H12O6)** sugar.',
          'As a vital byproduct of this reaction, molecular **oxygen (O2)** is produced and released into the atmosphere.',
          'The balanced chemical equation is: **6 CO2 + 6 H2O + solar light energy → C6H12O6 + 6 O2**.',
          'This glucose provides the cellular energy and structural building blocks for plant growth, forming the base of global food webs.',
        ],
        checkpoint: { question: 'What are the inputs and outputs of photosynthesis?', keywords: [['water'], ['carbon dioxide', 'co2'], ['glucose', 'sugar', 'oxygen']], model: 'Inputs: light, water, CO2. Outputs: glucose and oxygen.' }
      },
      {
        title: 'Light-Dependent Reactions',
        body: [
          'Photosynthesis takes place in two distinct yet interconnected stages: the light-dependent reactions and the light-independent Calvin cycle.',
          'The **light-dependent reactions** occur directly across the internal thylakoid membranes inside the chloroplast.',
          'When photons strike chlorophyll molecules in Photosystems II and I, electrons are excited to high energy levels.',
          'To replace lost electrons, an enzyme splits water molecules in a process known as photolysis: **2 H2O → 4 H+ + 4 e- + O2**.',
          'The oxygen produced from splitting water is released into the air as a byproduct that aerobic organisms breathe.',
          'As excited electrons travel along the electron transport chain, energy is harvested to pump hydrogen protons into the thylakoid lumen.',
          'The resulting proton concentration gradient drives the **ATP synthase** enzyme to produce **ATP** from ADP and phosphate.',
          'Simultaneously, high-energy electrons are transferred to electron carriers to reduce NADP+ into **NADPH**.',
          'In summary, the light-dependent reactions convert sunlight into chemical energy stored in two essential molecules: **ATP** and **NADPH**.',
          'These high-energy chemical carriers are immediately transferred into the stroma to power the sugar-building Calvin cycle.',
        ],
        checkpoint: { question: 'What do the light-dependent reactions produce?', keywords: [['atp'], ['nadph', 'oxygen', 'o2']], model: 'ATP and NADPH (plus oxygen from splitting water).' }
      },
      {
        title: 'The Calvin Cycle',
        body: [
          'The second stage of photosynthesis is the **Calvin cycle** (light-independent reactions), which takes place in the **stroma**.',
          'The stroma is the fluid-filled space surrounding the thylakoids inside the chloroplast where enzymes and substrates mix.',
          'Although this stage does not directly absorb photons, it relies entirely on the ATP and NADPH generated by the light reactions.',
          'The cycle begins with **carbon fixation**: atmospheric CO2 is captured and combined with a 5-carbon sugar (RuBP) by the enzyme **Rubisco**.',
          'The resulting unstable 6-carbon intermediate immediately splits into two 3-carbon molecules called 3-PGA.',
          'In the reduction phase, ATP and NADPH transfer phosphate groups and high-energy electrons to convert 3-PGA into **G3P** sugar molecules.',
          'For every six turns of the Calvin cycle, two G3P molecules exit the cycle and combine to form one molecule of **glucose**.',
          'The remaining G3P molecules use additional ATP energy to regenerate the initial RuBP molecules, keeping the cycle continuous.',
          'Thus, the Calvin cycle fixes inorganic carbon dioxide from the air into stable, energy-dense organic sugars used for plant metabolism.',
          'Without the Calvin cycle, plants could capture light energy but could never synthesize physical sugars or store biological food.',
        ],
        checkpoint: { question: 'Where does the Calvin cycle happen and what does it do?', keywords: [['stroma'], ['co2', 'carbon', 'sugar', 'glucose', 'fix']], model: 'In the stroma, it fixes CO2 into sugar using ATP and NADPH.' }
      },
    ],
  },
  'quantum-entanglement': {
    title: 'Quantum Entanglement', skill: 'science', match: ['quantum entanglement', 'entanglement'],
    concepts: [
      {
        title: 'What is Entanglement?',
        body: [
          'Quantum entanglement is one of the most astonishing phenomena in modern physics, emerging from the principles of quantum mechanics.',
          'In classical physics, two objects separated by distance always possess distinct, independent physical properties.',
          'In the quantum world, when two or more particles interact in specific ways, their quantum states become fundamentally linked.',
          'These particles enter a unified composite quantum superposition that cannot be mathematically described as two separate wavefunctions.',
          'Instead, only a single shared mathematical state vector describes the entire entangled pair, regardless of spatial separation.',
          'If an entangled pair is separated by meters, kilometers, or even light-years, measurements performed on them remain instantaneously correlated.',
          'Albert Einstein famously questioned this implication, dubbing it "spooky action at a distance" in the famous 1935 EPR paradox paper.',
          'Decades of rigorous laboratory experiments with lasers, photons, and trapped ions have verified that entanglement is completely real.',
          'Entangled particles do not have predetermined hidden values before observation; their correlated outcomes emerge upon measurement.',
          'In essence, to be entangled means two particles share a single quantum destiny where their observable properties are intrinsically bound.',
        ],
        checkpoint: { question: 'In your own words, what does it mean for two particles to be entangled?', keywords: [['correlat', 'linked', 'connected', 'shared', 'dependent']], model: 'Their states cannot be described independently - outcomes are correlated.' }
      },
      {
        title: 'Measurement and Correlation',
        body: [
          'To understand how entangled particles behave, consider a pair of photons created with entangled opposite spins (Bell state).',
          'Before any measurement takes place, neither photon has a definite spin; both exist in an indeterminate quantum superposition of states.',
          'When an observer measures the spin of Particle A along an axis and finds it spin-up, the shared wavefunction instantly collapses.',
          'Particle B is then guaranteed to be measured as spin-down along that identical axis, with 100% correlation.',
          'A natural and frequent question is: can this instantaneous link be used to send signals or text messages faster than the speed of light?',
          'The answer is an unequivocal **no**: entanglement **cannot** transmit usable data or signals faster than light.',
          'The outcome of measuring Particle A is fundamentally random (a 50/50 probability of spin-up or spin-down).',
          'Because the local observer cannot control which outcome occurs, they cannot modulate the result into an intentional message.',
          'This foundational principle is formally proven as the **No-Communication Theorem** in quantum information theory.',
          'To compare their correlated measurements, observers must still communicate using classical light-speed channels (like radio or fiber).',
        ],
        checkpoint: { question: 'Can entanglement be used to send information faster than light?', keywords: [['no', 'not', "can't", 'cannot'], ['signal', 'information', 'random', 'communicat']], model: 'No. Outcomes are random locally, so no usable signal is transmitted.' }
      },
      {
        title: 'Why It Matters',
        body: [
          'Far from being just a theoretical curiosity, quantum entanglement serves as the foundational fuel for next-generation quantum technologies.',
          'In **Quantum Computing**, entangled quantum bits (**qubits**) can explore exponentially large computational solution spaces simultaneously.',
          'While classical computers process bits as 0 or 1, entangled qubits enable quantum algorithms like Shor’s and Grover’s to outperform supercomputers.',
          'In **Quantum Cryptography**, protocols like E91 and Quantum Key Distribution (QKD) provide mathematically unbreakable security.',
          'Because measuring an entangled quantum state alters it, any eavesdropper attempting to intercept the key leaves an immediate detectable footprint.',
          'In **Quantum Teleportation**, entanglement combined with a classical channel allows the exact quantum state of a particle to be transferred across distance.',
          'In **Quantum Sensing and Metrology**, entangled atomic sensors achieve precision far beyond standard classical limits (the Heisenberg limit).',
          'These ultra-sensitive detectors enhance GPS-free navigation, magnetic resonance imaging, and gravitational wave observatories like LIGO.',
          'Global quantum networks and satellite-based entanglement distribution are currently laying the groundwork for a future Quantum Internet.',
          'Mastering quantum entanglement is transforming computing, cybersecurity, and fundamental physics across the 21st century.',
        ],
        checkpoint: { question: 'Name one technology that relies on entanglement.', keywords: [['comput', 'cryptograph', 'teleport', 'key', 'qkd', 'sensing']], model: 'Quantum computing, quantum key distribution or teleportation.' }
      },
    ],
  },
};

export function matchTopic(input) {
  const n = norm(input);
  if (!n) return null;
  return Object.keys(CURRICULUM).find((k) => CURRICULUM[k].match.some((m) => n.includes(m))) ?? null;
}

/** Generated outline for topics without hand-written content. */
function buildGeneric(topicText) {
  const t = topicText.trim() || 'this topic';
  const mk = (title, body, q, kw, model) => ({ title, body, checkpoint: { question: q, keywords: kw, model } });
  return {
    title: t, skill: null,
    concepts: [
      mk(
        'Introduction',
        [
          `${t} is an essential concept designed to address specific challenges and optimize modern workflows.`,
          `Historically, handling these problems required manual, inefficient, or error-prone approaches that did not scale well.`,
          `By establishing clear underlying rules, ${t} provides a structured foundation for breaking down complex tasks.`,
          `Understanding ${t} begins with identifying its primary purpose: why it was created and what benefits it delivers.`,
          `At its core, it enables practitioners to solve practical problems with greater predictability, precision, and efficiency.`,
          `From small everyday tasks to enterprise-scale systems, the core principles of ${t} remain consistent across domains.`,
          `Familiarity with the key terminology and context helps build mental models that make advanced concepts intuitive.`,
          `As you progress through this learning module, you will see how each building block connects to the broader picture.`,
          `By mastering ${t}, you gain reusable problem-solving patterns applicable across real-world projects and scenarios.`,
          `Let's start by testing your high-level understanding of the primary problem that ${t} is designed to solve.`,
        ],
        `In one or two sentences, what problem does ${t} solve?`,
        [['problem', 'solve', 'used', 'purpose', 'help']],
        'A short statement of the purpose and use of the topic.'
      ),
      mk(
        'Core Ideas',
        [
          `Every robust concept is constructed from a small set of foundational building blocks and core ideas.`,
          `In ${t}, these principles define how components communicate, how state is maintained, and how inputs transform into outputs.`,
          `The first critical idea is establishing clear boundaries and definitions for all fundamental terms involved.`,
          `Secondly, understanding the relationships and dependencies between components prevents confusion during implementation.`,
          `Thirdly, recognizing standard patterns allows you to spot opportunities to apply ${t} cleanly and avoid anti-patterns.`,
          `Rather than memorizing abstract rules, focus on the cause-and-effect mechanisms that govern how ${t} operates.`,
          `When you encounter an unfamiliar scenario, relating it back to these core ideas will quickly guide you to the right solution.`,
          `These foundational mechanics remain consistent regardless of the specific tooling, language, or environment you use.`,
          `Developing strong fluency with these key ideas is what distinguishes experienced engineers from beginners.`,
          `Take a moment to identify one of the primary building blocks or terminology you have learned so far.`,
        ],
        `List one key idea or term from ${t}.`,
        [['is', 'are', 'means', 'idea', 'term']],
        'Any core term with a short definition.'
      ),
      mk(
        'Worked Example',
        [
          `Theory becomes concrete when you examine how ${t} functions in a practical, step-by-step example.`,
          `Consider a realistic scenario where you need to apply ${t} to achieve a specific, measurable objective.`,
          `The first step is always identifying the initial state, available inputs, and constraints of the problem.`,
          `Next, you establish the baseline criteria that must be satisfied before taking any transformative action.`,
          `From there, you execute the core mechanism step by step, observing how the intermediate state changes along the way.`,
          `At each stage, you verify that your assumptions hold true and that you are progressing toward the target outcome.`,
          `If an unexpected condition arises, standard error-handling or fallback logic ensures the process remains robust.`,
          `Finally, you reach the termination condition and inspect the resulting output to confirm correctness.`,
          `Walking through examples in this systematic fashion reveals nuances that might be missed in abstract discussions.`,
          `Now, describe the very first action or preparation step you would take when starting this example.`,
        ],
        'Describe the first step you would take in the example.',
        [['first', 'start', 'step', 'begin']],
        'Describe how to start and what comes next.'
      ),
      mk(
        'Review',
        [
          `Reflecting on what you have learned solidifies your understanding of ${t} and prepares you to handle edge cases.`,
          `A key aspect of mastering any topic is knowing not just how to use it, but also when and how things can go wrong.`,
          `Common mistakes often stem from violating foundational assumptions, such as unhandled boundary conditions or invalid inputs.`,
          `Another frequent pitfall is overcomplicating simple scenarios when a straightforward approach would be cleaner and more reliable.`,
          `To build reliable systems, always validate preconditions early and design with clear failure modes in mind.`,
          `Testing edge cases, such as empty inputs or extreme values, ensures your understanding and implementation are truly solid.`,
          `Keep this mental checklist handy whenever you design, implement, or review work involving ${t}.`,
          `With these principles in place, you are well-equipped to apply ${t} confidently in complex real-world situations.`,
          `Continuous practice and self-testing will deepen your intuition and make these patterns second nature.`,
          `To complete this concept, identify one common mistake or pitfall to avoid when working with ${t}.`,
        ],
        'What is one common mistake to avoid?',
        [['mistake', 'avoid', 'error', "don't", 'wrong']],
        'Name a typical pitfall and how to avoid it.'
      ),
    ],
  };
}

/** Resolve a free-text topic to `{ key, title, skill, concepts }`. */
export function getCurriculum(topicText) {
  const key = matchTopic(topicText);
  if (key) return { key, ...CURRICULUM[key] };
  const generic = buildGeneric(topicText || 'Binary Search');
  return { key: slugify(generic.title), ...generic };
}

/**
 * Grade a free-text checkpoint answer by keyword groups (each group is a set
 * of synonyms; one hit per group counts). Cheap, deterministic stand-in for
 * an LLM grader.
 */
export function gradeAnswer(answer, checkpoint) {
  const text = norm(answer);
  if (text.split(' ').filter(Boolean).length < 3) {
    return { score: 0, passed: false, feedback: 'Try a fuller explanation - at least a short sentence.' };
  }
  const groups = checkpoint.keywords;
  const hits = groups.filter((g) => g.some((k) => text.includes(k.toLowerCase()))).length;
  const score = Math.round((hits / groups.length) * 100);
  const passed = score >= 50;
  return {
    score,
    passed,
    feedback: passed
      ? score === 100 ? 'Great explanation - you covered the key idea.' : 'Good start - you have the main idea. Model answer: ' + checkpoint.model
      : 'Not quite yet. Model answer: ' + checkpoint.model,
  };
}
