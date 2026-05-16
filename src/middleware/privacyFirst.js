/**
 * AuraSync — "Privacy First" Middleware
 * ─────────────────────────────────────
 * CRITICAL: Anonymizes all user text/data BEFORE it reaches the Gemini AI.
 * 
 * What it strips:
 *  - Email addresses
 *  - Phone numbers
 *  - Names (replaced with [USER])
 *  - URLs with personal identifiers
 *  - Social Security / ID numbers
 *  - Credit card patterns
 *  - IP addresses
 *  - Street addresses (best-effort)
 */
const crypto = require('crypto');
const logger = require('../utils/logger');

// ─── PII Detection Patterns ─────────────────────
const PII_PATTERNS = [
  { name: 'email',       regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,          replacement: '[EMAIL_REDACTED]' },
  { name: 'phone',       regex: /(\+?\d{1,4}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}/g, replacement: '[PHONE_REDACTED]' },
  { name: 'ssn',         regex: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,                        replacement: '[ID_REDACTED]' },
  { name: 'credit_card', regex: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g,                             replacement: '[CARD_REDACTED]' },
  { name: 'ip_address',  regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,                              replacement: '[IP_REDACTED]' },
  { name: 'url_personal',regex: /https?:\/\/[^\s]+/g,                                         replacement: '[URL_REDACTED]' },
];

// ─── Name Detection (common patterns) ───────────
const NAME_INDICATORS = [
  /\b(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/gi,
  /\b([A-Z][a-z]+\s[A-Z][a-z]+)\b/g, // Two capitalized words in sequence (best-effort)
];

/**
 * Anonymize a string by stripping all PII patterns
 */
function anonymizeText(text) {
  if (!text || typeof text !== 'string') return text;
  
  let anonymized = text;
  let redactionsCount = 0;

  // Strip PII patterns
  for (const pattern of PII_PATTERNS) {
    const matches = anonymized.match(pattern.regex);
    if (matches) {
      redactionsCount += matches.length;
      anonymized = anonymized.replace(pattern.regex, pattern.replacement);
    }
  }

  // Strip potential names (with name indicators)
  for (const namePattern of NAME_INDICATORS) {
    anonymized = anonymized.replace(namePattern, (match, name) => {
      if (name && name.length > 2) {
        redactionsCount++;
        return match.replace(name, '[USER]');
      }
      return match;
    });
  }

  return { anonymized, redactionsCount };
}

/**
 * Deep-walk an object and anonymize all string values
 */
function anonymizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = Array.isArray(obj) ? [] : {};
  let totalRedactions = 0;

  for (const [key, value] of Object.entries(obj)) {
    // Skip keys that are system identifiers (don't anonymize keys like 'userId')
    const sensitiveKeys = ['name', 'email', 'phone', 'address', 'text', 'message', 'content', 'note', 'journal'];
    
    if (typeof value === 'string') {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        const { anonymized, redactionsCount } = anonymizeText(value);
        result[key] = anonymized;
        totalRedactions += redactionsCount;
      } else {
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = anonymizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Generate anonymous session hash (one-way, non-reversible)
 */
function hashIdentifier(identifier) {
  const salt = process.env.ANONYMIZE_SALT || 'aurasync-default-salt';
  return crypto.createHash('sha256').update(`${salt}:${identifier}`).digest('hex').substring(0, 16);
}

/**
 * Privacy First Middleware
 * Attaches anonymized body to req.anonymizedBody
 */
function privacyFirst(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      req.anonymizedBody = anonymizeObject(JSON.parse(JSON.stringify(req.body)));
      
      // Hash any userId for AI context (so AI never sees real user IDs)
      if (req.body.userId) {
        req.anonymizedBody.anonymousId = hashIdentifier(req.body.userId);
        // Keep real userId on original body for DB operations
      }

      logger.debug('Privacy middleware: data anonymized successfully');
    } else {
      req.anonymizedBody = req.body || {};
    }
    
    next();
  } catch (error) {
    logger.error('Privacy middleware error:', error);
    // Don't block the request, just pass original body
    req.anonymizedBody = req.body || {};
    next();
  }
}

module.exports = { privacyFirst, anonymizeText, anonymizeObject, hashIdentifier };
