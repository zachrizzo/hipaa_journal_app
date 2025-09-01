import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const headingVariants = cva("font-semibold tracking-tight", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      gradient: "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      default: "text-lg",
      lg: "text-xl",
      xl: "text-2xl",
      "2xl": "text-3xl",
      "3xl": "text-4xl",
      "4xl": "text-5xl",
    },
    as: {
      h1: "",
      h2: "",
      h3: "",
      h4: "",
      h5: "",
      h6: "",
    }
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    as: "h2",
  },
})

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant, size, as: Component = "h2", ...props }, ref) => {
    return (
      <Component
        className={cn(headingVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export { Heading, headingVariants }