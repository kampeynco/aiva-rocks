import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Voice } from '../types/voice'

interface VoicesDropdownProps {
  selectedLanguage: string | null
  onVoiceSelect: (voice: Voice | null) => void
  selectedVoice: Voice | null
}

export default function VoicesDropdown({
  selectedLanguage,
  onVoiceSelect,
  selectedVoice,
}: VoicesDropdownProps) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVoices() {
      if (!selectedLanguage) {
        setVoices([])
        onVoiceSelect(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from('voices')
          .select('*')
          .eq('language', selectedLanguage)
          .order('name')

        if (error) throw error

        setVoices(data || [])
        
        // Reset selected voice if it's not in the new voice list
        if (selectedVoice && !data?.some(voice => voice.id === selectedVoice.id)) {
          onVoiceSelect(null)
        }
      } catch (err) {
        setError('Failed to fetch voices')
        console.error('Error fetching voices:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVoices()
  }, [selectedLanguage, selectedVoice, onVoiceSelect])

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Voice
      </label>
      <select
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        value={selectedVoice?.id || ''}
        onChange={(e) => {
          const selectedVoice = voices.find(voice => voice.id === e.target.value)
          onVoiceSelect(selectedVoice || null)
        }}
        disabled={!selectedLanguage || loading}
      >
        <option value="">Select a voice</option>
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </select>
      {loading && <p className="mt-1 text-sm text-gray-500">Loading voices...</p>}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {!loading && !error && voices.length === 0 && selectedLanguage && (
        <p className="mt-1 text-sm text-gray-500">No voices available for selected language</p>
      )}
    </div>
  )
}