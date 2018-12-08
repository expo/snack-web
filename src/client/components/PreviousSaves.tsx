import * as React from 'react';
import format from 'date-fns/format';
import { StyleSheet, css } from 'aphrodite';
import withThemeName, { ThemeName } from './Preferences/withThemeName';
import { SaveHistory } from '../types';

type Props = {
  saveHistory: SaveHistory;
  theme: ThemeName;
};

class PreviousSaves extends React.Component<Props> {
  render() {
    const { saveHistory, theme } = this.props;
    const previousSaves = saveHistory.filter(data => !data.isDraft);

    return (
      <div className={css(styles.container)}>
        {previousSaves.length ? (
          <React.Fragment>
            <p className={css(styles.hint)}>
              Click on a previous save to open it in a new tab. You can make changes and then save
              it to overwrite the current version, or change the name to save as a new Snack.
            </p>
            {previousSaves.map(data => (
              <a
                key={data.id}
                target="_blank"
                href={`/${data.id}`}
                className={css(styles.item, theme === 'dark' ? styles.dark : styles.light)}>
                <div>
                  <h4 className={css(styles.title)}>{format(data.savedAt, 'hh:mm a, dddd')}</h4>
                  <p className={css(styles.description)}>{format(data.savedAt, 'Do MMMM YYYY')}</p>
                </div>
                <img
                  className={css(styles.icon)}
                  src={
                    theme === 'dark'
                      ? require('../assets/open-link-icon-light.png')
                      : require('../assets/open-link-icon.png')
                  }
                  alt="Open in new tab"
                />
              </a>
            ))}
          </React.Fragment>
        ) : (
          <p className={css(styles.placeholder)}>There are no previous saves for this Snack.</p>
        )}
      </div>
    );
  }
}

export default withThemeName(PreviousSaves);

const styles = StyleSheet.create({
  container: {
    margin: -12,
    paddingTop: 8,
    textAlign: 'left',
  },

  hint: {
    margin: 12,
  },

  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    cursor: 'pointer',
    color: 'inherit',
    textDecoration: 'none',
    borderRadius: 3,

    '--icon-opacity': '0',

    ':hover': {
      '--icon-opacity': '1',
    },
  },

  light: {
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, .08)',
    },
  },

  dark: {
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, .08)',
    },
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 4,
  },

  description: {
    fontSize: 14,
    margin: 0,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },

  icon: {
    margin: 8,
    height: 16,
    width: 16,
    opacity: 'var(--icon-opacity)',
  } as any,

  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    margin: 24,
    fontSize: 16,
    opacity: 0.5,
  },
});
