"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPosition } from "@/lib/actions"

export function SimplePositionForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("Junior")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", "")
      formData.append("experience_level", experienceLevel)
      formData.append("skills", JSON.stringify(["JavaScript"]))
      formData.append("soft_skills", JSON.stringify([]))
      formData.append("contract_type", "")

      await createPosition(formData)
    } catch (error) {
      console.error("Error creating position:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titolo della posizione</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="es. Sviluppatore Frontend React"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience_level">Livello di esperienza</Label>
        <select
          id="experience_level"
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="Junior">Junior</option>
          <option value="Mid-Level">Mid-Level</option>
          <option value="Senior">Senior</option>
        </select>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annulla
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creazione in corso..." : "Crea posizione"}
        </Button>
      </div>
    </form>
  )
}
