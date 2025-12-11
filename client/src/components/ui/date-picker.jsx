import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export function DatePicker({ date, onDateChange, placeholder = "Pick a date", className = "", isDarkMode = false, disabled = false }) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedDate) => {
    onDateChange(selectedDate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          style={{
            width: '100%',
            height: '45px',
            paddingLeft: '2.75rem',
            paddingRight: '1rem',
            border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '0.875rem',
            transition: 'all 0.3s ease',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            color: date ? (isDarkMode ? '#f1f5f9' : '#111827') : '#9ca3af',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            fontWeight: date ? '500' : '400',
            textAlign: 'left',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
          onFocus={(e) => {
            if (!disabled) e.target.style.borderColor = '#dc2626';
          }}
          onBlur={(e) => {
            if (!disabled) e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb';
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              e.target.style.borderColor = '#dc2626';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && !open) {
              e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb';
            }
          }}
          className={className}
        >
          <CalendarIcon
            style={{
              position: 'absolute',
              left: '1rem',
              width: '18px',
              height: '18px',
              color: '#9ca3af'
            }}
          />
          {date ? format(date, "MMMM dd, yyyy") : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent
        style={{
          width: 'auto',
          padding: 0,
          borderRadius: '16px',
          border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
          background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          marginTop: '8px',
        }}
        align="start"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          isDarkMode={isDarkMode}
          captionLayout="dropdown-buttons"
          fromYear={1900}
          toYear={new Date().getFullYear()}
          disabled={(date) => date > new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
