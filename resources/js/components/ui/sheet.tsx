import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-[80] bg-[rgba(4,7,12,0.55)] backdrop-blur-[3px] data-[state=open]:fade-in data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-card border-l border-border-subtle shadow-[0_16px_40px_rgba(0,0,0,0.42)] flex flex-col gap-4 fixed z-[90] transition-[transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=open]:animate-in data-[state=closed]:animate-out",
          side === "right" &&
            "inset-y-0 right-0 h-full w-[540px] max-w-full data-[state=closed]:translate-x-[105%] data-[state=open]:translate-x-0",
          side === "left" &&
            "inset-y-0 left-0 h-full w-[540px] max-w-full border-r border-border-subtle data-[state=closed]:translate-x-[-105%] data-[state=open]:translate-x-0",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b border-border-subtle data-[state=closed]:translate-y-[-100%] data-[state=open]:translate-y-0",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t border-border-subtle data-[state=closed]:translate-y-[100%] data-[state=open]:translate-y-0",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-[10px] opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:size-4"
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 px-5.5 py-5 border-b border-border-subtle", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex gap-2 px-5.5 py-3.5 border-t border-border-subtle flex-wrap", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
