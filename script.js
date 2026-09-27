const form = document.querySelector("#release");

const detected = (() => {
  const ua = navigator.userAgent || "";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "Linux";
  return "macOS";
})();

const preset = form.querySelector(`input[value="${detected}"]`);
if (preset) preset.checked = true;

const paywall = document.querySelector("#paywall");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  paywall.showModal();
});

paywall.addEventListener("click", (event) => {
  if (event.target === paywall) paywall.close();
});

document.querySelector("#paywall-close").addEventListener("click", () => {
  paywall.close();
});

document.querySelector("#paid").addEventListener("click", () => {
  const platform = new FormData(form).get("platform");
  const slug = { macOS: "mac", Windows: "windows", Linux: "linux" }[platform];
  window.location.href = `/download-${slug}`;
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// HTML figures are the counts at this instant. Later loads project forward from the clock.
const LEDGER_EPOCH = Date.UTC(2026, 8, 27, 16, 16, 0);

const counters = [
  { name: "vibes", seed: 0x51, min: 8000, max: 32000, chance: 0.72 },
  { name: "artifacts", seed: 0x2c7, min: 14000, max: 48000, chance: 0.58 },
  { name: "batches", seed: 0x91d, min: 40000, max: 130000, chance: 0.5 },
];

counters.forEach((counter) => {
  const el = document.querySelector(`[data-stat="${counter.name}"]`);
  if (!el) return;
  counter.el = el;
  counter.baseline = Number(el.textContent.replace(/[^\d]/g, ""));
  paintCounter(counter, false);
});

function hash32(n) {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function unit(n, seed) {
  return hash32(Math.imul(n + 1, seed)) / 4294967296;
}

function counterState(counter, now) {
  const period = ((counter.min + counter.max) / 2) / counter.chance;
  if (now <= LEDGER_EPOCH) {
    const hold = unit(0, counter.seed) * period * 0.85;
    return { count: counter.baseline, nextAt: LEDGER_EPOCH + hold };
  }

  const elapsed = now - LEDGER_EPOCH;
  const k = Math.floor(elapsed / period);
  const into = elapsed - k * period;
  const hold = unit(k, counter.seed) * period * 0.85;
  const fired = into >= hold;
  const count = counter.baseline + k + (fired ? 1 : 0);

  let nextAt;
  if (!fired) {
    nextAt = now + (hold - into);
  } else {
    const nextHold = unit(k + 1, counter.seed) * period * 0.85;
    nextAt = now + (period - into) + nextHold;
  }
  return { count, nextAt };
}

function paintCounter(counter, pulse) {
  const { count, nextAt } = counterState(counter, Date.now());
  const text = count.toLocaleString("en-US");
  const changed = counter.el.textContent !== text;
  counter.el.textContent = text;
  if (pulse && changed && !reducedMotion) {
    counter.el.classList.add("is-up");
    setTimeout(() => counter.el.classList.remove("is-up"), 1400);
  }
  const delay = Math.max(200, nextAt - Date.now());
  setTimeout(() => paintCounter(counter, true), delay);
}
