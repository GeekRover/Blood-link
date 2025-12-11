import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import "react-day-picker/dist/style.css";

function Calendar({ isDarkMode = false, fromYear = 1900, toYear = new Date().getFullYear(), ...props }) {
  const [showYearPicker, setShowYearPicker] = React.useState(false);
  const [showMonthPicker, setShowMonthPicker] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(props.selected || new Date());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = [];
  for (let year = toYear; year >= fromYear; year--) {
    years.push(year);
  }

  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(monthIndex);
    setCurrentMonth(newDate);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
    setShowYearPicker(false);
  };

  React.useEffect(() => {
    if (props.selected) {
      setCurrentMonth(props.selected);
    }
  }, [props.selected]);

  return (
    <div style={{
      padding: '0.75rem',
      color: isDarkMode ? '#f1f5f9' : '#111827',
      position: 'relative'
    }}>
      <style>{`
        .rdp {
          --rdp-accent-color: #dc2626;
          --rdp-background-color: ${isDarkMode ? '#1e293b' : '#fee2e2'};
          --rdp-outline: 2px solid var(--rdp-accent-color);
          color: ${isDarkMode ? '#f1f5f9' : '#111827'};
        }

        .rdp-day_selected {
          background-color: #dc2626 !important;
          color: white !important;
        }

        .rdp-day_today {
          font-weight: bold;
          color: #dc2626;
        }

        .rdp-caption {
          display: flex;
          justify-content: center;
          align-items: center;
          padding-bottom: 1rem;
          position: relative;
        }

        .rdp-nav_button {
          color: ${isDarkMode ? '#cbd5e1' : '#6b7280'};
        }

        .rdp-nav_button:hover {
          background-color: ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(243, 244, 246, 1)'};
        }

        .year-month-selector {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .selector-button {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${isDarkMode ? '#f1f5f9' : '#111827'};
          background-color: ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : '#ffffff'};
          border: 1.5px solid ${isDarkMode ? '#475569' : '#d1d5db'};
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .selector-button:hover {
          border-color: #dc2626;
          background-color: ${isDarkMode ? 'rgba(71, 85, 105, 0.9)' : '#f9fafb'};
        }

        .picker-dropdown {
          position: absolute;
          top: 3.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: ${isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)'};
          border: 1.5px solid ${isDarkMode ? '#475569' : '#d1d5db'};
          border-radius: 0.75rem;
          padding: 0.5rem;
          max-height: 250px;
          overflow-y: auto;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
          z-index: 50;
          min-width: 200px;
        }

        .picker-dropdown::-webkit-scrollbar {
          width: 8px;
        }

        .picker-dropdown::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#1e293b' : '#f1f5f9'};
          border-radius: 4px;
        }

        .picker-dropdown::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#475569' : '#cbd5e1'};
          border-radius: 4px;
        }

        .picker-dropdown::-webkit-scrollbar-thumb:hover {
          background: #dc2626;
        }

        .picker-item {
          padding: 0.625rem 1rem;
          cursor: pointer;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.15s ease;
          color: ${isDarkMode ? '#e2e8f0' : '#1f2937'};
        }

        .picker-item:hover {
          background: ${isDarkMode ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.1)'};
          color: #dc2626;
        }

        .picker-item.active {
          background: #dc2626;
          color: white;
          font-weight: 600;
        }
      `}</style>

      {/* Custom Year/Month Selector */}
      <div className="year-month-selector">
        <button
          type="button"
          className="selector-button"
          onClick={() => {
            setShowMonthPicker(!showMonthPicker);
            setShowYearPicker(false);
          }}
        >
          {months[currentMonth.getMonth()]}
          <ChevronDown style={{ width: '14px', height: '14px' }} />
        </button>
        <button
          type="button"
          className="selector-button"
          onClick={() => {
            setShowYearPicker(!showYearPicker);
            setShowMonthPicker(false);
          }}
        >
          {currentMonth.getFullYear()}
          <ChevronDown style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* Month Picker Dropdown */}
      {showMonthPicker && (
        <div className="picker-dropdown">
          {months.map((month, index) => (
            <div
              key={month}
              className={`picker-item ${currentMonth.getMonth() === index ? 'active' : ''}`}
              onClick={() => handleMonthSelect(index)}
            >
              {month}
            </div>
          ))}
        </div>
      )}

      {/* Year Picker Dropdown */}
      {showYearPicker && (
        <div className="picker-dropdown">
          {years.map((year) => (
            <div
              key={year}
              className={`picker-item ${currentMonth.getFullYear() === year ? 'active' : ''}`}
              onClick={() => handleYearSelect(year)}
            >
              {year}
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      <DayPicker
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        {...props}
      />
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
