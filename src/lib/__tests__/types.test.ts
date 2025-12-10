import { describe, it, expect } from 'bun:test';
import { isError, getErrorMessage, type ApiResponse, type ProcessingStatus } from '../types';

describe('types', () => {
  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
      expect(isError(new TypeError('test'))).toBe(true);
    });

    it('should return false for non-Error values', () => {
      expect(isError('string')).toBe(false);
      expect(isError(123)).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
      expect(isError({})).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message for Error instances', () => {
      expect(getErrorMessage(new Error('test error'))).toBe('test error');
      expect(getErrorMessage(new TypeError('type error'))).toBe('type error');
    });

    it('should convert non-Error values to strings', () => {
      expect(getErrorMessage('string error')).toBe('string error');
      expect(getErrorMessage(123)).toBe('123');
      expect(getErrorMessage(null)).toBe('null');
      expect(getErrorMessage(undefined)).toBe('undefined');
    });
  });

  describe('ApiResponse', () => {
    it('should have correct structure', () => {
      const success: ApiResponse<string> = {
        success: true,
        data: 'test'
      };
      expect(success.success).toBe(true);
      expect(success.data).toBe('test');

      const error: ApiResponse = {
        success: false,
        error: 'test error'
      };
      expect(error.success).toBe(false);
      expect(error.error).toBe('test error');
    });
  });

  describe('ProcessingStatus', () => {
    it('should support status type', () => {
      const status: ProcessingStatus = {
        type: 'status',
        message: 'Processing...',
        progress: 50
      };
      expect(status.type).toBe('status');
      expect(status.progress).toBe(50);
    });

    it('should support complete type', () => {
      const complete: ProcessingStatus = {
        type: 'complete',
        message: 'Done',
        themes_count: 5,
        responses_count: 20
      };
      expect(complete.type).toBe('complete');
      expect(complete.themes_count).toBe(5);
    });

    it('should support error type', () => {
      const error: ProcessingStatus = {
        type: 'error',
        message: 'Failed'
      };
      expect(error.type).toBe('error');
    });
  });
});

