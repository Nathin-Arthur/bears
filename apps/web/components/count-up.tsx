"use client"

import * as React from "react"

import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

const DURATION_MS = 1400

// Fast start, gentle finish.
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

// Animates from 0 to `value` on mount. Everything that uses this hook shares
// the same duration and easing, so the numbers and progress bar move together.
function useCountUp(value: number) {
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    // With reduced motion on, jump straight to the final value.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : DURATION_MS
    let frame = 0
    const start = performance.now()

    function tick(now: number) {
      const progress =
        duration === 0 ? 1 : Math.min((now - start) / duration, 1)
      setCurrent(value * easeOutCubic(progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return current
}

export function CountUp({
  value,
  decimals = 0,
  className,
}: {
  value: number
  decimals?: number
  className?: string
}) {
  const current = useCountUp(value)

  const format = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })

  return (
    <span className={className}>
      <span className="sr-only">{format(value)}</span>
      <span aria-hidden>{format(current)}</span>
    </span>
  )
}

export function CountUpProgress({
  value,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Progress>, "value"> & { value: number }) {
  const current = useCountUp(value)

  return (
    <Progress
      value={current}
      // The animation drives every frame, so the bar's own CSS transition
      // would only make it lag behind the numbers.
      className={cn(
        "[&_[data-slot=progress-indicator]]:transition-none",
        className
      )}
      {...props}
    />
  )
}
