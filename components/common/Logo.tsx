import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <span className={`font-bold text-white whitespace-nowrap ${className}`}>
            <span className="font-light text-[0.6em] align-top mr-1 relative top-[-0.2em]">the</span>
            <span style={{ color: '#E93092' }}>Digital</span>
            <span>Dollhouse</span>
        </span>
    );
};
