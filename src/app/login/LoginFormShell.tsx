"use client";

import { createContext, useContext, useState, type FormEvent, type ReactNode } from "react";

const LoginSubmittingContext = createContext(false);

export function LoginFormShell({
  children,
  className
}: {
  children: ReactNode;
  className: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }

    setIsSubmitting(true);
  }

  return (
    <LoginSubmittingContext.Provider value={isSubmitting}>
      <form
        className={className}
        action="/api/auth/login"
        method="post"
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
      >
        {children}
      </form>
    </LoginSubmittingContext.Provider>
  );
}

export function LoginSubmitButton({
  children,
  pendingLabel
}: {
  children: ReactNode;
  pendingLabel: string;
}) {
  const isSubmitting = useContext(LoginSubmittingContext);

  return (
    <button className="primary login-submit-button" type="submit" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <span className="login-submit-spinner" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
