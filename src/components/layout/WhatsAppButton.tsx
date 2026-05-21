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
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-[80px] md:bottom-6 right-4 z-40 flex items-center gap-2 pl-3 pr-4 h-12 rounded-full bg-[hsl(142,70%,42%)] text-white shadow-[0_8px_24px_-6px_rgba(16,150,70,0.55)] hover:shadow-[0_12px_28px_-6px_rgba(16,150,70,0.7)] hover:scale-[1.03] active:scale-95 transition-all duration-300"
    >
      {/* Pulse ring */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-[hsl(142,70%,45%)] opacity-40 animate-ping pointer-events-none"
        style={{ animationDuration: "2.4s" }}
      />

      {/* WhatsApp glyph */}
      <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm">
        <svg
          viewBox="0 0 32 32"
          className="w-5 h-5 fill-white"
          aria-hidden="true"
        >
          <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.13-.6.13-.93 0-.184-.43-.273-.602-.358-.43-.215-1.575-.778-1.978-.778zM16.005 30.205c-1.917 0-3.79-.515-5.434-1.49l-3.79 1.49.99-3.79c-1.16-1.74-1.747-3.79-1.747-5.91 0-6.04 4.92-10.957 10.96-10.957C22.04 9.548 27 14.466 27 20.505c0 6.04-4.96 10.957-10.995 10.957zm0-19.79c-4.876 0-8.85 3.973-8.85 8.85 0 1.747.486 3.4 1.404 4.834l.215.36-.745 2.722 2.793-.745.345.215c1.39.83 2.98 1.275 4.605 1.275 4.876 0 8.85-3.974 8.85-8.85.04-4.876-3.935-8.85-8.81-8.85z" />
        </svg>
      </span>

      {/* Label */}
      <span className="relative text-sm font-semibold tracking-wide whitespace-nowrap">
        Live chat
      </span>

      {/* Online dot */}
      <span
        aria-hidden
        className="relative -ml-1 flex h-2 w-2"
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-200 ring-2 ring-white/60" />
      </span>
    </a>
  );
};

export default WhatsAppButton;
