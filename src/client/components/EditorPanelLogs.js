/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import CollapsibleObject from './shared/CollapsibleObject';
import colors from '../configs/colors';
import constants from '../configs/constants';

type Device = {| name: string, id: string, platform: string |};

type DeviceLog = {|
  device: Device,
  method: 'log' | 'error' | 'warn',
  payload: Array<any>,
|};

type Props = {|
  deviceLogs: Array<DeviceLog>,
|};

export default function EditorPanelLogs({ deviceLogs }: Props) {
  const logs = deviceLogs.reduce((acc, log) => {
    const last = acc[acc.length - 1];
    const items = log.payload.map(text => {
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    });

    // If the last log and current are the same, increment the count
    if (
      last &&
      last.items.length === 1 &&
      last.items[0] === items[0] &&
      last.device === log.device.name &&
      last.method === log.method
    ) {
      last.times++;
    } else {
      acc.push({
        items,
        device: log.device.name,
        method: log.method,
        times: 1,
      });
    }

    return acc;
  }, []);

  return (
    <div>
      {logs.map(({ items, device, method, times }, i) => {
        return (
          <div className={css(styles.container)} key={i}>
            <div className={css(styles.device)}>{device}:</div>
            <div className={css(styles.line)} key={i}>
              {items.map(
                (item, i) =>
                  typeof item === 'object' && item !== null ? (
                    <CollapsibleObject key={i} object={item} />
                  ) : (
                    <div
                      key={i}
                      className={css(
                        styles.item,
                        method === 'error' && styles.error,
                        method === 'warn' && styles.warning
                      )}>
                      {String(item)}
                    </div>
                  )
              )}
              {times > 1 ? <div className={css(styles.counter)}>{times}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    fontFamily: 'var(--font-monospace)',
    fontSize: 13,
    minHeight: 16,
    margin: '4px 0',
  },
  line: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    marginRight: 8,
  },
  error: {
    color: colors.error,
  },
  warning: {
    color: colors.warning,
  },
  device: {
    opacity: 0.5,
    marginRight: 8,
  },
  counter: {
    position: 'relative',
    bottom: -1,
    height: 16,
    width: 16,
    lineHeight: '16px',
    fontSize: 12,
    textAlign: 'center',
    borderRadius: '50%',
    backgroundColor: colors.primary,
    color: 'white',
    opacity: 0.5,
  },
});
