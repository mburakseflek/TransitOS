"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ProjectSelectionContextValue = {
  activeProjectId: string | null;
  setActiveProjectId: (projectId: string) => void;
};

const ProjectSelectionContext = createContext<ProjectSelectionContextValue | null>(null);

export function ProjectSelectionProvider({
  initialProjectId,
  children
}: {
  initialProjectId: string | null;
  children: ReactNode;
}) {
  const [activeProjectId, setActiveProjectId] = useState(initialProjectId);
  const value = useMemo(() => ({ activeProjectId, setActiveProjectId }), [activeProjectId]);

  return <ProjectSelectionContext.Provider value={value}>{children}</ProjectSelectionContext.Provider>;
}

export function ProjectJumpLink({
  projectId,
  className,
  children
}: {
  projectId: string;
  className?: string;
  children: ReactNode;
}) {
  const selection = useContext(ProjectSelectionContext);
  const isActive = selection?.activeProjectId === projectId;

  return (
    <button
      type="button"
      className={`${className ?? ""} ${isActive ? "selected" : ""}`.trim()}
      aria-pressed={isActive}
      onClick={() => {
        selection?.setActiveProjectId(projectId);
        window.requestAnimationFrame(() => {
          document.getElementById(`project-detail-${projectId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }}
    >
      {children}
    </button>
  );
}

export function ProjectPanel({
  projectId,
  children
}: {
  projectId: string;
  children: ReactNode;
}) {
  const selection = useContext(ProjectSelectionContext);
  const isActive = selection?.activeProjectId === projectId;

  return (
    <div className="project-panel-slot" data-active={isActive ? "true" : "false"} hidden={!isActive}>
      {children}
    </div>
  );
}
