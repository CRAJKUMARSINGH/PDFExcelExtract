import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Zap, ScanText, TableProperties } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversionOptionsProps {
  mode: string;
  setMode: (mode: string) => void;
  disabled?: boolean;
}

export function ConversionOptions({ mode, setMode, disabled }: ConversionOptionsProps) {
  const options = [
    {
      id: "basic",
      title: "Basic Extraction",
      description: "Fast text extraction for native PDFs. Best for simple documents.",
      icon: Zap,
    },
    {
      id: "advanced",
      title: "Advanced Formatting",
      description: "Preserves tables, headers, and layout structure. Ideal for forms.",
      icon: TableProperties,
    },
    {
      id: "ocr",
      title: "OCR + Text Recovery",
      description: "For scanned images and flattened PDFs. Uses advanced recognition.",
      icon: ScanText,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Conversion Strategy</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
          Recommended: OCR
        </span>
      </div>
      <RadioGroup
        value={mode}
        onValueChange={setMode}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        disabled={disabled}
      >
        {options.map((option) => (
          <div key={option.id}>
            <RadioGroupItem
              value={option.id}
              id={option.id}
              className="peer sr-only"
            />
            <Label
              htmlFor={option.id}
              className={cn(
                "flex flex-col h-full p-4 rounded-lg border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200",
                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="p-2 w-fit rounded-md bg-muted text-foreground mb-3 peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground">
                <option.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold mb-1">{option.title}</div>
              <p className="text-xs text-muted-foreground font-normal leading-relaxed">
                {option.description}
              </p>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

