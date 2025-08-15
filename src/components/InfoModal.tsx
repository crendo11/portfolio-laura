"use client";
import { useEffect, useState } from "react";
import { sanityClient } from "@/lib/sanity";

type About = {
  name: string;
  description: string;
  email: string;
  profilePic: {
    asset: { url: string };
  };
};

type ModalProps = {
  onClose: () => void;
};

const InfoModal = ({ onClose }: ModalProps) => {
  const [sisterInfo, setSisterInfo] = useState<About | null>(null);

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
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded shadow">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Modal overlay */}
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      {/* Modal content */}
      <div className="bg-white relative p-6 rounded shadow-lg max-w-md mx-auto z-10">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          &#x2715;
        </button>
        <div className="flex flex-col items-center">
          <img
            src={sisterInfo.profilePic.asset.url}
            alt={sisterInfo.name}
            className="w-24 h-24 rounded-full mb-4"
          />
          <h2 className="text-xl font-bold mb-2">{sisterInfo.name}</h2>
          <p className="mb-2 text-gray-700 text-center">
            {sisterInfo.description}
          </p>
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
