import React, { useState, useRef, useEffect } from "react";
import { CreditCustomer } from "../types.js";
import { User, Check, Search, ShieldCheck } from "lucide-react";

interface CreditPartyAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  customers: CreditCustomer[];
  placeholder?: string;
  className?: string;
}

export default function CreditPartyAutocomplete({
  value,
  onChange,
  customers,
  placeholder = "Party / Customer Name",
  className = ""
}: CreditPartyAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter customers based on input text
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(value.toLowerCase().trim()) ||
    c.contact.includes(value.trim())
  );

  // Exact matched registered customer if any
  const matchedCustomer = customers.find(c => 
    c.name.toLowerCase() === value.toLowerCase().trim()
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (customerName: string) => {
    onChange(customerName);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredCustomers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex(prev => (prev < filteredCustomers.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : filteredCustomers.length - 1));
    } else if (e.key === "Enter") {
      if (highlightIndex >= 0 && highlightIndex < filteredCustomers.length) {
        e.preventDefault();
        handleSelect(filteredCustomers[highlightIndex].name);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
        />
        {value && (
          <span className="absolute right-2 top-2 text-[10px] text-neutral-400 pointer-events-none">
            {matchedCustomer ? "✓ Registered" : ""}
          </span>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && filteredCustomers.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-1 text-xs">
          <div className="px-3 py-1 text-[10px] font-bold uppercase text-neutral-400 bg-neutral-50 dark:bg-zinc-800/50">
            Registered Credit Parties
          </div>
          {filteredCustomers.map((customer, idx) => {
            const isSelected = value.toLowerCase().trim() === customer.name.toLowerCase();
            const isHighlighted = idx === highlightIndex;
            return (
              <div
                key={customer.id}
                onClick={() => handleSelect(customer.name)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                  isHighlighted 
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200" 
                    : isSelected 
                    ? "bg-neutral-100 dark:bg-zinc-800 font-semibold" 
                    : "hover:bg-neutral-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1">
                    <User className="w-3 h-3 text-indigo-500" />
                    {customer.name}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {customer.contact} • Limit: ₹{customer.creditLimit.toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px]">
                    Bal: ₹{customer.balance.toLocaleString()}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-emerald-500 ml-auto mt-0.5" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Helper badge when party is recognized */}
      {matchedCustomer && (
        <div className="mt-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>Registered Party • Limit: ₹{matchedCustomer.creditLimit.toLocaleString()} • Outstanding: ₹{matchedCustomer.balance.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
