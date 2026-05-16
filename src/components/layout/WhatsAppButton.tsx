import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const WhatsAppButton = () => {
  const { settings } = useSiteSettings();
  const whatsappNumber = settings.whatsapp_number || "";

  if (!whatsappNumber) return null;

  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");

  return (
    <a
      href={`https://wa.me/${cleanNumber}?text=Hi%20Pikooly!%20I'd%20like%20to%20order`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[72px] md:bottom-6 right-4 z-40 w-12 h-12 bg-[hsl(142,70%,45%)] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={22} />
    </a>
  );
};

export default WhatsAppButton;
