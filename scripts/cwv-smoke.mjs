const cdpOrigin = process.env.CDP_ORIGIN || "http://127.0.0.1:9223";
const urls = process.argv.slice(2);
if (urls.length === 0) {
  throw new Error("Berikan minimal satu URL untuk diuji.");
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function createTarget() {
  const response = await fetch(`${cdpOrigin}/json/new?about:blank`, { method: "PUT" });
  if (!response.ok) throw new Error(`Gagal membuat target Chrome: ${response.status}`);
  return response.json();
}

async function closeTarget(id) {
  await fetch(`${cdpOrigin}/json/close/${id}`).catch(() => null);
}

async function measure(url) {
  const target = await createTarget();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  let commandId = 0;
  const pending = new Map();
  const events = new Map();

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    const listeners = events.get(message.method) || [];
    listeners.splice(0).forEach((resolve) => resolve(message.params));
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      commandId += 1;
      pending.set(commandId, { resolve, reject });
      socket.send(JSON.stringify({ id: commandId, method, params }));
    });
  const once = (method) =>
    new Promise((resolve) => {
      const listeners = events.get(method) || [];
      listeners.push(resolve);
      events.set(method, listeners);
    });

  try {
    await ready;
    await Promise.all([
      send("Page.enable"),
      send("Runtime.enable"),
      send("Network.enable"),
      send("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true,
      }),
      send("Emulation.setCPUThrottlingRate", { rate: 4 }),
      send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: 1_600_000 / 8,
        uploadThroughput: 750_000 / 8,
        connectionType: "cellular4g",
      }),
    ]);

    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        globalThis.__seoVitals = { lcp: 0, cls: 0, inp: 0 };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) globalThis.__seoVitals.lcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) globalThis.__seoVitals.cls += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.interactionId) globalThis.__seoVitals.inp = Math.max(globalThis.__seoVitals.inp, entry.duration);
            }
          }).observe({ type: "event", buffered: true, durationThreshold: 16 });
        } catch {}
      `,
    });

    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url });
    await loaded;
    await wait(4500);
    await send("Runtime.evaluate", {
      expression: `document.querySelector('button[type="button"], summary')?.click()`,
      awaitPromise: true,
    });
    await wait(800);

    const result = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        title: document.title,
        lcp: globalThis.__seoVitals?.lcp || 0,
        cls: globalThis.__seoVitals?.cls || 0,
        inp: globalThis.__seoVitals?.inp || 0,
        fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime || 0,
        ttfb: performance.getEntriesByType("navigation")[0]?.responseStart || 0
      })`,
      returnByValue: true,
    });
    return JSON.parse(result.result.value);
  } finally {
    socket.close();
    await closeTarget(target.id);
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const samples = [];
for (let run = 1; run <= 3; run += 1) {
  for (const url of urls) {
    samples.push({ url, run, ...(await measure(url)) });
  }
}

const medians = urls.map((url) => {
  const matching = samples.filter((sample) => sample.url === url);
  return {
    url,
    lcp: median(matching.map((sample) => sample.lcp)),
    cls: median(matching.map((sample) => sample.cls)),
    inp: median(matching.map((sample) => sample.inp)),
    fcp: median(matching.map((sample) => sample.fcp)),
    ttfb: median(matching.map((sample) => sample.ttfb)),
  };
});

console.log(JSON.stringify({ profile: "mobile-simulated-4g-cpu4x", samples, medians }, null, 2));
