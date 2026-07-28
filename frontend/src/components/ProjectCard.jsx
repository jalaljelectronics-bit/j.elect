import { useNavigate } from "react-router-dom";

const WHATSAPP_NUMBER = "923000000000";

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi! I'm interested in the project kit: ${project.title}`
  )}`;

  const goToProject = () => {
    navigate(`/project/${project.id}`);
  };

  const imgSrc =
    typeof project.imageUrl === "string" &&
    project.imageUrl.startsWith("http")
      ? project.imageUrl
      : null;

  const badgeLabel = project.isNewArrival
    ? "🆕 New"
    : project.isFeatured
    ? "⭐ Featured"
    : null;

  return (
    <div
      className="product-card"
      onClick={goToProject}
      style={{
        position: "relative",
        cursor: "pointer",
      }}
    >
      {badgeLabel && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "var(--cyan)",
            color: "#000",
            fontSize: "0.7rem",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "6px",
            zIndex: 2,
          }}
        >
          {badgeLabel}
        </div>
      )}

      <div
        style={{
          width: "100%",
          aspectRatio: "1",
          background: "var(--bg3)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={project.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span style={{ fontSize: "3.5rem" }}>🛠️</span>
        )}
      </div>

      <div style={{ padding: "12px 4px 4px" }}>
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            marginBottom: "4px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.4em",
            lineHeight: 1.2,
          }}
        >
          {project.title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              color: "var(--cyan)",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            {project.price ? `Rs ${project.price}` : "Project"}
          </span>

          <span
            style={{
              color: "var(--gray-mid)",
              fontSize: "0.75rem",
            }}
          >
            {project.category || ""}
          </span>
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="btn-ghost"
          style={{
            display: "flex",
            padding: "9px",
            fontSize: "0.8rem",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            textDecoration: "none",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            width="15"
            height="15"
          >
            <path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 4a8.94 8.94 0 0 0-7.74 13.4L3 21l3.7-1.27a8.93 8.93 0 0 0 4.34 1.1h.01a8.94 8.94 0 0 0 8.93-8.93 8.87 8.87 0 0 0-2.38-5.58zM12.05 19.4h-.01a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.8.95.94-2.73-.18-.28A7.42 7.42 0 1 1 19.5 12a7.45 7.45 0 0 1-7.45 7.4z" />
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}