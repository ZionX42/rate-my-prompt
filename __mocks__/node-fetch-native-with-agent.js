// Jest CJS stub for ESM-only module used by node-appwrite
module.exports = {
  // Provide minimal globals; our jest.setup wires undici fetch anyway
  default: global.fetch,
  fetch: global.fetch,
  Headers: global.Headers,
  Request: global.Request,
  Response: global.Response,
  AbortController: global.AbortController || function () {},
  Blob: global.Blob,
  File: global.File,
  FormData: global.FormData,
};
