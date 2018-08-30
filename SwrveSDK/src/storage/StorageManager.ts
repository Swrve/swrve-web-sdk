import { swrveDefaultDBName, swrveDefaultDBVersion } from '../config/AppConfigParams';

class StorageManager {
  public dbName: string = swrveDefaultDBName;
  public dbVersion: number = swrveDefaultDBVersion;

  private static initailized: boolean = false;
  private local: Storage;

  public static clear() {
    localStorage.clear();
  }

  public constructor() {
    this.local = localStorage;
  }

  public writeLocal(key: string, data: any) {
    const encoded = this.serialize(data);
    this.local.setItem(key, encoded);
  }

  public readLocal(key: string): any {
    const item = this.local.getItem(key);
    return item === null ? null : this.deserialize(item);
  }

  public deleteLocal(key: string) {
    return this.local.removeItem(key);
  }

  public localKeys() {
    const keys = [];
    for (let i = 0; i < this.local.length; i += 1) {
      keys.push(this.local.key(i));
    }
    return keys;
  }

  private serialize(data: object|string): string {
    let result = null;
    if (typeof(data) === 'string') {
      result = data;
    } else {
      result = JSON.stringify(data);
    }
    return result;
  }

  private deserialize(data: string): string  {
    let result = null;
    try {
      result = JSON.parse(data);
    } catch {
      result = data;
    }
    return result;
  }
}

export default StorageManager;
