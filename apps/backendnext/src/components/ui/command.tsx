import * as React from "react"
import { cn } from "@/lib/utils"

const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-xl bg-white text-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = "Command"

const CommandDialog = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <Command {...props}>{children}</Command>
)

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, value, onValueChange, onChange, readOnly, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value)
    onChange?.(e)
  }

  // Determine if the component is controlled
  const isControlled = value !== undefined
  const hasChangeHandler = !!onValueChange || !!onChange

  // If controlled without a change handler, force readOnly to avoid the React warning
  const resolvedReadOnly = isControlled && !hasChangeHandler
    ? true
    : readOnly

  return (
    <input
      ref={ref}
      value={value}
      onChange={hasChangeHandler ? handleChange : undefined}
      readOnly={resolvedReadOnly}
      className={cn(
        "flex h-11 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
CommandInput.displayName = "CommandInput"

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-full w-full flex-col overflow-y-auto max-h-[300px]", className)}
    {...props}
  />
))
CommandList.displayName = "CommandList"

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full items-center justify-center p-6 text-sm text-gray-400",
      className
    )}
    {...props}
  />
))
CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[commandgroup]]:px-1 [&_[commandgroup]]:py-1 [&_[commandgroup]]:text-sm [&_[commandgroup]]:font-medium [&_[commandgroup]]:text-foreground [&_[commandgroup]]:hover:bg-gray-50 [&_[commandgroup]]:hover:text-gray-900",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = "CommandGroup"

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string; onSelect?: () => void }
>(({ className, value, onSelect, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none hover:bg-gray-50 hover:text-gray-900 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
      onClick={onSelect}
    />
  )
})
CommandItem.displayName = "CommandItem"

export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem }