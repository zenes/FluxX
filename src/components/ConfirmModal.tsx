'use client';

import { useEffect } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({ isOpen, onConfirm, onCancel }: ConfirmModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                // Prevent bubbling up to the parent modal
                e.preventDefault();
                e.stopPropagation();
                onCancel();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc, { capture: true }); // Use capture phase to intercept early
        }

        return () => window.removeEventListener('keydown', handleEsc, { capture: true });
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-md transition-opacity duration-200"
            onClick={(e) => {
                e.stopPropagation();
                onCancel();
            }}
        >
            <div
                className="w-full max-w-sm bg-card border border-destructive/30 shadow-[0_0_30px_rgba(220,38,38,0.2)] rounded-md p-6 relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-destructive to-transparent opacity-50"></div>

                <h3 className="text-lg font-bold tracking-widest text-destructive uppercase mb-4 flex items-center gap-2">
                    <span className="opacity-70">///</span> Warning
                </h3>

                <p className="text-sm font-mono text-muted-foreground leading-relaxed mb-6">
                    You have unsaved changes. Are you sure you want to discard them?
                </p>

                <div className="flex justify-end gap-3 font-mono">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel();
                        }}
                        className="px-4 py-2 text-xs font-bold border border-input rounded-sm hover:bg-muted transition-colors uppercase tracking-widest"
                    >
                        Keep Editing
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                        className="px-6 py-2 bg-destructive/20 text-destructive border border-destructive/50 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-destructive/30 transition-colors shadow-[0_0_10px_rgba(220,38,38,0.3)] focus:outline-none focus:ring-1 focus:ring-destructive"
                    >
                        Discard
                    </button>
                </div>
            </div>
        </div>
    );
}
