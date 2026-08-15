import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0c0e",
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "38px solid transparent",
            borderBottom: "38px solid transparent",
            borderLeft: "60px solid #dc1030",
            marginLeft: 16,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
