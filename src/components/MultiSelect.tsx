import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string; // Comma separated string
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MultiSelect({ options, selected, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedArr = selected ? selected.split(', ').filter(Boolean) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    let newSelected;
    if (selectedArr.includes(opt)) {
      newSelected = selectedArr.filter(item => item !== opt);
    } else {
      newSelected = [...selectedArr, opt];
    }
    onChange(newSelected.join(', '));
  };

  const removeOption = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    const newSelected = selectedArr.filter(item => item !== opt);
    onChange(newSelected.join(', '));
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-primary flex flex-wrap gap-1 items-center min-h-[42px] cursor-pointer"
      >
        {selectedArr.length === 0 && (
          <span className="text-gray-400 ml-1">{placeholder || "Pilih opsi..."}</span>
        )}
        {selectedArr.map(opt => (
          <span key={opt} className="bg-primary/20 text-primary px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold">
            {opt}
            <button type="button" onClick={(e) => removeOption(e, opt)} className="hover:bg-primary/30 rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a252b] border border-white/10 rounded shadow-xl max-h-60 overflow-y-auto">
          {options.map((opt, i) => {
            const isSelected = selectedArr.includes(opt);
            return (
              <div 
                key={i} 
                onClick={() => toggleOption(opt)}
                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-white/5 ${isSelected ? 'text-primary bg-primary/10' : 'text-gray-300'}`}
              >
                {opt}
                {isSelected && <Check className="w-4 h-4" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
