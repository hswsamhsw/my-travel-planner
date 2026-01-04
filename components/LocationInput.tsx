
import React, { useState } from 'react';
import { MapPinIcon } from './Icons';

interface LocationInputProps {
  onSearch: (location: string, coords?: { lat: number; lng: number }) => void;
  isLoading: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({ onSearch, isLoading }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch(value);
  };

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSearch('My Location', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Please enable location permissions.");
        }
      );
    }
  };

  return (
    <div className="relative group">
      <form onSubmit={handleSubmit} className="flex gap-2 p-1.5 bg-white rounded-[2rem] shadow-lg shadow-slate-200 border border-slate-100 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Where to next?"
          className="flex-1 bg-transparent px-5 py-3 text-sm font-bold placeholder:text-slate-300 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleGeoLocation}
          className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-orange-600 transition-colors"
          disabled={isLoading}
        >
          <MapPinIcon className="w-5 h-5" />
        </button>
        <button
          type="submit"
          className="bg-slate-900 text-white px-6 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
          disabled={isLoading || !value.trim()}
        >
          {isLoading ? '...' : 'Search'}
        </button>
      </form>
    </div>
  );
};

export default LocationInput;
