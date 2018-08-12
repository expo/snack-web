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

export default function AppShell() {
  return (
    <ContentShell>
      <ProgressIndicator delay={1000} />
      <ToolbarShell>
        <ToolbarTitleShell />
        <Button variant="accent" onClick={() => {}} className={css(styles.saveButton)}>
          {'\u00A0'}
        </Button>
      </ToolbarShell>
      <LayoutShell>
        <SidebarShell />
      </LayoutShell>
      <FooterShell />
    </ContentShell>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    width: 128,
  },
});
