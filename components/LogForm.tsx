"use client";
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface LogFormProps {
  onLogCreated: () => void; // A function to call after creation to refresh the list
}

export default function LogForm({ onLogCreated }: LogFormProps) {
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !startDate || !endDate) {
      setError('All fields are required.');
      return;
    }
    if (startDate >= endDate) {
      setError('The end date must be after the start date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, startDate, endDate }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to save log.');
      }

      setLocation(''); 
      onLogCreated(); 
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg mb-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-300">Save a Weather Log</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter a location (e.g., London, UK)"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="yyyy/MM/dd"
          />
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            // ✅ FINAL FIX: Explicitly convert null to undefined for the prop.
            minDate={startDate || undefined}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="yyyy/MM/dd"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 p-3 rounded-lg font-semibold transition shadow-md disabled:bg-gray-500"
        >
          {loading ? 'Saving...' : 'Save Log'}
        </button>
      </form>
    </div>
  );
}