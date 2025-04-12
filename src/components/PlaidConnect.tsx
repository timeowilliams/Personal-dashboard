"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Script from "next/script";

declare global {
  interface Window {
    Plaid: {
      create: (config: any) => {
        open: () => void;
        exit: (options?: { force?: boolean }) => void;
      };
    };
  }
}

interface PlaidConnectProps {
  onSuccess: (publicToken: string, metadata: any) => void;
  buttonText?: string;
  buttonClassName?: string;
  mode?: "connect" | "update";
  institutionName?: string;
}

const PlaidConnect = ({
  onSuccess,
  buttonText = "Connect Bank Account",
  buttonClassName,
  mode = "connect",
  institutionName,
}: PlaidConnectProps) => {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const handlePlaidConnect = async () => {
    try {
      setLoading(true);
      console.log("Requesting Plaid link token...");

      const createResponse = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to get link token: ${createResponse.status}`);
      }

      const data = await createResponse.json();
      console.log("Making request with:", data);

      if (!data.link_token) {
        throw new Error("No link token received from API");
      }

      // Initialize Plaid Link
      const plaidHandler = window.Plaid.create({
        token: data.link_token,
        onSuccess: (public_token: string, metadata: any) => {
          console.log(
            "Plaid success - Public token:",
            public_token,
            "Metadata:",
            metadata
          );
          onSuccess(public_token, metadata);
          toast({
            title:
              mode === "connect"
                ? "Account connected!"
                : "Account reconnected!",
            description: `Successfully ${
              mode === "connect" ? "connected to" : "updated"
            } ${metadata.institution?.name}`,
          });
          setLoading(false);
        },
        onExit: (err?: any) => {
          console.log("Plaid exit:", err || "No error");
          setLoading(false);

          if (err) {
            toast({
              title: "Connection cancelled",
              description:
                mode === "connect"
                  ? "The bank connection process was cancelled"
                  : "The bank reconnection process was cancelled",
              variant: "destructive",
            });
          }
        },
        onLoad: () => {
          console.log("Plaid Link loaded");
        },
        onEvent: (eventName: string) => {
          console.log("Plaid event:", eventName);
        },
      });

      plaidHandler.open();
    } catch (error) {
      console.error("Plaid setup error:", error);
      toast({
        title: "Connection failed",
        description:
          mode === "connect"
            ? "Unable to initialize Plaid connection"
            : "Unable to initialize Plaid reconnection",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  console.log("Button state:", { loading, scriptLoaded });

  return (
    <>
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        onLoad={() => {
          console.log("Plaid script loaded");
          setScriptLoaded(true);
        }}
        onError={() => {
          console.error("Failed to load Plaid script");
          toast({
            title: "Connection unavailable",
            description: "Could not load bank connection service",
            variant: "destructive",
          });
        }}
      />

      <Button
        onClick={handlePlaidConnect}
        disabled={loading || !scriptLoaded}
        className={
          buttonClassName ||
          "px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        }
      >
        {loading ? "Connecting..." : buttonText}
      </Button>
    </>
  );
};

export default PlaidConnect;
