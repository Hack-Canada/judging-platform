import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {}

export function Section({ className, children, ...props }: SectionProps) {
  return (
    <section
      className={cn(
        "relative w-full",
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
}
