import type { IconType } from "react-icons";
import { LuMessageSquareText } from "react-icons/lu";
import {
  SiDiscord,
  SiElement,
  SiGmail,
  SiImessage,
  SiProtoncalendar,
  SiProtondrive,
  SiProtonmail,
  SiSignal,
  SiTelegram,
  SiTuta,
  SiWhatsapp,
} from "react-icons/si";
import { cn } from "@/lib/cn";

export type Brand = { name: string; Icon: IconType; bg: string };

// Official brand marks (Simple Icons) on their brand colours, styled like app icons
export const BRANDS = {
  signal: { name: "Signal", Icon: SiSignal, bg: "linear-gradient(145deg,#3a76f0,#2c5bd0)" },
  whatsapp: { name: "WhatsApp", Icon: SiWhatsapp, bg: "linear-gradient(145deg,#2fe16f,#1aa851)" },
  imessage: { name: "iMessage", Icon: SiImessage, bg: "linear-gradient(145deg,#5cf777,#0bbd2a)" },
  protonmail: { name: "Proton Mail", Icon: SiProtonmail, bg: "linear-gradient(145deg,#8f6bff,#5a2de0)" },
  protondrive: { name: "Proton Drive", Icon: SiProtondrive, bg: "linear-gradient(145deg,#ff6ec7,#7b3bff)" },
  protoncalendar: { name: "Proton Calendar", Icon: SiProtoncalendar, bg: "linear-gradient(145deg,#5ad3ff,#6d4aff)" },
  tuta: { name: "Tuta Mail", Icon: SiTuta, bg: "linear-gradient(145deg,#ff4a55,#c91a25)" },
  element: { name: "Element", Icon: SiElement, bg: "linear-gradient(145deg,#1fd1a2,#0a9d76)" },
  gmail: { name: "Gmail", Icon: SiGmail, bg: "linear-gradient(145deg,#ff5a4d,#d93025)" },
  telegram: { name: "Telegram", Icon: SiTelegram, bg: "linear-gradient(145deg,#37bbfe,#1e96d1)" },
  discord: { name: "Discord", Icon: SiDiscord, bg: "linear-gradient(145deg,#7289ff,#5865f2)" },
  sms: { name: "SMS", Icon: LuMessageSquareText, bg: "linear-gradient(145deg,#94a3b8,#64748b)" },
} satisfies Record<string, Brand>;

export type BrandKey = keyof typeof BRANDS;

export function AppIcon({ brand, className }: { brand: BrandKey; className?: string }) {
  const { Icon, bg, name } = BRANDS[brand];
  return (
    <span
      title={name}
      className={cn("grid shrink-0 place-items-center rounded-[22%] text-white shadow-lg", className)}
      style={{ background: bg }}
    >
      <Icon className="size-[58%]" aria-hidden />
      <span className="sr-only">{name}</span>
    </span>
  );
}
