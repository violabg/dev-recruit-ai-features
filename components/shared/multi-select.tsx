"use client"

import * as React from "react"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export type OptionType = {
  label: string
  value: string
  category?: string
}

interface MultiSelectProps {
  options: OptionType[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  grouped?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seleziona opzioni",
  className,
  grouped = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const groupedOptions = React.useMemo(() => {
    if (!grouped) return { "": options }

    return options.reduce<Record<string, OptionType[]>>((acc, option) => {
      const category = option.category || ""
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(option)
      return acc
    }, {})
  }, [options, grouped])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("min-h-10 h-auto w-full justify-between", selected.length > 0 ? "px-3 py-2" : "", className)}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 && placeholder}
            {selected.map((item) => (
              <Badge
                variant="secondary"
                key={item}
                className="mr-1 mb-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUnselect(item)
                }}
              >
                {options.find((option) => option.value === item)?.label || item}
                <button
                  className="ml-1 rounded-full outline-hidden ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(item)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => handleUnselect(item)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Cerca opzione..." />
          <CommandList>
            <CommandEmpty>Nessuna opzione trovata.</CommandEmpty>
            {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
              <React.Fragment key={category || "default"}>
                {grouped && category && (
                  <CommandGroup heading={category}>
                    {categoryOptions.map((option) => {
                      const isSelected = selected.includes(option.value)
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => handleSelect(option.value)}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <span>{option.label}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
                {!grouped && (
                  <CommandGroup>
                    {categoryOptions.map((option) => {
                      const isSelected = selected.includes(option.value)
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => handleSelect(option.value)}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <span>{option.label}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
                {category !== Object.keys(groupedOptions).slice(-1)[0] && <CommandSeparator />}
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
