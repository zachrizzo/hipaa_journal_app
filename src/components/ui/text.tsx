import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      success: "text-green-600",
      warning: "text-yellow-600",
      destructive: "text-destructive",
      primary: "text-primary",
      secondary: "text-secondary-foreground",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      default: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    leading: {
      none: "leading-none",
      tight: "leading-tight",
      snug: "leading-snug",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
      loose: "leading-loose",
    }
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    weight: "normal",
    align: "left",
    leading: "normal",
  },
})

export interface TextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof textVariants> {
  as?: React.ElementType
}

const Text = React.forwardRef<HTMLSpanElement, TextProps>(
  ({ className, variant, size, weight, align, leading, as: Component = "span", ...props }, ref) => {
    return (
      <Component
        className={cn(textVariants({ variant, size, weight, align, leading, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Text, textVariants }