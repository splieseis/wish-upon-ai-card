
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Text,
} from "npm:@react-email/components@0.0.22";
import * as React from "react";

// Utility function to sanitize input to plain text (escape HTML entities)
function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface EcardEmailProps {
  imageUrl: string;
  message: string;
}

export const EcardEmail = ({ imageUrl, message }: EcardEmailProps) => (
  <Html>
    <Head />
    <Preview>Your special eCard is here!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={imageUrl}
          alt="eCard image"
          width={400}
          height={260}
          style={image}
        />
        <Text style={text}>{escapeHtml(message)}</Text>
        <Text style={footer}>
          Sent with love via the AI eCard Generator ❤️
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#faf8ff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "24px",
  backgroundColor: "#fff",
  borderRadius: "10px",
  maxWidth: "450px",
  boxShadow: "0 0 16px rgba(120,38,198,0.10)",
  border: "1px solid #ececec",
};

const image = {
  width: "100%",
  maxWidth: "400px",
  height: "auto",
  display: "block",
  marginBottom: "16px",
  borderRadius: "8px",
};

const text = {
  color: "#33224e",
  fontSize: "17px",
  marginBottom: "18px",
  whiteSpace: "pre-line" as "pre-line",
};

const footer = {
  color: "#a69abc",
  fontSize: "14px",
  marginTop: "40px",
};

// Utility to render the template to an HTML string (callable from elsewhere)
import { renderAsync } from "npm:@react-email/components@0.0.22";
export async function renderEcardEmailHtml(imageUrl: string, message: string) {
  // Always sanitize message
  return await renderAsync(
    <EcardEmail imageUrl={imageUrl} message={message} />
  );
}
