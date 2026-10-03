import { Input } from "./input";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Slider } from "./slider";
import { Checkbox } from "./checkbox";
import { Badge } from "./badge";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FilterProps<T = any> {
  label: string;
  value: T;
  onChange: (value: T) => void;
}

export function TextFilter({ label, value, onChange }: FilterProps<string>) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

export function SelectFilter({ 
  label, 
  value, 
  onChange, 
  options 
}: FilterProps<string> & { 
  options: SelectOption[]
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function MultiSelectFilter({ 
  label, 
  value, 
  onChange, 
  options 
}: FilterProps<string[]> & { 
  options: SelectOption[]
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {value.map(val => {
            const option = options.find(opt => opt.value === val);
            return (
              <Badge 
                key={val} 
                variant="secondary" 
                className="flex items-center gap-1"
              >
                {option?.label}
                <button
                  onClick={() => onChange(value.filter(v => v !== val))}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
        <Select
          value=""
          onValueChange={(val) => {
            if (!value.includes(val)) {
              onChange([...value, val]);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Add ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options
              .filter(option => !value.includes(option.value))
              .map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function RangeFilter({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  formatValue 
}: FilterProps<[number, number]> & { 
  min: number;
  max: number;
  step: number;
  formatValue?: (value: number) => string;
}) {
  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onChange}
        className="w-full"
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatValue ? formatValue(value[0]) : value[0]}</span>
        <span>{formatValue ? formatValue(value[1]) : value[1]}</span>
      </div>
    </div>
  );
}

export function FilterGroup({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6 p-6 border rounded-lg bg-card", className)}>
      {children}
    </div>
  );
}