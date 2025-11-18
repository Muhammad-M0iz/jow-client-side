'use client';

import { type ChangeEvent, type FormEvent } from 'react';
import './Search.css';

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  isLoading?: boolean;
  onSubmit?: (value: string) => void;
  id?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search everything...',
  label,
  autoFocus,
  isLoading,
  onSubmit,
  id = 'global-search',
}: SearchInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form className="search-input" onSubmit={handleSubmit} role="search">
      {label ? (
        <label htmlFor={id} className="search-label">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        aria-label={label ?? placeholder}
      />
      <span className="search-icon" aria-hidden="true">
        {isLoading ? '⏳' : '🔎'}
      </span>
    </form>
  );
}

export default SearchInput;
