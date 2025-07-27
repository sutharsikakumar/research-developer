'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function WaitListPage() {
  const [email, setEmail] = useState('')
  const [done,  setDone]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase
      .from('waitlist-beta')
      .insert({ email })  
    if (error) return alert(error.message)
    setDone(true)
  }

  if (done) return <p>🎉 Thanks! Check your inbox when we open the beta.</p>

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border p-2 rounded w-64"
      />
      <button className="bg-black text-white px-4 py-2 rounded">
        Join wait‑list
      </button>
    </form>
  )
}
