import { useState, useRef } from "react";

interface FilterProps {
  filter: {
    status: string;
    themes: string[];
    format: string;
    location: string;
    search: string;
  };
  setFilter: (filter: any) => void;
  onClose: () => void;
  onReset: () => void;
  projects: { tags?: string[] }[];
}

export default function FilterPage({
  filter,
  setFilter,
  onClose,
  onReset,
  projects,
}: FilterProps) {
  // собираем все теги из проектов
  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags ?? [])));
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-[90%] max-w-md p-6 shadow-xl overflow-y-auto max-h-[90vh] relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Filters</h2>
          <button
            onClick={onClose}
            className="text-gray-500 text-3xl hover:text-gray-700"
            aria-label="close filters"
          >
            ×
          </button>
        </div>

        {/* Status */}
        <div className="mb-5">
          <label className="text-gray-600 font-medium">Status</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="mt-2 w-full border-2 border-gray-200 rounded-xl p-2"
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="past">Past</option>
          </select>
        </div>

        {/* Theme */}
        <div className="flex flex-col relative" ref={themeRef}>
          <label className="text-[#6C7280] text-lg font-medium mb-1">
            Theme
          </label>

          {/* контрол видимого поля */}
          <div
            onClick={() => setThemeOpen((s) => !s)}
            role="button"
            aria-haspopup="listbox"
            aria-expanded={themeOpen}
            className="w-full border-2 border-[#E5E9EF] rounded-xl bg-[#FBFCFC] text-black cursor-pointer flex flex-col gap-2 min-h-[48px] items-start p-2"
          >
            {filter.themes.length === 0 ? (
              <span className="text-gray-400">Select themes...</span>
            ) : (
              filter.themes.map((t) => (
                <span
                  key={t}
                  className="bg-[#E6F0FF] text-[#2663EB] px-2 py-1 rounded-lg text-sm flex items-center gap-2 "
                >
                  {t}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilter({
                        ...filter,
                        themes: filter.themes.filter((x) => x !== t),
                      });
                    }}
                    className="text-xs ml-1"
                    aria-label={`Remove ${t}`}
                  >
                    ✕
                  </button>
                </span>
              ))
            )}

            {/* caret */}
            <div className="ml-auto pl-2">
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  themeOpen ? "rotate-180" : "rotate-0"
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 011.06-.02L10 10.9l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.25a.75.75 0 01-.02-1.04z" />
              </svg>
            </div>
          </div>

          {/* Dropdown */}
          {themeOpen && (
            <div
              className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
              role="listbox"
              aria-multiselectable="true"
            >
              {allTags.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No themes</div>
              ) : (
                allTags.map((theme) => {
                  const selected = filter.themes.includes(theme);
                  return (
                    <div
                      key={theme}
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        if (selected) {
                          setFilter({
                            ...filter,
                            themes: filter.themes.filter((t) => t !== theme),
                          });
                        } else {
                          setFilter({
                            ...filter,
                            themes: [...filter.themes, theme],
                          });
                        }
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        tabIndex={-1}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{theme}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Format */}
        <div className="mb-5">
          <label className="text-gray-600 font-medium">Format</label>
          <select
            value={filter.format}
            onChange={(e) => setFilter({ ...filter, format: e.target.value })}
            className="mt-2 w-full border-2 border-gray-200 rounded-xl p-2"
          >
            <option value="">All</option>
            <option value="online">Online</option>
            <option value="in-person">In-person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {/* Location */}
        <div className="mb-5">
          <label className="text-gray-600 font-medium">Location</label>
          <input
            type="text"
            value={filter.location}
            onChange={(e) => setFilter({ ...filter, location: e.target.value })}
            className="mt-2 w-full border-2 border-gray-200 rounded-xl p-2"
            placeholder="Berkeley, CA"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={onReset}
            className="border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-100"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
