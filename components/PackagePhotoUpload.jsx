import { useState } from 'react';

export default function PackagePhotoUpload({ packageId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WEBP)');
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Set the file and create a preview
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle upload via API
  const handleUpload = async () => {
    if (!file || !packageId) return;
    
    try {
      setUploading(true);
      setError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('bucket', 'packagephotos');
      formData.append('path', packageId);
      
      // Upload using API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const data = await response.json();
      
      if (onUploadComplete) {
        onUploadComplete(data.url);
      }
      
      // Clear the form
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="my-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Package Photo
        </label>
        
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
      
      {preview && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
          <div className="relative w-40 h-40 overflow-hidden rounded-md">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent
            text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
        
        <button
          type="button"
          onClick={() => {
            setFile(null);
            setPreview(null);
            setError(null);
          }}
          disabled={!file || uploading}
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300
            text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 