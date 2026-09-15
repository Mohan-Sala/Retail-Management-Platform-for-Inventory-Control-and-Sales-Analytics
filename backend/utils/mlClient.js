const ApiError = require("./ApiError");

// Simple In-Memory Cache
const mlCache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getCache = (key) => {
  const cached = mlCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    mlCache.delete(key);
    return null;
  }
  return cached.data;
};

const setCache = (key, data, ttlMs = DEFAULT_TTL_MS) => {
  mlCache.set(key, {
    data,
    expiry: Date.now() + ttlMs
  });
};

const invalidateMlCache = () => {
  mlCache.clear();
  console.log("[ML Cache] Entire ML cache invalidated due to database mutation event.");
};

// FastAPI Request Helper with Timeout & Fallback
const callFastAPI = async (endpoint, options = {}) => {
  const method = options.method || "GET";
  const body = options.body ? JSON.stringify(options.body) : null;
  const cacheKey = `${method}_${endpoint}_${body || ""}`;

  // Check cache first for GET requests
  if (method === "GET") {
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      console.log(`[ML Cache] Hit for: ${endpoint}`);
      return cachedData;
    }
  }

  const fastapiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
  const timeoutMs = parseInt(process.env.FASTAPI_TIMEOUT_MS) || 10000;
  
  const controller = new global.AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();
  console.log(`[ML Client] Sending ${method} request to FastAPI: ${fastapiUrl}${endpoint}`);

  try {
    const res = await fetch(`${fastapiUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    console.log(`[ML Client] Response received from FastAPI in ${duration}ms with status: ${res.status}`);

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const payload = await res.json();
    
    if (method === "GET" && payload.success && payload.data) {
      setCache(cacheKey, payload.data);
    }

    return payload.data;
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    console.error(`[ML Client] Request failed to FastAPI ${endpoint} after ${duration}ms: ${error.message}`);

    // Fallback: Check if stale cache is available
    const staleCached = mlCache.get(cacheKey);
    if (staleCached) {
      console.warn(`[ML Client] Serving stale cached data as fallback for endpoint: ${endpoint}`);
      return staleCached.data;
    }

    // No cache: Return graceful 503 error
    throw new ApiError(
      503,
      `FastAPI service is currently unavailable or timed out. Detail: ${error.message}`
    );
  }
};

module.exports = {
  callFastAPI,
  invalidateMlCache,
  mlCache
};
