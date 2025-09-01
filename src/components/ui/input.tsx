import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

interface InputWithIconProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, type, icon, iconPosition = "left", ...props }, ref) => {
    const iconClasses = iconPosition === "left" ? "left-0 pl-3" : "right-0 pr-3"
    const inputPadding = iconPosition === "left" ? "pl-10" : "pr-10"

    return (
      <div className="relative">
        {icon && (
          <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-slate-400", iconClasses)}>
            {icon}
          </div>
        )}
        <Input
          type={type}
          className={cn(icon && inputPadding, className)}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
InputWithIcon.displayName = "InputWithIcon"

export { Input, InputWithIcon }
