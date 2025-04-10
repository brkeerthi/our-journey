'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload } from 'lucide-react'
import Image from 'next/image'

export interface MediaFile extends File {
  preview: string
}

interface MediaUploaderProps {
  files: MediaFile[]
  setFiles: (files: MediaFile[]) => void
}

export default function MediaUploader({ files, setFiles }: MediaUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    ) as MediaFile[]
    
    setFiles((prev: MediaFile[]) => [...prev, ...newFiles])
  }, [setFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const removeFile = (fileToRemove: MediaFile) => {
    URL.revokeObjectURL(fileToRemove.preview)
    setFiles(files.filter(file => file !== fileToRemove))
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragActive 
            ? 'border-white bg-gray-800' 
            : 'border-gray-700 hover:border-gray-500'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-gray-300">Drop the files here ...</p>
        ) : (
          <div className="space-y-1 text-gray-400">
            <p>Drag & drop files here, or click to select files</p>
            <p className="text-sm">Images and videos up to 50MB</p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {files.map((file, index) => (
            <div key={file.preview} className="relative aspect-square group">
              {file.type.startsWith('video/') ? (
                <video
                  src={file.preview}
                  className="w-full h-full object-cover rounded-lg"
                  controls={false}
                />
              ) : (
                <Image
                  src={file.preview}
                  alt={`Preview ${index + 1}`}
                  className="rounded-lg object-cover"
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              )}
              <button
                onClick={() => removeFile(file)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 
                transition-opacity duration-200 rounded-lg" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 