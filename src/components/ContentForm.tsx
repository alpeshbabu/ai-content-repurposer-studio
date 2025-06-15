'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface RepurposedContent {
  platform: string
  content: string
}

export default function ContentForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [repurposedContent, setRepurposedContent] = useState<RepurposedContent[]>([])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const data = {
        title: formData.get('title'),
        content: formData.get('content'),
        contentType: formData.get('content-type')
      }

      const response = await fetch('/api/repurpose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to repurpose content')
      }

      const repurposed = await response.json()
      setRepurposedContent(repurposed)
      toast.success('Content repurposed successfully!')

      // Save to database
      const saveResponse = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          repurposedContent: repurposed
        })
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to save content')
      }

      toast.success('Content saved! Redirecting to dashboard...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter content title"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="content-type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Content Type
          </label>
          <select
            id="content-type"
            name="content-type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="blog">Blog Post</option>
            <option value="article">Article</option>
            <option value="video_transcript">Video Transcript</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="content" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your content here..."
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
        >
          {isLoading ? 'Processing...' : 'Create & Repurpose'}
        </button>
      </form>

      {repurposedContent.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Repurposed Content</h2>
          {repurposedContent.map((item, index) => (
            <div key={index} className="rounded-lg border p-4">
              <h3 className="text-lg font-semibold capitalize mb-2">{item.platform}</h3>
              <p className="text-sm whitespace-pre-wrap">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 