import { NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import sharp from 'sharp'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes) as Buffer

    // Compress image files
    if (file.type.startsWith('image/')) {
      try {
        // Configure compression based on file type
        let compressedBuffer: Buffer<ArrayBufferLike>
        
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          compressedBuffer = await sharp(buffer)
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer()
        } else if (file.type === 'image/png') {
          compressedBuffer = await sharp(buffer)
            .png({ quality: 80, compressionLevel: 9 })
            .toBuffer()
        } else if (file.type === 'image/webp') {
          compressedBuffer = await sharp(buffer)
            .webp({ quality: 80 })
            .toBuffer()
        } else if (file.type === 'image/avif') {
          compressedBuffer = await sharp(buffer)
            .avif({ quality: 80 })
            .toBuffer()
        } else {
          // For other image types, convert to JPEG with compression
          compressedBuffer = await sharp(buffer)
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer()
        }
        
        // Only use compressed buffer if it's smaller
        if (compressedBuffer.length < buffer.length) {
          buffer = compressedBuffer as Buffer
          console.log(`Compressed ${file.name}: ${bytes.byteLength} → ${buffer.length} bytes (${Math.round((1 - buffer.length / bytes.byteLength) * 100)}% reduction)`)
        }
      } catch (compressionError) {
        console.warn('Compression failed, uploading original file:', compressionError)
        // Continue with original buffer if compression fails
      }
    }

    const result = await uploadToCloudinary(
      { buffer, mimetype: file.type },
      folder
    )

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      originalName: file.name,
    })
  } catch (error) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
