"use client";

import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  helperText?: string;
};

export default function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  helperText,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-neutral-900">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-4 pr-16 text-base text-neutral-900 outline-none transition focus:border-neutral-500"
        />

        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      {helperText ? (
        <p className="mt-2 text-sm text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}