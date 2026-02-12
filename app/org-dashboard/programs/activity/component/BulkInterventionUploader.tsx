"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Upload, Loader2, Check, X, FileSpreadsheet } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import * as XLSX from "xlsx"

export function BulkInterventionUploader() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [programName, setProgramName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const selectedFile = e.target.files[0]
    await processFile(selectedFile)
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".xlsx")) {
      toast.error("Please upload an Excel (.xlsx) file")
      return
    }

    setFile(selectedFile)

    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const metaSheet = workbook.Sheets["__meta"]

      if (!metaSheet) {
        toast.error("Invalid file format. Missing __meta sheet.")
        setFile(null)
        return
      }

      const metaData = XLSX.utils.sheet_to_json(metaSheet, { header: 1 }) as any[][]
      const programId = metaData?.[0]?.[1]

      if (!programId) {
        toast.error("Program ID missing in file metadata.")
        setFile(null)
        return
      }

      const res = await fetch(`/api/programs/${programId}`)
      if (!res.ok) throw new Error("Failed to fetch program name")
      const data = await res.json()
      setProgramName(data.name || `Program ${programId}`)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to read Excel file. Please check the file format.")
      setFile(null)
      setProgramName(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const templateSheet = workbook.Sheets["Template"]
      const metaSheet = workbook.Sheets["__meta"]
      const idMapSheet = workbook.Sheets["__idmap"]

      if (!templateSheet || !metaSheet || !idMapSheet) {
        toast.error("Invalid Excel format. Use the provided template.")
        setLoading(false)
        return
      }

      const metaData = XLSX.utils.sheet_to_json(metaSheet, { header: 1 }) as any[][]
      const programId = metaData?.[0]?.[1]

      if (!programId) throw new Error("Program ID missing")

      const templateData = XLSX.utils.sheet_to_json(templateSheet, { header: 1 }) as any[][]
      const idMapData = XLSX.utils.sheet_to_json(idMapSheet, { header: 1 }) as any[][]

      const objectiveMap: Record<string, string> = {}
      const indicatorMap: Record<string, string> = {}

      // Build objective map (columns 0-1)
      for (let i = 1; i < idMapData.length; i++) {
        if (idMapData[i]?.[0]) {
          objectiveMap[idMapData[i][0]] = idMapData[i][1]
        }
      }

      // Build indicator map (columns 3-4)
      for (let i = 1; i < idMapData.length; i++) {
        if (idMapData[i]?.[3]) {
          indicatorMap[idMapData[i][3]] = idMapData[i][4]
        }
      }

      const rows: any[] = []
      for (let r = 1; r < templateData.length; r++) {
        const objectiveName = templateData[r]?.[0]
        const interventionName = templateData[r]?.[1]
        const subName = templateData[r]?.[2]
        const indicatorName = templateData[r]?.[3]

        if (!objectiveName || !interventionName) continue

        const objectiveId = objectiveMap[objectiveName]
        const indicatorId = indicatorName ? indicatorMap[indicatorName] : null

        const subIntervention = subName
          ? [{ name: subName, indicators: indicatorId ? [{ id: indicatorId }] : [] }]
          : indicatorId
            ? [{ name: interventionName, indicators: [{ id: indicatorId }] }]
            : []

        rows.push({
          name: interventionName,
          programId,
          objectiveId,
          subInterventions: subIntervention,
        })
      }

      if (rows.length === 0) {
        toast.error("No valid interventions found in the file.")
        setLoading(false)
        return
      }

      const res = await fetch("/api/intervention/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interventions: rows }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      toast.success(`Upload finished! Success: ${data.successCount}, Errors: ${data.errors?.length || 0}`)
      setOpen(false)
      setFile(null)
      setProgramName(null)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to process Excel file")
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-2" /> Bulk Upload
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Upload Interventions</DialogTitle>
            <DialogDescription>Upload your Excel template to import interventions in bulk</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-lg border-2 border-dashed transition-colors p-8 text-center cursor-pointer ${
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-lg bg-muted p-3">
                    <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {dragActive ? "Drop your file here" : "Drag and drop your Excel file"}
                    </p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Only .xlsx files are supported</p>
                </div>
              </div>
            ) : (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="rounded-lg bg-primary/10 p-2 mt-1">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{file.name}</CardTitle>
                        <CardDescription className="text-xs">{formatFileSize(file.size)}</CardDescription>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null)
                        setProgramName(null)
                      }}
                      disabled={loading}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-background p-3 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Uploading for:</p>
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      <p className="font-semibold text-foreground">{programName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                setFile(null)
                setProgramName(null)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
