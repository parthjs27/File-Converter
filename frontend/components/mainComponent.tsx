"use client"

import React, { useRef, useState, useEffect } from "react"
import { Upload, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { fileConverterApi, UploadResponse, StatusResponse } from "@/lib/api"

type ConversionStatus = 'idle' | 'uploading' | 'converting' | 'completed' | 'error'

export default function Component() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [inputFormat, setInputFormat] = useState<string>("")
  const [outputFormat, setOutputFormat] = useState("pdf")
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>('idle')
  const [taskId, setTaskId] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setConversionStatus('idle')
      setDownloadUrl(null)
      setErrorMessage(null)
      setTaskId(null)

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

  const handleConvert = async () => {
    if (!selectedFile) return

    try {
      setConversionStatus('uploading')
      setErrorMessage(null)

      // Upload file to backend
      const response: UploadResponse = await fileConverterApi.uploadFile(selectedFile, outputFormat)
      setTaskId(response.task_id)
      setConversionStatus('converting')

      // Start polling for status
      pollConversionStatus(response.task_id)

    } catch (error) {
      console.error('Upload failed:', error)
      setErrorMessage('Failed to upload file. Please try again.')
      setConversionStatus('error')
    }
  }

  const pollConversionStatus = async (taskId: string) => {
    const maxAttempts = 60 // 60 seconds max (increased from 30)
    let attempts = 0

    const poll = async () => {
      try {
        const status: StatusResponse = await fileConverterApi.checkStatus(taskId)
        
        if (status.status === 'completed' && status.download_url) {
          setDownloadUrl(status.download_url)
          setConversionStatus('completed')
          return
        } else if (status.status === 'error' || status.error) {
          setErrorMessage(status.error || 'Conversion failed')
          setConversionStatus('error')
          return
        } else if (status.status === 'processing') {
          // Continue polling
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000) // Poll every second
          } else {
            setErrorMessage('Conversion timeout. Please try again.')
            setConversionStatus('error')
          }
        } else {
          // Unknown status, continue polling
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000)
          } else {
            setErrorMessage('Conversion timeout. Please try again.')
            setConversionStatus('error')
          }
        }
      } catch (error) {
        console.error('Status check failed:', error)
        setErrorMessage('Failed to check conversion status.')
        setConversionStatus('error')
      }
    }

    poll()
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  const getStatusIcon = () => {
    switch (conversionStatus) {
      case 'uploading':
      case 'converting':
        return <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (conversionStatus) {
      case 'uploading':
        return 'Uploading...'
      case 'converting':
        return 'Converting...'
      case 'completed':
        return 'Ready!'
      case 'error':
        return 'Error'
      default:
        return ''
    }
  }

  const isConverting = conversionStatus === 'uploading' || conversionStatus === 'converting'
  const canConvert = selectedFile && conversionStatus === 'idle'
  const canDownload = conversionStatus === 'completed' && downloadUrl

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
            <Select value={outputFormat} onValueChange={setOutputFormat} disabled={isConverting}>
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

          {/* Convert/Download Button */}
          <div className="flex-shrink-0">
            {canDownload ? (
              <Button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 text-lg font-medium rounded-xl flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download
              </Button>
            ) : (
              <Button
                onClick={handleConvert}
                disabled={!canConvert || isConverting}
                className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-3 text-lg font-medium rounded-xl flex items-center gap-2"
              >
                {getStatusIcon()}
                {getStatusText() || 'Convert'}
              </Button>
            )}
          </div>
        </div>

        {/* Status/Error Messages */}
        {errorMessage && (
          <div className="mt-4 p-4 bg-red-600 text-white rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        {conversionStatus === 'converting' && taskId && (
          <div className="mt-4 p-4 bg-blue-600 text-white rounded-xl text-center">
            Converting your file... Task ID: {taskId}
          </div>
        )}
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
