import { cn } from '@/lib/utils'

export function SiteHeader({ className, children }: React.HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
        className
      )}
    >
      {children}
    </header>
  )
}
