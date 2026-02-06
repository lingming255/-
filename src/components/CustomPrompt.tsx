import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface CustomPromptProps {
  isOpen: boolean;
  title: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const CustomPrompt: React.FC<CustomPromptProps> = ({
  isOpen,
  title,
  defaultValue = '',
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl p-6 transform scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <button onClick={onCancel} className="text-white/50 hover:text-white transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition mb-6"
            placeholder="Type here..."
          />
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm bg-amber-500 hover:bg-amber-400 text-black font-medium transition shadow-lg shadow-amber-500/20"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
