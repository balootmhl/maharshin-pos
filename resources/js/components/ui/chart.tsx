"use client"

import * as React from "react"
import { ResponsiveContainer, Tooltip } from "recharts"

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
  React.HTMLAttributes<HTMLDivElement> & { config: any }
>(({ className, children, config, ...props }, ref) => (
  <div ref={ref} className={className} {...props}>
    <style dangerouslySetInnerHTML={{ __html: "" }} />
    <ResponsiveContainer width="100%" height="100%">
      {children as any}
    </ResponsiveContainer>
  </div>
))
ChartContainer.displayName = "ChartContainer"

export const ChartTooltip = Tooltip

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean
    payload?: any[]
    indicator?: "line" | "dot" | "dashed"
    hideLabel?: boolean
    hideIndicator?: boolean
    label?: string
    labelFormatter?: (value: any, payload: any[]) => React.ReactNode
    labelClassName?: string
    formatter?: (value: any, name: string, item: any, index: number, payload: any) => React.ReactNode
    color?: string
    nameKey?: string
    labelKey?: string
  }
>(({ active, payload, className, indicator = "dot", hideLabel = false, hideIndicator = false, label, labelFormatter, labelClassName, formatter, color, nameKey, labelKey }, ref) => {
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
