
import React from 'react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, icon, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-300/60 ${className}`}>
      {title && (
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              {/* Added React.isValidElement check and cast to React.ReactElement<any> to resolve type mismatch when cloning with additional props */}
              {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
            </div>
          )}
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
