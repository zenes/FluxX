'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { uploadProfilePicture } from '@/lib/actions';
import { Camera, Loader2, X, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';

export default function ProfilePictureUpload({ currentImage, userEmail }: { currentImage?: string | null, userEmail: string }) {
    const { update } = useSession();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);

    // Cropper State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit to 5MB before even trying to crop
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setImageSrc(objectUrl);
        // Reset file input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropAndSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsUploading(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedBlob) throw new Error('Failed to crop image');

            // Generate preview URL for immediate feedback
            const croppedObjectUrl = URL.createObjectURL(croppedBlob);
            setPreviewUrl(croppedObjectUrl);

            // Upload the newly cropped blob (convert to File)
            const fileToUpload = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });
            const formData = new FormData();
            formData.append('file', fileToUpload);

            const result = await uploadProfilePicture(formData);
            if (result.success) {
                // Force session update
                await update({ image: result.imageUrl });
                setImageSrc(null); // Close modal
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setPreviewUrl(currentImage || null);
            alert('Failed to upload profile picture. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-6 py-4 border-b border-border/50">
            {/* Main Display Area */}
            <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary/20">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xl font-bold text-muted-foreground uppercase">
                            {userEmail?.charAt(0) || 'U'}
                        </span>
                    )}
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || !!imageSrc}
                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <Loader2 size={20} className="text-white animate-spin" />
                    ) : (
                        <Camera size={20} className="text-white" />
                    )}
                </button>
            </div>

            <div className="flex-1">
                <h4 className="font-medium text-sm">Profile Picture</h4>
                <p className="text-xs text-muted-foreground mt-1">
                    Click the image to upload a new avatar. Maximum size is 5MB.
                </p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                />
            </div>

            {/* Cropping Modal */}
            {imageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                            <h3 className="font-semibold text-lg tracking-tight">Crop Image</h3>
                            <button
                                onClick={() => setImageSrc(null)}
                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                                disabled={isUploading}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="relative w-full h-80 bg-black/90">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // Force square crop
                                cropShape="round" // Visual circle mask
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="p-4 bg-muted/30 flex flex-col gap-4">
                            <div className="flex items-center gap-4 px-2">
                                <span className="text-xs font-mono text-muted-foreground">Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button
                                    onClick={() => setImageSrc(null)}
                                    disabled={isUploading}
                                    className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCropAndSave}
                                    disabled={isUploading}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-md transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <><Loader2 size={16} className="animate-spin" /> Saving...</>
                                    ) : (
                                        <><Check size={16} /> Crop & Save</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
