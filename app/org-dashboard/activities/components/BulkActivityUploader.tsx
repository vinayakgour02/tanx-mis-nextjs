"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Upload, Loader2, X, FileSpreadsheet, AlertCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import axios from "axios" // Ensure axios is installed: npm install axios
import { useOrganizationId } from "@/hooks/useOrganizationId"

interface BulkActivityUploaderProps {
}

export function BulkActivityUploader() {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [errors, setErrors] = useState<string[]>([])
    const { organizationId } = useOrganizationId()
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return
        validateAndSetFile(e.target.files[0])
    }

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragleave" || e.type === "dragover") {
            setDragActive(e.type === "dragenter" || e.type === "dragover")
        }
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0])
    }

    const validateAndSetFile = (selectedFile: File) => {
        setErrors([]) // Clear previous errors
        if (!selectedFile.name.endsWith(".xlsx")) {
            toast.error("Please upload an Excel (.xlsx) file")
            return
        }
        setFile(selectedFile)
    }

    const handleUpload = async () => {
        if (!file || !organizationId) {
            toast.error("Missing file or project configuration.")
            return
        }

        setLoading(true)
        setErrors([])

        const formData = new FormData()
        formData.append("file", file)
        formData.append("organizationId", organizationId)

        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload-bulk-excel`, 
                formData, 
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            )

            toast.success(`Success! Created ${res.data.count} Plans.`)
            setOpen(false)
            setFile(null)
            
        } catch (err: any) {
            console.error(err)
            
            // Handle structured errors from backend (e.g. specific rows)
            if (err.response?.data?.details) {
                setErrors(err.response.data.details)
                toast.error("Upload failed with validation errors.")
            } else {
                // Handle generic errors
                const errorMessage = err.response?.data?.error || err.message || "Upload Failed"
                toast.error(errorMessage)
            }
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

    const resetState = () => {
        setFile(null)
        setErrors([])
    }

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <Upload className="h-4 w-4 mr-2" /> Upload Excel
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Bulk Upload Activities</DialogTitle>
                        <DialogDescription>
                            Upload an Excel file to process activities server-side.
                        </DialogDescription>
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
                                    <p className="font-semibold text-foreground">
                                        {dragActive ? "Drop your file here" : "Drag and drop your Excel file"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">or click to browse</p>
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
                                            onClick={resetState}
                                            disabled={loading}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </CardHeader>
                            </Card>
                        )}

                        {/* Error Display Section */}
                        {errors.length > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Validation Errors</AlertTitle>
                                <AlertDescription>
                                    <ScrollArea className="h-[100px] w-full mt-2 rounded-md border bg-white/50 p-2">
                                        <ul className="list-disc pl-4 space-y-1 text-xs">
                                            {errors.map((err, index) => (
                                                <li key={index}>{err}</li>
                                            ))}
                                        </ul>
                                    </ScrollArea>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpen(false)
                                resetState()
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