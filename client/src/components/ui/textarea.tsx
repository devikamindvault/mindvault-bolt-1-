import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider"; // Import the theme provider

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => {
    const { theme } = useTheme(); // Get the current theme

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
        style={{
          color: theme === "dark" ? "#FFFFFF" : "#000000", // Dynamically set text color
          backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF", // Dynamically set background color
          ...style, // Merge any additional styles passed via props
        }}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };