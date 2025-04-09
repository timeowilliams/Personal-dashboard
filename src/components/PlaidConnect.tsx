'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  onSuccess: (token: string) => void;
  buttonText?: string; // Add buttonText prop
}

const PlaidConnect = ({ onSuccess, buttonText = "Connect Bank Account" }: PlaidConnectProps) => {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const handlePlaidConnect = async () => {
    try {
      setLoading(true);
      const createResponse = await fetch("/api/plaid/create-link-token", {
        method: "POST",
      });
      
      const data = await createResponse.json();
      
      if (!data.link_token) {
        throw new Error("Failed to get link token");
      }

      // Initialize Plaid Link
      const plaidHandler = window.Plaid.create({
        token: data.link_token,
        onSuccess: async (public_token: string, metadata: any) => {
          try {
            const exchangeResponse = await fetch("/api/plaid/exchange-token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ public_token }),
            });
            const { access_token } = await exchangeResponse.json();
            
            if (access_token) {
              onSuccess(access_token);
              toast({
                title: "Account connected!",
                description: `Successfully connected to ${metadata.institution?.name}`,
              });
            }
          } catch (error) {
            console.error("Token exchange error:", error);
            toast({
              title: "Connection failed",
              description: "Unable to complete account connection",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
        onExit: () => {
          setLoading(false);
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
        onLoad={() => setScriptLoaded(true)}
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