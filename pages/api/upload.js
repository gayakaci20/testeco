import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable body parser for this route (needed for form-data)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Handling file upload request for local storage');
    
    // Parse the incoming form data
    const { fields, files } = await new Promise((resolve, reject) => {
      const form = new IncomingForm({
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
      });
      
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });
    
    // Get the uploaded file - handle both array and single object formats
    let file = files.photo;
    
    // Check if file is an array and extract the first element
    if (Array.isArray(file)) {
      console.log('File is an array, extracting first element');
      file = file[0];
    }
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Get bucket and path from fields or use defaults
    // Handle both array and single value formats from formidable
    const bucket = Array.isArray(fields.bucket) ? fields.bucket[0] : fields.bucket || 'packagephotos';
    const subPath = Array.isArray(fields.path) ? fields.path[0] : fields.path || '';
    
    // Log file structure to debug
    console.log('Uploading file to local storage:', file.originalFilename);
    
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', bucket);
      const fullUploadDir = subPath ? path.join(uploadsDir, subPath) : uploadsDir;
      
      if (!fs.existsSync(fullUploadDir)) {
        fs.mkdirSync(fullUploadDir, { recursive: true });
      }
      
      // Generate a unique filename using timestamp and original name
      const fileExt = file.originalFilename.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = path.join(fullUploadDir, fileName);
      
      // Copy file to uploads directory
      await fs.promises.copyFile(file.filepath, filePath);
      
      // Clean up the temporary file
      await fs.promises.unlink(file.filepath);
      
      // Generate public URL
      const publicUrl = `/uploads/${bucket}${subPath ? `/${subPath}` : ''}/${fileName}`;
      
      console.log('File uploaded successfully to local storage:', publicUrl);
      
      return res.status(200).json({
        url: publicUrl,
        success: true,
      });
    } catch (processError) {
      console.error('File processing error:', processError);
      return res.status(500).json({ 
        message: 'Error processing uploaded file', 
        error: processError.message 
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      message: 'File upload failed', 
      error: error.message
    });
  }
}