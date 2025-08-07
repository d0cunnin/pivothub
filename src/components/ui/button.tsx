import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-glow hover:shadow-glow transition-elegant hover:scale-105",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-elegant",
        outline:
          "border border-primary/20 bg-background text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-soft transition-elegant hover:scale-105",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-glow hover:shadow-soft transition-elegant hover:scale-105",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-elegant",
        link: "text-primary underline-offset-4 hover:underline transition-elegant",
        hero: "bg-gradient-hero text-white shadow-strong hover:shadow-glow transition-elegant hover:scale-105 hover:-translate-y-1",
        heroWhite: "bg-white text-blue-600 border-2 border-green-500 hover:bg-gray-50 hover:shadow-md transition-elegant hover:scale-105",
        success: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-soft hover:shadow-strong transition-elegant",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
