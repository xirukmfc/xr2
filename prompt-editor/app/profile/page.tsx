"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit2, Plus, Save, X } from "lucide-react"

const categoryColors = {
  workflow: "bg-blue-100 text-blue-800 border-blue-200",
  content: "bg-green-100 text-green-800 border-green-200",
  audience: "bg-purple-100 text-purple-800 border-purple-200",
  feature: "bg-orange-100 text-orange-800 border-orange-200",
  custom: "bg-gray-100 text-gray-800 border-gray-200",
}

const categoryLabels = {
  workflow: "Workflow",
  content: "Content",
  audience: "Audience",
  feature: "Feature",
  custom: "Custom",
}

export default function ProfilePage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState("")
  const [newTagCategory, setNewTagCategory] = useState<TagCategory>("custom")
  const [editName, setEditName] = useState("")
  const [editCategory, setEditCategory] = useState<TagCategory>("custom")

  useEffect(() => {
    setTags(getTagDictionary())
  }, [])

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const newTag = addCustomTag(newTagName.trim(), newTagCategory)
      setTags(getTagDictionary())
      setNewTagName("")
      setNewTagCategory("custom")
    }
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag.name)
    setEditName(tag.name)
    setEditCategory(tag.category)
  }

  const handleSaveEdit = () => {
    if (editingTag && editName.trim()) {
      updateTag(editingTag, editName.trim(), editCategory)
      setTags(getTagDictionary())
      setEditingTag(null)
      setEditName("")
    }
  }

  const handleCancelEdit = () => {
    setEditingTag(null)
    setEditName("")
  }

  const handleDeleteTag = (tagName: string) => {
    deleteTag(tagName)
    setTags(getTagDictionary())
  }

  const groupedTags = tags.reduce(
    (acc, tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = []
      }
      acc[tag.category].push(tag)
      return acc
    },
    {} as Record<TagCategory, Tag[]>,
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your tags and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tag Management</CardTitle>
            <CardDescription>
              Create and organize tags for your prompts. Tags help categorize and find your prompts more easily.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Tag */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-3">Add New Tag</h3>
              <div className="flex gap-3">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  className="flex-1"
                />
                <Select value={newTagCategory} onValueChange={(value: TagCategory) => setNewTagCategory(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="audience">Audience</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddTag} className="w-32">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            {/* Existing Tags */}
            {Object.entries(groupedTags).map(([category, tagsInCategory]) => (
              <div key={category} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">{categoryLabels[category as TagCategory]}</h3>
                <div className="flex flex-wrap gap-3">
                  {tagsInCategory.map((tag) => (
                    <div key={tag.name} className="flex items-center gap-2">
                      {editingTag === tag.name ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Tag name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1"
                          />
                          <Select value={editCategory} onValueChange={(value: TagCategory) => setEditCategory(value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="workflow">Workflow</SelectItem>
                              <SelectItem value="content">Content</SelectItem>
                              <SelectItem value="audience">Audience</SelectItem>
                              <SelectItem value="feature">Feature</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={handleSaveEdit} className="w-32">
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                          <Button onClick={handleCancelEdit} className="w-32">
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge className={categoryColors[category as TagCategory]}>{tag.name}</Badge>
                          <Button onClick={() => handleEditTag(tag)} className="w-32">
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button onClick={() => handleDeleteTag(tag.name)} className="w-32">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
