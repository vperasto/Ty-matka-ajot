import React from 'react';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b-2 border-black p-4 bg-gray-100">
                    <h2 className="font-serif font-bold text-lg uppercase">{title}</h2>
                    <Button onClick={onClose} variant="danger" className="py-1 px-3 text-xs">
                        [X] SULJE
                    </Button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 font-mono text-sm">
                    {children}
                </div>
            </div>
        </div>
    );
};