import type { NextConfig } from "next";
import dns from "dns";

// Prefer IPv4 DNS resolution over IPv6 to prevent ConnectTimeoutError on broken IPv6 networks
dns.setDefaultResultOrder("ipv4first");

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
