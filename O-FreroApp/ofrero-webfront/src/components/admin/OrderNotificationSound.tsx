"use client";

import { useEffect, useRef, useState } from "react";
import { apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Order = {
  id: string;
  createdAt: string;
  status: string;
};

export function OrderNotificationSound() {
  const { token, role } = useAuth();
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only for admins
    if (role !== "ADMIN" || !token) return;

    // Create audio element for notification sound
    if (!audioRef.current) {
      audioRef.current = new Audio("/notification-sound.mp3");
      audioRef.current.volume = 0.7;
    }

    // Function to check for new orders
    const checkNewOrders = async () => {
      try {
        const response = await apiAuthed<{ items: Order[] }>(
          "/admin/orders?page=1&pageSize=1"
        );

        if (response.items && response.items.length > 0) {
          const latestOrder = response.items[0];

          // If this is a new order (different from last known)
          if (lastOrderId && latestOrder.id !== lastOrderId) {
            // Play notification sound
            audioRef.current?.play().catch((err) => {
              console.log("Failed to play notification:", err);
            });

            // Show browser notification if permitted
            if (Notification.permission === "granted") {
              new Notification("Nouvelle commande !", {
                body: `Commande #${latestOrder.id.slice(0, 8)} reçue`,
                icon: "/favicon.ico",
                tag: latestOrder.id,
              });
            }
          }

          setLastOrderId(latestOrder.id);
        }
      } catch (error) {
        console.error("Error checking orders:", error);
      }
    };

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Check immediately on mount
    checkNewOrders();

    // Then check every 10 seconds
    checkIntervalRef.current = setInterval(checkNewOrders, 10000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [token, role, lastOrderId]);

  return null; // This component doesn't render anything
}
