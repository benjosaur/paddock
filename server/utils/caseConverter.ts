function snakeToCamel(text: string): string {
  return text.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(text: string): string {
  return text.replace(/([A-Z])/g, "_$1").toLowerCase();
}
export function keysToCamel<T>(obj: Record<string, any>): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as T;
  } else if (obj !== null && typeof obj === "object") {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = keysToCamel(value);
      return acc;
    }, {} as any);
  }
  return obj;
}

export function keysToSnake<T>(obj: Record<string, any>): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnake(v)) as T;
  } else if (obj !== null && typeof obj === "object") {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const snakeKey = camelToSnake(key);
      acc[snakeKey] = keysToSnake(value);
      return acc;
    }, {} as any);
  }
  return obj;
}
