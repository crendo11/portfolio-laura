"use client";
import {useEffect, useState} from 'react';

const Header = () => {
  const [isScroll, setIsScroll] = useState(false);
  const handleScroll = () => {
    const scrolled = window.scrollY;
    setIsScroll(scrolled > 100);
  }

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [])

  return (
    <header>
      <div className={`fixed w-full bg-transparent flex items-center justify-between z-50 transition-all ease-linear duration-200`}
           style={{ color: 'black', fontSize: `${isScroll ? "1rem": "2rem"}` }}>
        <span className="font-bold text-lg ml-[10px] mr-[10px]">Leidy Laura Rendon</span>
        <span className="font-normal text-base ml-[10px] mr-[10px]">about</span>
      </div>
    </header>
  )
}

export default Header;