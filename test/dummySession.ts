import type { Session } from "@remix-run/node";

export class DummySession implements Session {
  id = "0";

  constructor(public data: Record<string, any>) {
    this.data = data;
  }

  get(key: string) {
    return this.data[key];
  }

  unset(key: string) {
    delete this.data[key];
  }

  set(name: string, value: any) {
    this.data[name] = value;
  }

  has(name: string) {
    return name in this.data;
  }

  flash(name: string, value: any) {
    this.data[name] = value;
  }
}
