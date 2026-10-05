import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout = ({
  children,
  activeRoute,
  onNavigate,
  stateMode,
  onChangeStateMode,
  user,
  onLogout,
  onOpenAuth,
  onOpenProfile,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        mobileOpen={mobileNavOpen}
        onCloseMobileNav={() => setMobileNavOpen(false)}
        user={user}
        onLogout={onLogout}
        onOpenAuth={onOpenAuth}
        onOpenProfile={onOpenProfile}
      />

      <div className="app-main">
        <Navbar
          activeRoute={activeRoute}
          onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
          stateMode={stateMode}
          onChangeStateMode={onChangeStateMode}
          user={user}
          onLogout={onLogout}
          onOpenAuth={onOpenAuth}
          onOpenProfile={onOpenProfile}
        />
        {children}
      </div>
    </div>
  );
};
