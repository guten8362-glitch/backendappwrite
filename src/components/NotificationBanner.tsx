import { useState, useEffect } from "react";
import { BellRing, X, Loader2 } from "lucide-react";
import { requestFCMToken } from "../lib/firebase";
import { syncPushTarget, useAuth } from "../lib/auth";
import { updateUserFCMToken } from "../lib/appwrite/users";

export function NotificationBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default" && user) {
        setShow(true);
      }
    }
  }, [user]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const token = await requestFCMToken();
      if (token && user) {
        await updateUserFCMToken(user.email, token, user.$id);
        await syncPushTarget(token);
        setShow(false);
      } else if (Notification.permission === "denied") {
        alert("Notifications were denied. Please enable them in your browser settings.");
        setShow(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md relative z-50">
      <div className="flex items-center gap-3">
        <div className="bg-primary-foreground/20 p-2 rounded-full">
          <BellRing className="size-5" />
        </div>
        <div>
          <p className="text-sm font-bold">Enable Push Notifications</p>
          <p className="text-xs opacity-90">Get instantly notified when your booking is approved.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={handleEnable}
          disabled={loading}
          className="bg-primary-foreground text-primary px-4 py-1.5 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-all flex items-center gap-2"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Enable Now
        </button>
        <button onClick={() => setShow(false)} className="opacity-70 hover:opacity-100 p-1">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
