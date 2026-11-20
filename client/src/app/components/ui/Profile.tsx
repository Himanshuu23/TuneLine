"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { signOut, useSession } from "next-auth/react";

const MENU_WIDTH = 220;

export default function Profile() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = session?.user?.name || "User";
  const email = session?.user?.email || "";
  const image = session?.user?.image;

  const openMenu = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      let left = rect.right - MENU_WIDTH;
      left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        width: MENU_WIDTH,
        zIndex: 9999,
      });
    }
    setIsOpen(true);
  }, []);

  const toggleMenu = () => {
    if (isOpen) setIsOpen(false);
    else openMenu();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("resize", openMenu);
    return () => window.removeEventListener("resize", openMenu);
  }, [isOpen, openMenu]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-label="Profile menu"
        className="w-9 h-9 rounded-full border border-white/30 bg-cover bg-center cursor-pointer shrink-0 hover:border-white/60 transition-colors flex items-center justify-center bg-white/10 text-white text-sm font-medium"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      >
        {!image && name.charAt(0).toUpperCase()}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="flex flex-col bg-black border border-white/25 text-white rounded-xl shadow-2xl p-4"
            style={menuStyle}
          >
            <p className="text-sm mx-1 truncate">{name}</p>
            {email && (
              <p className="text-xs text-white/50 mx-1 mb-3 truncate">{email}</p>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: window.location.origin });
              }}
              className="mt-2 text-white text-xs px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
              type="button"
            >
              Logout
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
