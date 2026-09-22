// Provides the browser globals the sources rely on

import { JSDOM } from "jsdom";

const { window } = new JSDOM("");

globalThis.window = window;
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;
globalThis.Image = window.Image;
