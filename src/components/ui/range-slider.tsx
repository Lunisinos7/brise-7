import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface RangeSliderProps extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'value' | 'onValueChange'> {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
  showScale?: boolean;
  scaleStep?: number;
  scaleClassName?: string;
}

const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(({ 
  className, 
  value, 
  onValueChange, 
  trackClassName, 
  rangeClassName, 
  thumbClassName,
  showScale = false,
  scaleStep = 10,
  scaleClassName,
  min = 0,
  max = 100,
  ...props 
}, ref) => {
  const scaleMarks = React.useMemo(() => {
    if (!showScale) return [];
    const marks: number[] = [];
    for (let i = min; i <= max; i += scaleStep) {
      marks.push(i);
    }
    return marks;
  }, [showScale, min, max, scaleStep]);

  return (
    <div className="w-full">
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        value={value}
        onValueChange={(v) => onValueChange(v as [number, number])}
        min={min}
        max={max}
        {...props}
      >
        <SliderPrimitive.Track className={cn("relative h-2 w-full grow overflow-hidden rounded-full bg-muted-foreground/30", trackClassName)}>
          <SliderPrimitive.Range className={cn("absolute h-full bg-primary", rangeClassName)} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className={cn("block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", thumbClassName)} />
        <SliderPrimitive.Thumb className={cn("block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", thumbClassName)} />
      </SliderPrimitive.Root>
      {showScale && scaleMarks.length > 0 && (
        <div className={cn("relative w-full flex justify-between mt-1.5 px-2", scaleClassName)}>
          {scaleMarks.map((mark) => (
            <span 
              key={mark} 
              className="text-[10px] text-muted-foreground/50 select-none"
            >
              {mark}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
RangeSlider.displayName = "RangeSlider";

export { RangeSlider };
