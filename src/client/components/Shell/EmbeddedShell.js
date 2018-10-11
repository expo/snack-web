/* @flow */

import * as React from 'react';
import ProgressIndicator from '../shared/ProgressIndicator';
import ContentShell from './ContentShell';
import EditorShell from './EditorShell';
import EmbeddedToolbarShell from './EmbeddedToolbarShell';
import EmbeddedFooterShell from './EmbeddedFooterShell';

export default function AppShell() {
  return (
    <ContentShell>
      <ProgressIndicator delay={1000} />
      <EmbeddedToolbarShell />
      <EditorShell />
      <EmbeddedFooterShell />
    </ContentShell>
  );
}
