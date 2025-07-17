import { Cloudinary } from '@cloudinary/url-gen'

const cloudinary = new Cloudinary({
  cloud: {
    cloudName: 'dvxe3ihxa',
  },
})

export interface UploadResult {
  success: boolean
  url?: string
  publicId?: string
  error?: string
}

export class CloudinaryService {
  private static instance: CloudinaryService
  private cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dvxe3ihxa'
  private uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fyndit_unsigned'

  static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService()
    }
    return CloudinaryService.instance
  }

  async uploadImage(file: File, folder: string = 'fyndit'): Promise<UploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', this.uploadPreset)
      formData.append('folder', folder)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      )

      const data = await response.json()

      if (data.error) {
        return {
          success: false,
          error: data.error.message,
        }
      }

      return {
        success: true,
        url: data.secure_url,
        publicId: data.public_id,
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir imagen',
      }
    }
  }

  async uploadMultipleImages(
    files: File[],
    folder: string = 'fyndit',
  ): Promise<{
    success: boolean
    results: UploadResult[]
    error?: string
  }> {
    try {
      const uploadPromises = files.map((file) => this.uploadImage(file, folder))
      const results = await Promise.all(uploadPromises)

      const failedUploads = results.filter((result) => !result.success)

      if (failedUploads.length > 0) {
        return {
          success: false,
          results,
          error: `${failedUploads.length} imágenes fallaron al subir`,
        }
      }

      return {
        success: true,
        results,
      }
    } catch (error) {
      console.error('Error uploading multiple images:', error)
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Error al subir imágenes',
      }
    }
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      // NOTA: La eliminación requiere autenticación del servidor
      // En un entorno de producción, esto debería hacerse desde el backend
      console.log('Deleting image with publicId:', publicId)

      // Para eliminar desde el frontend necesitarías el API Secret (NO SEGURO)
      // Mejor implementar un endpoint en tu backend que haga la eliminación
      return true
    } catch (error) {
      console.error('Error deleting image:', error)
      return false
    }
  }

  generateOptimizedUrl(publicId: string, width?: number, height?: number): string {
    let transformations = 'f_auto,q_auto'

    if (width) {
      transformations += `,w_${width}`
    }

    if (height) {
      transformations += `,h_${height}`
    }

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformations}/${publicId}`
  }
}

export const cloudinaryService = CloudinaryService.getInstance()
