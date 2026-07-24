"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

type DatePickerProps = {
  name: string;
  value?: string | Date | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  showTime?: boolean;
};

export function DatePicker({ name, value, onChange, placeholder = "Pilih tanggal", showTime = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value instanceof Date ? value : value ? new Date(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (!value) {
      // New article: use current time
      return new Date().toTimeString().slice(0, 5);
    }
    // Existing article: use old time
    const dateObj = value instanceof Date ? value : new Date(value);
    return dateObj.toTimeString().slice(0, 5);
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  useEffect(() => {
    setSelectedDate(value instanceof Date ? value : value ? new Date(value) : null);
    if (value) {
      const dateObj = value instanceof Date ? value : new Date(value);
      setSelectedTime(dateObj.toTimeString().slice(0, 5));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    let finalDate: Date;

    if (showTime && selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      finalDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    } else {
      finalDate = date;
    }

    const dateString = finalDate.toISOString();
    onChange?.(dateString);
    setIsOpen(false);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(":").map(Number);
      const finalDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hours, minutes);
      onChange?.(finalDate.toISOString());
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isSameDay = (date1: Date | null, date2: Date) => {
    if (!date1) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    return isSameDay(date, today);
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          name={name}
          readOnly
          value={selectedDate ? formatDate(selectedDate) : ""}
          placeholder={placeholder}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border border-[var(--line)] rounded-lg px-4 py-3 pr-12 text-sm font-medium text-[var(--foreground)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition cursor-pointer"
        />
        <HugeIcon
          icon={CalendarIcon}
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-[320px] rounded-xl border border-[var(--line)] bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-lg hover:bg-[var(--primary-softer)] transition"
            >
              ←
            </button>
            <span className="font-semibold text-sm">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-2 rounded-lg hover:bg-[var(--primary-softer)] transition"
            >
              →
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              handleDateSelect(today);
              setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            }}
            className="w-full mb-3 py-2 text-sm font-medium text-[var(--primary)] bg-[var(--primary-softer)] rounded-lg hover:bg-[var(--primary-soft)] transition"
          >
            Hari Ini
          </button>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-[var(--muted)] py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                disabled={!day}
                onClick={() => day && handleDateSelect(day)}
                className={[
                  "p-2 text-sm font-medium rounded-lg transition relative",
                  !day ? "invisible" : "",
                  day && isSameDay(selectedDate, day)
                    ? "bg-[var(--primary-strong)] text-white"
                    : "hover:bg-[var(--primary-softer)] text-[var(--foreground)]",
                  day && isToday(day) && !isSameDay(selectedDate, day)
                    ? "border-2 border-[var(--primary)]"
                    : "",
                ].filter(Boolean).join(" ")}
              >
                {day ? day.getDate() : ""}
              </button>
            ))}
          </div>

          {showTime && (
            <div className="mt-4 pt-4 border-t border-[var(--line)]">
              <label className="block text-xs font-medium text-[var(--muted)] mb-2">
                Jam
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
