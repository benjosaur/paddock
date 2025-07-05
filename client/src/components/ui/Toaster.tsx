import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
        success: {
          duration: 3000,
          style: {
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--success))",
          },
        },
        error: {
          duration: 5000,
          style: {
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--destructive))",
          },
        },
      }}
    />
  );
}
