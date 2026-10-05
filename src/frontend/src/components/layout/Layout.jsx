import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout = ({
  children,
  activeRoute,
  onNavigate,
  stateMode,
  onChangeStateMode
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        mobileOpen={mobileNavOpen}
        onCloseMobileNav={() => setMobileNavOpen(false)}
      />

      <div className="app-main">
        <Navbar
          activeRoute={activeRoute}
          onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
          stateMode={stateMode}
          onChangeStateMode={onChangeStateMode}
        />
        {children}
      </div>
    </div>
  );
};
