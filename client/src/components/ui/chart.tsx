import { ReactNode, HTMLAttributes, createContext, useContext, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ChartThemeConfig {
    theme: {
      light: string;
      dark: string;
    };
  };
}

// Create context for chart theme configuration
const ChartContext = createContext<{ config: ChartThemeConfig | null }>({ 
  config: null
});

interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  config?: ChartThemeConfig;
}

// Container component that provides theme configuration to chart components
export function ChartContainer({
  children,
  className,
  config = {},
  ...props
}: ChartContainerProps) {
  // Convert config into CSS variables
  const cssVars = useMemo(() => {
    const vars: Record<string, string> = {};
    
      const theme = document.documentElement.classList.contains('dark') 
        ? value.theme.dark 
        : value.theme.light;
      
    }
    
    return vars;
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div 
        className={cn("w-full", className)} 
        style={cssVars} 
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

// Custom tooltip content for Recharts
export function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-background border border-border rounded-lg shadow-md p-3 text-sm">
      {label && <div className="font-bold mb-1">{label}</div>}
      <div className="space-y-1">
        {payload.map((item: any, index: number) => (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }} 
            />
            <span className="font-medium">{item.name}:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}