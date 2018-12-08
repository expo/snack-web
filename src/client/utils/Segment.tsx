declare const analytics: any;

export default class Segment {
  timers: {
    sessionStart: number;
    [key: string]: number;
  };
  commonData: object;

  constructor() {
    this.timers = {
      sessionStart: Date.now(),
    };
    this.commonData = {};
  }

  static getInstance() {
    if (instance) {
      return instance;
    } else {
      instance = new Segment();
      return instance;
    }
  }

  startTimer = (name: string) => {
    this.timers[name] = Date.now();
  };

  clearTimer = (name: string) => {
    delete this.timers[name];
  };

  setCommonData = (data: object) => {
    this.commonData = data;
  };

  logEvent(name: string, data?: object, ...timerKeys: string[]) {
    const eventTenures: { [key: string]: number } = {};
    for (const key of timerKeys) {
      if (this.timers.hasOwnProperty(key)) {
        eventTenures[`${key}Tenure`] = this._eventTenure(key);
      }
    }
    eventTenures.sessionTenure = this._eventTenure('sessionStart');
    analytics.track(name, {
      ...eventTenures,
      ...this.commonData,
      ...data,
    });
  }

  identify = (viewer: object) => {
    if (viewer) {
      analytics.identify(viewer);
    }
  };

  _eventTenure = (timerKey: string) => {
    return (Date.now() - this.timers[timerKey]) / 1000;
  };
}

let instance: Segment | undefined;
