import { promises as fs } from 'fs';
import path from 'path';

export async function saveImage(imageData: string, filename: string): Promise<string> {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(filename) || '.jpg';
    const uniqueFilename = `${timestamp}_${Math.random().toString(36).substring(2)}${extension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    
    // Save the image
    await fs.writeFile(filePath, base64Data, 'base64');
    
    // Return the public URL
    return `/uploads/${uniqueFilename}`;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error('Failed to save image');
  }
}

export function getImageUrl(imagePath: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
  return `${baseUrl}${imagePath}`;
}