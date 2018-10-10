/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import ProgressIndicator from '../shared/ProgressIndicator';
import Button from '../shared/Button';
import LayoutShell from './LayoutShell';
import ContentShell from './ContentShell';
import ToolbarShell from './ToolbarShell';
import ToolbarTitleShell from './ToolbarTitleShell';
import FooterShell from './FooterShell';
import SidebarShell from './SidebarShell';
import EditorShell from './EditorShell';

export default function AppShell() {
  return (
    <ContentShell>
      <ProgressIndicator delay={1000} />
      <ToolbarShell>
        <ToolbarTitleShell />
        <Button variant="accent" onClick={() => {}} className={css(styles.saveButton)}>
          {'\u00A0'}
        </Button>
        <div className={css(styles.avatar)} />
      </ToolbarShell>
      <LayoutShell>
        <SidebarShell />
        <EditorShell />
      </LayoutShell>
      <FooterShell />
    </ContentShell>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    width: 120,
    pointerEvents: 'none',
  },
  avatar: {
    backgroundColor: 'currentColor',
    opacity: 0.2,
    height: 40,
    width: 40,
    borderRadius: 20,
    margin: '0 16px 0 12px',
  },
});
