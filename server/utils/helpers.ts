import { z } from "zod";

export function logZodError(error: Error) {
  if (error instanceof z.ZodError) {
    error.issues.forEach((issue, index) => {
      console.log(`Error ${index + 1}:`);
      console.log(`  Path: ${issue.path.join(".")}`);
      console.log(`  Message: ${issue.message}`);
      console.log(`  Code: ${issue.code}`);
      console.log("---");
    });
  }
}

function snakeToCamel(text: string): string {
  return text.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(text: string): string {
  return text.replace(/([A-Z])/g, "_$1").toLowerCase();
}
export function keysToCamel<T>(obj: T): T {
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

export function keysToSnake<T>(obj: T): T {
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
