import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
  circleColor?: string;
}

export function MiCafecitoLogo({ size = 120, className = '', circleColor = '#366D82' }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 200 200" 
      width={size} 
      height={size} 
      className={`select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      id="mi-cafecito-circle-logo"
    >
      {/* Circle Background */}
      <circle cx="100" cy="100" r="95" fill={circleColor} />
      
      {/* Laurel Leaves Arch (Faithful to the elegant design in user's image) */}
      <g transform="translate(100, 75)" fill="white">
        {/* Left Laurel Branch */}
        <path d="M-5,-4 C-20,-12 -38,-10 -58,-1 M-5,-4 C-17,-7 -30,-6 -45,-1" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" />
        
        {/* Left Laurel Leaves */}
        <path d="M-12,-8 C-14,-14 -18,-11 -15,-6 C-13,-2 -10,-4 -12,-8 Z" />
        <path d="M-21,-10 C-24,-16 -28,-13 -25,-8 C-23,-4 -19,-5 -21,-10 Z" />
        <path d="M-31,-10 C-34,-16 -39,-12 -35,-7 C-32,-3 -28,-4 -31,-10 Z" />
        <path d="M-41,-8 C-45,-13 -49,-9 -45,-4 C-42,1 -38,0 -41,-8 Z" />
        <path d="M-50,-4 C-55,-8 -58,-4 -53,1 C-49,5 -46,1 -50,-4 Z" />
        <path d="M-57,1 C-62,-2 -64,3 -59,6 C-55,9 -53,4 -57,1 Z" />
        
        {/* Right Laurel Branch */}
        <path d="M5,-4 C20,-12 38,-10 58,-1 M5,-4 C17,-7 30,-6 45,-1" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" />
        
        {/* Right Laurel Leaves */}
        <path d="M12,-8 C14,-14 18,-11 15,-6 C13,-2 10,-4 12,-8 Z" />
        <path d="M21,-10 C24,-16 28,-13 25,-8 C23,-4 19,-5 21,-10 Z" />
        <path d="M31,-10 C34,-16 39,-12 35,-7 C32,-3 28,-4 31,-10 Z" />
        <path d="M41,-8 C45,-13 49,-9 45,-4 C42,1 38,0 41,-8 Z" />
        <path d="M50,-4 C55,-8 58,-4 53,1 C49,5 46,1 50,-4 Z" />
        <path d="M57,1 C62,-2 64,3 59,6 C55,9 53,4 57,1 Z" />
      </g>
      
      {/* "RESTAURANT & BISTRÕ" Text */}
      <text 
        x="100" 
        y="114" 
        fill="#FFFFFF" 
        fontSize="8" 
        fontWeight="600" 
        letterSpacing="0.08em" 
        textAnchor="middle" 
        fontFamily="Times New Roman, Georgia, serif"
      >
        RESTAURANT & BISTRÕ
      </text>
      
      {/* "MI CAFECITO" Display Text */}
      <text 
        x="100" 
        y="138" 
        fill="#FFFFFF" 
        fontSize="19" 
        fontWeight="bold" 
        letterSpacing="0.02em" 
        textAnchor="middle" 
        fontFamily="Times New Roman, Georgia, Cambria, serif"
      >
        MI CAFECITO
      </text>
    </svg>
  );
}
