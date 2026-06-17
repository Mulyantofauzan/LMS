'use client';

import { useId, useMemo, useState } from 'react';

export type SearchableSelectOption = {
  value: string | number;
  label: string;
};

export function SearchableSelect({
  name,
  options,
  placeholder,
  defaultValue,
  required,
  className = '',
}: {
  name: string;
  options: SearchableSelectOption[];
  placeholder: string;
  defaultValue?: string | number | null;
  required?: boolean;
  className?: string;
}) {
  const id = useId();
  const normalizedDefaultValue = defaultValue == null ? '' : String(defaultValue);
  const defaultOption = useMemo(
    () => options.find((option) => String(option.value) === normalizedDefaultValue),
    [normalizedDefaultValue, options],
  );
  const [label, setLabel] = useState(defaultOption?.label ?? '');
  const [value, setValue] = useState(defaultOption ? String(defaultOption.value) : '');

  function syncValue(nextLabel: string) {
    setLabel(nextLabel);
    const exact = options.find((option) => option.label === nextLabel);
    setValue(exact ? String(exact.value) : '');
  }

  return (
    <div className={className}>
      <input type="hidden" name={name} value={value} />
      <input
        list={id}
        value={label}
        onChange={(event) => syncValue(event.currentTarget.value)}
        onBlur={(event) => syncValue(event.currentTarget.value)}
        required={required}
        placeholder={placeholder}
        className="h-10 w-full min-w-0 px-3 rounded-md border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
      />
      <datalist id={id}>
        {options.map((option) => (
          <option key={String(option.value)} value={option.label} />
        ))}
      </datalist>
    </div>
  );
}
