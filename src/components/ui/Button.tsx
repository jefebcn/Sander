import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const buttonVariants = cva(
  // Base — always present
  "inline-flex items-center justify-center gap-2 font-extrabold rounded-2xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-black hover:bg-[var(--accent-dim)] shadow-[var(--shadow-glow)]",
        secondary:
          "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface-3)] border border-[var(--border)]",
        ghost:
          "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-2)]",
        danger:
          "bg-[var(--danger)]/15 text-[var(--danger)] hover:bg-[var(--danger)]/25 border border-[var(--danger)]/30",
        success:
          "bg-[var(--live)] text-black hover:bg-[var(--live)]/90 shadow-lg shadow-[var(--live)]/20",
        outline:
          "border-2 border-[var(--accent)] text-[var(--accent)] bg-transparent hover:bg-[var(--accent)]/10",
      },
      // 56px is the project's touch floor; sm is only for secondary inline
      // actions next to a primary one.
      size: {
        sm: "min-h-[2.75rem] px-4 text-sm rounded-xl",
        md: "min-h-[3.5rem] px-5 text-base",
        lg: "min-h-[3.5rem] px-6 text-lg",
        xl: "min-h-[4rem] px-6 text-lg",
        icon: "h-14 w-14 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)
Button.displayName = "Button"

export { buttonVariants }
