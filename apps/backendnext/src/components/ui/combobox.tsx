import * as React from "react"
import { cn } from "@/lib/utils"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"

export interface ComboboxProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function Combobox({ options, value, onChange, placeholder = "Select...", disabled = false }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedLabel = options.find((o: { value: string; label: string }) => o.value === value)?.label

  const filteredOptions = search
    ? options.filter((o: { value: string; label: string }) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        o.value.toLowerCase().includes(search.toLowerCase())
      )
    : options

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors w-full",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className={cn("flex-1 text-left", !selectedLabel && "text-gray-400")}>{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 rounded-xl border border-gray-200 shadow-xl bg-white">
        <Command>
          <CommandInput
            placeholder={placeholder}
            className="h-11 border-b border-gray-100 bg-gray-50/50 px-3"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="px-2 py-6 text-sm text-gray-400">No results found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option: { value: string; label: string }) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700"
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      option.value === value ? "opacity-100 text-blue-600" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
