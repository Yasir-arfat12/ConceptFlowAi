/**
 * Single integration point for the tutor / doubt-resolution AI.
 * Set VITE_TUTOR_API to a URL that accepts POST { question, context } and
 * returns { answer } to use the real backend. Without it (or on failure)
 * a deterministic local responder is used so the UI always works.
 */
const CANNED = [
  { test: /chain rule|backprop/i, answer: 'Backpropagation applies the chain rule layer by layer: the gradient of the loss with respect to a weight is the product of the local derivatives along the path from the loss back to that weight. In matrix form that is a series of matrix products with the transposed weight matrices.' },
  { test: /cross.?entropy|mse/i, answer: 'Cross-entropy measures the distance between predicted and true probability distributions. With softmax outputs it gives large gradients when the model is confidently wrong, whereas MSE gradients shrink as outputs saturate, slowing learning.' },
  { test: /random|initiali[sz]/i, answer: 'If all weights start equal, every neuron in a layer gets the same gradient and stays identical. Random initialisation breaks that symmetry so neurons can learn different features.' },
  { test: /binary search|sorted|log/i, answer: 'Binary search halves the interval each step by comparing the target to the middle element, which is only valid because the array is sorted. That gives O(log n) comparisons.' },
];

export function mockAnswer(question, context = {}) {
  const hit = CANNED.find((c) => c.test.test(question));
  if (hit) return hit.answer;
  const where = context.title ? ` in "${context.title}"` : '';
  return `Good question${where}. Let's break it down: first restate what you already know, then identify the exact step where it stops making sense. Tell me that step and I'll explain it with a small example - then you can resume the lesson right where you left off.`;
}

export async function askTutor({ question, context = {}, signal, delay = 700 } = {}) {
  const isTest = import.meta.env?.MODE === 'test';
  const url = isTest ? undefined : import.meta.env?.VITE_TUTOR_API;
  if (url) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, context }), signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.answer) return String(data.answer);
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      return mockAnswer(question, context) + '\n\n(Offline mode: the tutor service could not be reached.)';
    }
  }
  const effectiveDelay = isTest ? Math.min(delay, 50) : delay;
  await new Promise((r) => setTimeout(r, effectiveDelay));
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return mockAnswer(question, context);
}
