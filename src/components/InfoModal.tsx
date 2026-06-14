"use client";
import { useEffect, useRef, useState } from "react";
import { sanityClient } from "@/lib/sanity";
import { PortableText } from '@portabletext/react'


type About = {
  name: string;
  description: any;
  email: string;
  profilePic: {
    asset: { url: string };
  };
};

type ModalProps = {
  onClose: () => void;
};

const TITLE_ID = "info-modal-title";

const InfoModal = ({ onClose }: ModalProps) => {
  const [sisterInfo, setSisterInfo] = useState<About | null>(null);

  // Ref to the dialog container for focus trapping
  const dialogRef = useRef<HTMLDivElement>(null);
  // Capture the element that was focused before the modal opened so we can restore it on close
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Capture the currently focused element the moment the component mounts
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  // Body scroll lock
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Move focus into the dialog on mount and again once data loads (loading→content transition)
  useEffect(() => {
    if (!dialogRef.current) return;
    const focusable = dialogRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [sisterInfo]);

  // Keyboard: Escape to close + Tab/Shift+Tab focus trap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Return focus to the trigger element when the modal unmounts
  useEffect(() => {
    return () => {
      requestAnimationFrame(() => {
        previousFocusRef.current?.focus();
      });
    };
  }, []);

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type == "about"][0]{
          name,
          description,
          email,
          profilePic{ asset->{ url } }
        }`
      )
      .then((data) => setSisterInfo(data))
      .catch((error) => console.error("Error fetching sister data:", error));
  }, []);

  if (!sisterInfo) {
    return (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="About"
        aria-busy="true"
        className="fixed inset-0 flex items-center justify-center z-50"
      >
        <div className="bg-white relative p-4 rounded shadow">
          <button
            type="button"
            aria-label="Close"
            className="absolute top-2 right-2 flex items-center justify-center w-11 h-11 text-gray-600 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            onClick={onClose}
          >
            &#x2715;
          </button>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      className="fixed inset-0 flex items-center justify-center z-50"
    >
      {/* Modal overlay */}
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      {/* Modal content */}
      <div className="bg-white relative p-6 rounded shadow-lg max-w-md sm:max-w-[70vw] max-h-[80vh] overflow-y-auto mx-auto z-10">
        <button
          type="button"
          aria-label="Close"
          className="absolute top-2 right-2 flex items-center justify-center w-11 h-11 text-gray-600 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          onClick={onClose}
        >
          &#x2715;
        </button>
        <div className="flex flex-col items-center">
          <img
            src={sisterInfo.profilePic.asset.url}
            alt={sisterInfo.name}
            className="mb-4 max-h-[50vh]"
          />
          <h2 id={TITLE_ID} className="text-xl font-bold mb-2">{sisterInfo.name}</h2>
          <div className="mb-4 text-gray-950">
            <PortableText value={sisterInfo.description} />
          </div>
          <a
            href={`mailto:${sisterInfo.email}`}
            className="text-blue-500 hover:underline"
          >
            {sisterInfo.email}
          </a>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
