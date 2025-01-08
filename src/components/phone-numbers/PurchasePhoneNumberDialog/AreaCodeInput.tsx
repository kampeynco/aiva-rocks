import { Input } from "@/components/ui/input";

interface AreaCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function AreaCodeInput({ value, onChange, disabled }: AreaCodeInputProps) {
  return (
    <Input
      placeholder="Enter area code (e.g., 415)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={3}
      className="h-10"
      disabled={disabled}
    />
  );
}