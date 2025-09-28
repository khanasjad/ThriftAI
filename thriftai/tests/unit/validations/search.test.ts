import { validateSearchParams, ClaudeSearchSchema } from '@/lib/validations/search'
import { ZodError } from 'zod'

describe('Search Validation', () => {
  describe('validateSearchParams', () => {
    it('should validate basic search parameters', () => {
      const searchParams = new URLSearchParams({
        q: 'car',
        category: 'vehicles',
        minPrice: '1000',
        maxPrice: '5000',
        page: '1',
        limit: '10'
      })

      const result = validateSearchParams(searchParams)

      expect(result).toEqual({
        q: 'car',
        category: 'vehicles',
        minPrice: '1000',
        maxPrice: '5000',
        page: 1,
        limit: 10
      })
    })

    it('should apply default values when parameters are missing', () => {
      const searchParams = new URLSearchParams({})

      const result = validateSearchParams(searchParams)

      expect(result).toEqual({
        q: '',
        category: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        page: 1,
        limit: 20
      })
    })

    it('should trim whitespace from query', () => {
      const searchParams = new URLSearchParams({
        q: '  car  '
      })

      const result = validateSearchParams(searchParams)

      expect(result.q).toBe('car')
    })

    it('should reject queries that are too long', () => {
      const longQuery = 'a'.repeat(201)
      const searchParams = new URLSearchParams({
        q: longQuery
      })

      expect(() => validateSearchParams(searchParams)).toThrow(ZodError)
    })

    it('should reject queries with invalid characters', () => {
      const invalidQueries = [
        '<script>alert("xss")</script>',
        'SELECT * FROM users',
        'car && rm -rf /',
        'search"onmouseover="alert(1)"',
        'car javascript:alert(1)'
      ]

      invalidQueries.forEach(query => {
        const searchParams = new URLSearchParams({ q: query })
        expect(() => validateSearchParams(searchParams)).toThrow(ZodError)
      })
    })

    it('should accept valid queries with allowed characters', () => {
      const validQueries = [
        'red car',
        'BMW-X5',
        "collector's item",
        'iPhone 14 Pro',
        'MacBook_Pro',
        'vintage watch',
        'car & motorcycle',
        'price under $500'
      ]

      validQueries.forEach(query => {
        const searchParams = new URLSearchParams({ q: query })
        expect(() => validateSearchParams(searchParams)).not.toThrow()
      })
    })

    it('should validate price range constraints', () => {
      // Min price greater than max price
      const searchParams = new URLSearchParams({
        minPrice: '5000',
        maxPrice: '1000'
      })

      expect(() => validateSearchParams(searchParams)).toThrow(ZodError)
    })

    it('should reject negative prices', () => {
      const searchParams = new URLSearchParams({
        minPrice: '-100'
      })

      expect(() => validateSearchParams(searchParams)).toThrow(ZodError)
    })

    it('should reject prices that are too high', () => {
      const searchParams = new URLSearchParams({
        maxPrice: '1000001'
      })

      expect(() => validateSearchParams(searchParams)).toThrow(ZodError)
    })

    it('should validate page number constraints', () => {
      // Page too low
      expect(() => {
        const searchParams = new URLSearchParams({ page: '0' })
        validateSearchParams(searchParams)
      }).toThrow(ZodError)

      // Page too high
      expect(() => {
        const searchParams = new URLSearchParams({ page: '10001' })
        validateSearchParams(searchParams)
      }).toThrow(ZodError)
    })

    it('should validate limit constraints', () => {
      // Limit too low
      expect(() => {
        const searchParams = new URLSearchParams({ limit: '0' })
        validateSearchParams(searchParams)
      }).toThrow(ZodError)

      // Limit too high
      expect(() => {
        const searchParams = new URLSearchParams({ limit: '101' })
        validateSearchParams(searchParams)
      }).toThrow(ZodError)
    })

    it('should handle invalid number formats', () => {
      const searchParams = new URLSearchParams({
        minPrice: 'abc',
        maxPrice: 'def',
        page: 'xyz',
        limit: 'invalid'
      })

      expect(() => validateSearchParams(searchParams)).toThrow(ZodError)
    })
  })

  describe('ClaudeSearchSchema', () => {
    it('should validate Claude search request body', () => {
      const validInput = {
        query: 'red sports car',
        maxPrice: 50000,
        category: 'vehicles'
      }

      const result = ClaudeSearchSchema.parse(validInput)

      expect(result).toEqual(validInput)
    })

    it('should handle optional fields', () => {
      const minimalInput = {
        query: 'laptop'
      }

      const result = ClaudeSearchSchema.parse(minimalInput)

      expect(result).toEqual({
        query: 'laptop',
        maxPrice: undefined,
        category: undefined
      })
    })

    it('should reject empty query', () => {
      const invalidInput = {
        query: ''
      }

      expect(() => ClaudeSearchSchema.parse(invalidInput)).toThrow(ZodError)
    })

    it('should reject query with invalid characters', () => {
      const invalidInput = {
        query: '<script>alert("xss")</script>'
      }

      expect(() => ClaudeSearchSchema.parse(invalidInput)).toThrow(ZodError)
    })

    it('should reject negative maxPrice', () => {
      const invalidInput = {
        query: 'laptop',
        maxPrice: -100
      }

      expect(() => ClaudeSearchSchema.parse(invalidInput)).toThrow(ZodError)
    })

    it('should reject maxPrice that is too high', () => {
      const invalidInput = {
        query: 'yacht',
        maxPrice: 1000001
      }

      expect(() => ClaudeSearchSchema.parse(invalidInput)).toThrow(ZodError)
    })

    it('should trim query whitespace', () => {
      const input = {
        query: '  laptop  '
      }

      const result = ClaudeSearchSchema.parse(input)

      expect(result.query).toBe('laptop')
    })

    it('should validate with all fields present', () => {
      const completeInput = {
        query: 'vintage watch',
        maxPrice: 2500,
        category: 'accessories'
      }

      const result = ClaudeSearchSchema.parse(completeInput)

      expect(result).toEqual(completeInput)
    })
  })

  describe('XSS Prevention', () => {
    it('should reject common XSS patterns', () => {
      const xssPatterns = [
        '<script>',
        '</script>',
        'javascript:',
        'onmouseover=',
        'onerror=',
        'eval(',
        'alert(',
        '<iframe',
        '<object',
        '<embed',
        'data:text/html',
        'vbscript:',
        'expression(',
        '&#x',
        '&#'
      ]

      xssPatterns.forEach(pattern => {
        const searchParams = new URLSearchParams({ q: `search ${pattern} term` })
        expect(() => validateSearchParams(searchParams)).toThrow(ZodError)
      })
    })

    it('should reject SQL injection patterns', () => {
      const sqlPatterns = [
        'SELECT * FROM',
        'DROP TABLE',
        'INSERT INTO',
        'UPDATE SET',
        'DELETE FROM',
        'UNION SELECT',
        '1=1',
        '1 OR 1',
        '; --',
        '/* */',
        'EXEC',
        'sp_'
      ]

      sqlPatterns.forEach(pattern => {
        const searchParams = new URLSearchParams({ q: pattern })
        expect(() => validateSearchParams(searchParams)).toThrow(ZodError)
      })
    })

    it('should reject command injection patterns', () => {
      const commandPatterns = [
        '&& rm',
        '|| rm',
        '; rm',
        '| rm',
        '`rm',
        '$(rm',
        '> /dev',
        '< /etc',
        'wget ',
        'curl ',
        'nc -',
        '/bin/',
        'chmod',
        'sudo'
      ]

      commandPatterns.forEach(pattern => {
        const searchParams = new URLSearchParams({ q: `search ${pattern}` })
        expect(() => validateSearchParams(searchParams)).toThrow(ZodError)
      })
    })
  })
})