import { ZodError, ZodTypeAny } from "zod";
import toast from "react-hot-toast";

const logZodError = (prefix: string, error: ZodError) => {
  const rows = error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
    code: i.code,
  }));
  // eslint-disable-next-line no-console
  console.error(`${prefix} validation failed`, rows);
};

export function validateOrToast<T>(
  schema: ZodTypeAny,
  data: unknown,
  opts?: { toastPrefix?: string; logPrefix?: string }
): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg =
      result.error.issues[0]?.message || "Please check the form and try again.";
    toast.error(opts?.toastPrefix ? `${opts.toastPrefix}` : msg);
    logZodError(opts?.logPrefix || "Form", result.error);
    return null;
  }
  return result.data as T;
}
