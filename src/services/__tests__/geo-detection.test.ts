import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGeoFromRequest } from '../geo-detection';
import { Request } from 'express';

// Mock fetch
global.fetch = vi.fn();

describe('Geo Detection Service', () => {
    let mockReq: Partial<Request>;

    beforeEach(() => {
        mockReq = {
            headers: {},
            socket: { remoteAddress: '127.0.0.1' } as any,
        };
        vi.resetAllMocks();
    });

    it('should prioritize Cloudflare header', async () => {
        mockReq.headers = { 'cf-ipcountry': 'JP' };
        const result = await getGeoFromRequest(mockReq as Request);
        expect(result.country).toBe('JP');
        expect(result.source).toBe('cloudflare');
    });

    it('should fallback to IPinfo if CF header is missing', async () => {
        mockReq.headers = { 'x-forwarded-for': '8.8.8.8' };
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ country: 'US', region: 'California' }),
        });

        const result = await getGeoFromRequest(mockReq as Request);
        expect(result.country).toBe('US');
        expect(result.source).toBe('ipinfo');
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('8.8.8.8'));
    });

    it('should fallback to default if IPinfo fails', async () => {
        mockReq.headers = { 'x-forwarded-for': '8.8.8.8' };
        (global.fetch as any).mockResolvedValue({
            ok: false,
            statusText: 'Error',
        });

        const result = await getGeoFromRequest(mockReq as Request);
        expect(result.country).toBe('FR');
        expect(result.source).toBe('fallback');
    });

    it('should skip local IPs', async () => {
        mockReq.headers = { 'x-forwarded-for': '127.0.0.1' };
        const result = await getGeoFromRequest(mockReq as Request);
        expect(result.country).toBe('FR');
        expect(result.source).toBe('fallback');
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
