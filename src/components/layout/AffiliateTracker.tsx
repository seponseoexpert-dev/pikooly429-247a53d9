import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "affiliate_ref";
const TS_KEY = "affiliate_ref_ts";
const DEFAULT_DAYS = 30;

export const getStoredAffiliateCode = (cookieDays = DEFAULT_DAYS): string | null => {
  try {
    const code = localStorage.getItem(STORAGE_KEY);
    const ts = parseInt(localStorage.getItem(TS_KEY) || "0", 10);
    if (!code || !ts) return null;
    const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    if (ageDays > cookieDays) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TS_KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
};

const AffiliateTracker = () => {
  const { search } = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(search);
    const ref = params.get("ref");
    if (ref && ref.length >= 3 && ref.length <= 32) {
      try {
        localStorage.setItem(STORAGE_KEY, ref.toUpperCase());
        localStorage.setItem(TS_KEY, Date.now().toString());
      } catch {}
    }
  }, [search]);
  return null;
};

export default AffiliateTracker;
