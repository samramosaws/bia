import React, { useEffect, useState } from "react";

const getApiUrl = () => {
  const hostname = window.location.hostname;

  // Caso exista uma URL explicitamente configurada
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }

  // Desenvolvimento local
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8080";
  }

  // ALB, CloudFront ou domínio de produção:
  // frontend e backend respondem pelo mesmo endereço
  return window.location.origin;
};

const getEnvironment = () => {
  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "Local";
  }

  if (hostname.endsWith(".cloudfront.net")) {
    return "CloudFront";
  }

  if (hostname.endsWith(".elb.amazonaws.com")) {
    return "ALB";
  }

  return "Produção";
};

export default function VersionInfo() {
  const [version, setVersion] = useState("Bia");
  const [status, setStatus] = useState("Checking");
  const [isOpen, setIsOpen] = useState(false);

  const apiUrl = getApiUrl();
  const environment = getEnvironment();

  const checkApiHealth = async () => {
    setStatus("Checking");

    try {
      const controller = new AbortController();

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);

      const response = await fetch(`${apiUrl}/api/versao`, {
        method: "GET",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await response.json();

        setVersion(
          data.version ||
            data.versao ||
            data.name ||
            data.message ||
            "Bia"
        );
      } else {
        const text = await response.text();
        setVersion(text.trim() || "Bia");
      }

      setStatus("Online");
    } catch (error) {
      console.error("Erro ao verificar API:", error);

      setStatus("Offline");
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  const statusColor =
    status === "Online"
      ? "#22c55e"
      : status === "Checking"
      ? "#facc15"
      : "#ef4444";

  const statusIcon =
    status === "Online"
      ? "🟢"
      : status === "Checking"
      ? "🟡"
      : "🔴";

  const environmentIcon =
    environment === "CloudFront"
      ? "🌐"
      : environment === "ALB"
      ? "⚖️"
      : environment === "Local"
      ? "💻"
      : "🔒";

  return (
    <div
      className="version-info"
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        title={`${environment} | API: ${status}`}
        aria-label="Informações da versão"
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          border: "2px solid #2563eb",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: statusColor,
            display: "block",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="version-info-popup"
          style={{
            position: "absolute",
            top: "32px",
            right: 0,
            zIndex: 9999,
            width: "240px",
            padding: "14px",
            borderRadius: "8px",
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.35)",
            color: "#f9fafb",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "15px",
              marginBottom: "8px",
            }}
          >
            {version}
          </div>

          <div>
            {statusIcon} Status: {status}
          </div>

          <div>
            {environmentIcon} Ambiente: {environment}
          </div>

          <div
            style={{
              marginTop: "4px",
              wordBreak: "break-word",
            }}
          >
            Local: {window.location.host}
          </div>

          <div
            style={{
              marginTop: "4px",
              wordBreak: "break-word",
            }}
          >
            API:
            <br />
            {apiUrl}
          </div>

          <div style={{ marginTop: "6px" }}>
            🔗{" "}
            <a
              href={`${apiUrl}/api/versao`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#60a5fa" }}
            >
              /api/versao
            </a>
          </div>

          <button
            type="button"
            onClick={checkApiHealth}
            style={{
              marginTop: "6px",
              padding: 0,
              border: "none",
              background: "transparent",
              color: "#60a5fa",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            🔄 Atualizar
          </button>
        </div>
      )}
    </div>
  );
}