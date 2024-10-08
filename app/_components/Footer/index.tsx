"use client";

interface FooterProps {
  isTurtle: boolean;
}

export default function Footer({ isTurtle }: FooterProps) {
  const NEXT_PUBLIC_GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || '';

  return (
    <div className="footer-links">
      <a href={NEXT_PUBLIC_GITHUB_URL} target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
      <span>
        ・
      </span>
      {
        isTurtle ? (
          <a href={window.location.pathname}>
            🏚️
          </a>
        ) : (
          <a href={`${window.location.pathname}?turtle`}>
            🐢
          </a>
        )
      }
    </div>
  )
}