"use client";
import { useEffect, useState } from "react";
import InfoModal from '@/components/InfoModal'

const Header = () => {
  const [isScroll, setIsScroll] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleScroll = () => {
    const scrolled = window.scrollY;
    setIsScroll(scrolled > 100);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <>
      <header>
        <div
          className={`fixed w-full flex items-center justify-between z-50 transition-all ease-in-out duration-300 ${
            isScroll ? "px-4 py-2" : "px-4 py-4"
          }`}
          style={{ color: "black" }}
        >
          <span
            className={`font-bold text-2xl transition-transform duration-300 ease-in-out origin-left ${
              isScroll ? "scale-75" : "scale-100"
            }`}
          >
            Leidy Laura Rendon
          </span>
          <span
            onClick={openModal}
            className={`cursor-pointer font-normal text-2xl transition-transform duration-300 ease-in-out origin-left ${
              isScroll ? "scale-75" : "scale-100"
            }`}
          >
            about
          </span>
        </div>
      </header>
      {showModal && <InfoModal onClose={closeModal} />}
    </>
  );
};


export default Header;