import '@testing-library/jest-dom';

// Polyfill Fetch API for tests (Request/Response/fetch) if missing
try {
	// Ensure TextEncoder/TextDecoder exist for libraries that expect them (e.g., undici)
	const { TextEncoder, TextDecoder } = require('node:util');
	if (typeof global.TextEncoder === 'undefined') {
		global.TextEncoder = TextEncoder;
	}
	if (typeof global.TextDecoder === 'undefined') {
		global.TextDecoder = TextDecoder;
	}

	// Ensure Web Streams exist (ReadableStream, etc.)
	try {
		const streams = require('node:stream/web');
		if (typeof global.ReadableStream === 'undefined') {
			global.ReadableStream = streams.ReadableStream;
		}
		if (typeof global.WritableStream === 'undefined') {
			global.WritableStream = streams.WritableStream;
		}
		if (typeof global.TransformStream === 'undefined') {
			global.TransformStream = streams.TransformStream;
		}
	} catch (e) {
		// ignore missing stream/web (older Node)
	}

	const g = global;
	if (typeof g.Request === 'undefined' || typeof g.fetch === 'undefined') {
		const { fetch, Headers, Request, Response } = require('undici');
		g.fetch = fetch;
		g.Headers = Headers;
		g.Request = Request;
		g.Response = Response;
	}
} catch (e) {
	// ignore
}
