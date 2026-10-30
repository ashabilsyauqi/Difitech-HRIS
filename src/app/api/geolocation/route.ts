export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    let clientIp = forwarded?.split(",")[0]?.trim() || realIp || "";

    // Bersihkan IP jika IPv4-mapped IPv6 (::ffff:123.45.67.89)
    if (clientIp.startsWith("::ffff:")) {
      clientIp = clientIp.replace("::ffff:", "");
    }

    const isLocal =
      !clientIp ||
      clientIp === "::1" ||
      clientIp === "127.0.0.1" ||
      clientIp.startsWith("192.168.") ||
      clientIp.startsWith("10.") ||
      clientIp.startsWith("172.16.");

    // Coba ambil lokasi kantor default sebagai acuan fallback aman
    let fallbackLat = -6.221538;
    let fallbackLng = 107.013962;
    let fallbackAddress = "Bekasi / Jakarta, Indonesia";

    try {
      const office = await prisma.officeLocation.findFirst({
        where: { isActive: true },
      });
      if (office) {
        fallbackLat = office.latitude;
        fallbackLng = office.longitude;
        fallbackAddress = office.address || "Difitech Office";
      }
    } catch (_) {
      // ignore db error
    }

    if (!isLocal) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`https://ipwho.is/${clientIp}`, {
          signal: controller.signal,
          headers: { "User-Agent": "Difitech-HRIS/1.0" },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.success !== false && typeof data.latitude === "number" && typeof data.longitude === "number") {
            const city = data.city || "Jakarta";
            const region = data.region || "";
            const country = data.country || "Indonesia";
            const fullAddress = `${city}, ${region ? region + ", " : ""}${country}`;

            return NextResponse.json({
              success: true,
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: 1200, // Akurasi radius estimasi IP (~1.2 km)
              city,
              region,
              country,
              address: `${fullAddress} (Lokasi Jaringan / IP)`,
              source: "IP_NETWORK",
              ip: clientIp,
            });
          }
        }
      } catch (e) {
        console.warn("IP Geolocation lookup failed, using fallback:", e);
      }
    }

    // Default fallback
    return NextResponse.json({
      success: true,
      latitude: fallbackLat,
      longitude: fallbackLng,
      accuracy: 1500,
      city: "Bekasi / Jakarta",
      region: "Jawa Barat",
      country: "Indonesia",
      address: `${fallbackAddress} (Estimasi Lokasi Default)`,
      source: "DEFAULT_FALLBACK",
      ip: clientIp || "127.0.0.1",
    });
  } catch (err: any) {
    console.error("Geolocation API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mendeteksi lokasi jaringan",
        latitude: -6.221538,
        longitude: 107.013962,
        accuracy: 1500,
        address: "Bekasi / Jakarta, Indonesia",
        source: "SAFETY_FALLBACK",
      },
      { status: 200 }
    );
  }
}
