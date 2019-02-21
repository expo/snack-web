import { FileSystemEntry } from '../../types';
import { SDKVersion } from '../../configs/sdk';
import { Annotation } from '../../utils/convertErrorToAnnotation';

export type EditorMode = 'normal' | 'vim';

export type EditorProps = {
  entries: FileSystemEntry[];
  dependencies: {
    [name: string]: {
      version: string;
    };
  };
  sdkVersion: SDKVersion;
  path: string;
  value: string;
  mode: EditorMode;
  onOpenPath: (path: string) => void;
  onValueChange: (value: string) => void;
  annotations: Annotation[];
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  scrollBeyondLastLine?: boolean;
  minimap?: {
    enabled?: boolean;
    maxColumn?: number;
    renderCharacters?: boolean;
    showSlider?: 'always' | 'mouseover';
    side?: 'right' | 'left';
  };
  autoFocus?: boolean;
  fontFamily?: string;
  fontLigatures?: boolean;
};
