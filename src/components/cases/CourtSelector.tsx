import { useState, useEffect } from 'react'
import { COURT_SYSTEM } from '@/lib/constants/courts'

interface CourtSelectorProps {
  value: {
    category: string
    subType: string
    location: string
  }
  onChange: (value: { category: string; subType: string; location: string }) => void
  error?: string
}

export function CourtSelector({ value, onChange, error }: CourtSelectorProps) {
  const categories = Object.keys(COURT_SYSTEM)

  const subTypes = value.category
    ? Object.keys(COURT_SYSTEM[value.category] || {})
    : []

  const locations = value.category && value.subType
    ? COURT_SYSTEM[value.category]?.[value.subType] || []
    : []

  const handleCategoryChange = (category: string) => {
    onChange({ category, subType: '', location: '' })
  }

  const handleSubTypeChange = (subType: string) => {
    onChange({ ...value, subType, location: '' })
  }

  const handleLocationChange = (location: string) => {
    onChange({ ...value, location })
  }

  return (
    <div className="grid grid-cols-1 gap-3">

      {/* نوع القضية */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          نوع القضية <span className="text-red-500">*</span>
        </label>
        <select
          value={value.category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-navy-900 dark:text-white"
        >
          <option value="" className="dark:bg-navy-900">— اختر نوع القضية —</option>
          {categories.map((cat) => (
            <option key={cat} value={cat} className="dark:bg-navy-900">{cat}</option>
          ))}
        </select>
      </div>

      {/* التصنيف */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          التصنيف <span className="text-red-500">*</span>
        </label>
        <select
          value={value.subType}
          onChange={(e) => handleSubTypeChange(e.target.value)}
          disabled={!value.category}
          className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-navy-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" className="dark:bg-navy-900">— اختر التصنيف —</option>
          {subTypes.map((sub) => (
            <option key={sub} value={sub} className="dark:bg-navy-900">{sub}</option>
          ))}
        </select>
      </div>

      {/* المحكمة / المكان */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          المحكمة / المكان <span className="text-red-500">*</span>
        </label>
        <select
          value={value.location}
          onChange={(e) => handleLocationChange(e.target.value)}
          disabled={!value.subType}
          className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-navy-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" className="dark:bg-navy-900">— اختر المحكمة —</option>
          {locations.map((loc) => (
            <option key={loc} value={loc} className="dark:bg-navy-900">{loc}</option>
          ))}
        </select>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
