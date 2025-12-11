import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold border-2 border-black transition-all active:translate-y-0.5 active:translate-x-0.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none font-mono uppercase tracking-wider";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-100",
    secondary: "bg-black text-white hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]",
    danger: "bg-white text-black border-black hover:bg-red-50 hover:border-red-600 hover:text-red-600"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};