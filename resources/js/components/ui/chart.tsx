"use client"

import * as React from "react"
import { ResponsiveContainer, Tooltip, TooltipProps } from "recharts"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
    theme?: Record<string, string>
  }
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { config: ChartConfig }
>(({ className, children, config, ...props }, ref) => {
    // Satisfy linter for unused config prop which we extract to avoid passing to DOM
    void config;
  return (
    <div ref={ref} className={className} {...props}>
      <style dangerouslySetInnerHTML={{ __html: "" }} />
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

export const ChartTooltip = Tooltip

// Using slightly looser types here to match Recharts internal types which can be complex
 
type ChartTooltipContentProps = TooltipProps<ValueType, NameType> & React.HTMLAttributes<HTMLDivElement> & {
    indicator?: "line" | "dot" | "dashed"
    hideLabel?: boolean
    hideIndicator?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labelFormatter?: (value: any, payload: any[]) => React.ReactNode
    labelClassName?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatter?: (value: any, name: string, item: any, index: number, payload: any) => React.ReactNode
    color?: string
    nameKey?: string
    labelKey?: string
}

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(({ active, payload, label }, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div ref={ref} className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            {label}
          </span>
          <span className="font-bold text-muted-foreground">
            {payload[0].value}
          </span>
        </div>
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"
