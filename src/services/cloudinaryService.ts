import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload file to Cloudinary
 * @param file - Multer file object
 * @param folder - Cloudinary folder path
 * @returns Upload result with URL and public ID
 */
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `service-station/${folder}`,
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(new Error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param publicId - Cloudinary public ID
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Failed to delete file from Cloudinary: ${error}`);
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
};
