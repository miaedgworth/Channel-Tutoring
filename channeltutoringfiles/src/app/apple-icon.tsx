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
          background: "#1B2A4A",
          color: "#C9A227",
          fontSize: 84,
          fontWeight: 700,
          fontFamily: "Georgia, serif",
        }}
      >
        CT
      </div>
    ),
    { ...size },
  );
}
