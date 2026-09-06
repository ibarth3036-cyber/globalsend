import { useState, useRef, useEffect } from 'react'
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi'

interface Option {
  value: string
  label: string
}

interface SearchSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  label?: string
  searchable?: boolean
}

export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  searchable = true,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && searchable) {
      searchRef.current?.focus()
      setQuery('')
    }
  }, [open, searchable])

  const selected = options.find(o => o.value === value)
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  function handleSelect(opt: Option) {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="search-select" ref={wrapperRef}>
      {label && <label className="search-select-label">{label}</label>}
      <button
        type="button"
        className={`search-select-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className={selected ? '' : 'placeholder'}>{selected ? selected.label : placeholder}</span>
        <FiChevronDown size={16} className={`search-select-arrow ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="search-select-dropdown" ref={listRef}>
          {searchable && (
            <div className="search-select-search">
              <FiSearch size={15} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search..."
              />
              {query && (
                <button className="search-select-clear" onClick={() => setQuery('')}>
                  <FiX size={14} />
                </button>
              )}
            </div>
          )}
          <div className="search-select-options">
            {filtered.length === 0 ? (
              <div className="search-select-empty">No results</div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`search-select-option ${opt.value === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
