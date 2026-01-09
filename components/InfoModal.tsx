
import React from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-lg rounded-2xl p-6 border-white/10 relative shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">{content}</div>
        <button 
          onClick={onClose}
          className="mt-6 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default InfoModal;
