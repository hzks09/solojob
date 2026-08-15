import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d3557",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              borderRadius: 26,
              background: "#ffffff",
            }}
          >
            <span style={{ fontSize: 56, fontWeight: 900, color: "#1d3557", lineHeight: 1 }}>SJ</span>
            <span style={{ width: 60, height: 8, background: "#e85d25", borderRadius: 4, marginTop: 10 }} />
          </div>
          <span style={{ fontSize: 88, fontWeight: 900, color: "#ffffff" }}>NextWatch</span>
        </div>
        <span style={{ marginTop: 36, fontSize: 34, color: "#ffffffbf" }}>
          Trouve une vidéo YouTube qui va te plaire
        </span>
      </div>
    ),
    { ...size }
  );
}
