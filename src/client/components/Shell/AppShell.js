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

type Props = {
  title?: ?string,
};

export default function AppShell(props: Props) {
  return (
    <ContentShell>
      <ProgressIndicator delay={1000} />
      <ToolbarShell>
        <ToolbarTitleShell>
          <div className={css(styles.logo)} />
          <div className={css(styles.header)}>
            <h1 className={css(styles.title)}>{props.title || 'snack'}</h1>
            <div className={css(styles.status)}>…</div>
          </div>
        </ToolbarTitleShell>
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
  logo: {
    backgroundColor: 'currentColor',
    opacity: 0.2,
    width: 36,
    height: 36,
    borderRadius: 3,
    margin: '0 .5em 0 .75em',
  },
  header: {
    minWidth: 0,
  },
  title: {
    fontSize: '1.3em',
    lineHeight: '1.3em',
    fontWeight: 500,
    margin: 0,
    padding: '1px 6px',
  },
  status: {
    fontSize: 12,
    margin: '0 6px',
    opacity: 0.5,
  },
  saveButton: {
    width: 100,
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
