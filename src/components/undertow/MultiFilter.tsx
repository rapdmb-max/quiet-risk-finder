import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function MultiFilter({ label, values, options, onChange }: { label: string; values: string[]; options: { value: string; label: string }[]; onChange: (values: string[]) => void }) {
  return <Popover>
    <PopoverTrigger asChild><Button variant="outline" aria-label={`Filter by ${label.toLowerCase()}`} className="h-9 bg-panel text-meta font-normal">{label}{values.length > 0 && <span className="font-mono">{values.length}</span>}<ChevronDown /></Button></PopoverTrigger>
    <PopoverContent align="start" className="w-56 p-2">
      <div className="flex items-center justify-between border-b px-2 pb-2"><span className="text-meta font-semibold">{label}</span><Button variant="link" onClick={() => onChange([])} className="h-auto p-0 text-meta font-normal">Clear</Button></div>
      {options.map((o) => <label key={o.value} className="flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-meta hover:bg-soft"><input type="checkbox" checked={values.includes(o.value)} onChange={(e) => onChange(e.target.checked ? [...values, o.value] : values.filter((v) => v !== o.value))}/>{o.label}</label>)}
    </PopoverContent>
  </Popover>;
}