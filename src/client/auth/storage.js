/**
 * @flow
 */

import cookies from 'js-cookie';

interface StorageBackend {
  getItem(key: string): ?string;
  removeItem(key: string): void;
  setItem(key: string, value: string, options?: Object): void;
}

export default class StorageHandler implements StorageBackend {
  _storageBackend: ?StorageBackend = null;
  _namespace: string;

  constructor(namespace?: string, storageBackend?: string) {
    this._namespace = namespace || '';
    switch (storageBackend) {
      case 'localstorage':
        this._storageBackend = window.localstorage;
        break;
      case 'cookie':
        this._storageBackend = new CookieStorage();
        break;
      case 'dummy':
        this._storageBackend = new DummyStorage();
        break;
    }
  }

  getItem(key: string) {
    try {
      return this.storageBackend.getItem(this._getKey(key));
    } catch (e) {
      this._failover();
      return this.storageBackend.getItem(this._getKey(key));
    }
  }

  removeItem(key: string) {
    try {
      this.storageBackend.removeItem(this._getKey(key));
    } catch (e) {
      this._failover();
      this.storageBackend.removeItem(this._getKey(key));
    }
  }

  setItem(key: string, value: string, options?: Object) {
    try {
      this.storageBackend.setItem(this._getKey(key), value, options);
    } catch (e) {
      this._failover();
      this.storageBackend.setItem(this._getKey(key), value, options);
    }
  }

  _getKey(key: string): string {
    return `${this._namespace}.${key}`;
  }

  _failover() {
    if (this.storageBackend instanceof DummyStorage) {
      console.warn('DummyStorage: ignore failover');
      
    } else if (this.storageBackend instanceof CookieStorage) {
      console.warn('CookieStorage: failing over DummyStorage');
      this.storageBackend = new DummyStorage();
    } else {
      console.warn('LocalStorage: failing over CookieStorage');
      this.storageBackend = new CookieStorage();
    }
  }

  get storageBackend(): StorageBackend {
    if (this._storageBackend) {
      return this._storageBackend;
    }

    let storageBackend;

    /* $FlowIgnore */
    if (process.browser) {
      storageBackend = window.localStorage || new CookieStorage();
    } else {
      storageBackend = new DummyStorage();
    }

    this._storageBackend = storageBackend;
    return this._storageBackend;
  }

  set storageBackend(storageBackend: StorageBackend): void {
    this._storageBackend = storageBackend;
  }
}

class CookieStorage implements StorageBackend {
  getItem(key: string): ?string {
    return cookies.get(key);
  }

  removeItem(key: string): void {
    cookies.remove(key);
  }

  setItem(key: string, value: string, options?: Object) {
    cookies.set(key, value, options || {});
  }
}

class DummyStorage implements StorageBackend {
  _storage: {
    [key: string]: string,
  } = {};

  getItem(key: string): ?string {
    return this._storage[key];
  }

  removeItem(key: string): void {
    delete this._storage[key];
  }

  setItem(key: string, value: string, options?: Object) {
    this._storage[key] = value;
  }
}
