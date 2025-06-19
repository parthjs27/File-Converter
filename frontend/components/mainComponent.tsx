"use client"

import React, { useRef, useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

export default function Component() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [inputFormat, setInputFormat] = useState<string>("")
  const [outputFormat, setOutputFormat] = useState("pdf")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)

      // Extract file extension and set as input format
      const ext = file.name.split(".").pop()
      if (ext) {
        setInputFormat(`.${ext.toLowerCase()}`)
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen bg-gray-800 flex flex-col items-center justify-center p-4">
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Free File Converter</h1>
        <p className="text-2xl md:text-3xl font-medium">
          <span className="text-cyan-400">Upload.</span>{" "}
          <span className="text-yellow-400">Create.</span>{" "}
          <span className="text-purple-400">Export.</span>
        </p>
      </div>

      {/* Upload & Conversion Section */}
      <div className="w-full max-w-5xl">
        <div className="bg-gray-700 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 md:gap-8">

          {/* File Upload Display (non-clickable) */}
          <div className="flex-1 min-w-0">
            <div className="block w-full p-4 bg-gray-600 rounded-xl border-2 border-dashed border-gray-500 transition-colors">
              <div className="text-center">
                <div className="text-gray-300 text-lg truncate overflow-hidden whitespace-nowrap">
                  {selectedFile ? selectedFile.name : "No file chosen"}
                </div>
              </div>
            </div>
          </div>

          {/* Upload Icon (clickable only) */}
          <div className="flex-shrink-0">
            <div
              onClick={handleUploadClick}
              className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-teal-600 transition-colors"
            >
              <Upload className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Input Format (detected) */}
          <div className="flex-shrink-0">
            <div className="bg-gray-600 text-white px-8 py-1.5 text-lg font-medium rounded-xl">
              {inputFormat || ".format"}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <div className="text-yellow-400 text-3xl font-bold">→</div>
          </div>

          {/* Output Format Selector */}
          <div className="flex-shrink-0">
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger className="w-29 bg-gray-600 text-white text-lg font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-600 border-gray-500">
                <SelectItem value="pdf" className="text-white hover:bg-gray-500">
                  .pdf
                </SelectItem>
                <SelectItem value="docx" className="text-white hover:bg-gray-500">
                  .docx
                </SelectItem>
                <SelectItem value="png" className="text-white hover:bg-gray-500">
                  .png
                </SelectItem>
                <SelectItem value="jpg" className="text-white hover:bg-gray-500">
                  .jpg
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Download Button */}
          <div className="flex-shrink-0">
            <Button
              className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-3 text-lg font-medium rounded-xl"
              disabled={!selectedFile}
            >
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id="file-upload"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".docx,.doc,.txt,.rtf,.pdf,.jpeg,.jpg,.png"
      />
    </div>
  )
}
