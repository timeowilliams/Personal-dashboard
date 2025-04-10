'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Script from 'next/script';

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
}

const PlaidConnect = ({ onSuccess, buttonText = "Connect Bank Account" }: PlaidConnectProps) => {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const handlePlaidConnect = async () => {
    try {
      setLoading(true);
      console.log("Requesting Plaid link token...");
      
      const createResponse = await fetch("/api/plaid/create-link-token", {
        method: "POST",
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
          console.log("Plaid success - Public token:", public_token, "Metadata:", metadata);
          // Pass the public token to parent component instead of access token
          onSuccess(public_token, metadata);
          toast({
            title: "Account connected!",
            description: `Successfully connected to ${metadata.institution?.name}`,
          });
          setLoading(false);
        },
        onExit: (err?: any) => {
          console.log("Plaid exit:", err || "No error");
          setLoading(false);
          
          if (err) {
            toast({
              title: "Connection cancelled",
              description: "The bank connection process was cancelled",
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
        description: "Unable to initialize Plaid connection",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

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
        className="w-full"
      >
        {loading ? "Connecting..." : buttonText}
      </Button>
    </>
  );
};

export default PlaidConnect;