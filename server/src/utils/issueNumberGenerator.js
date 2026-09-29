import Issue from '../models/Issue.js';

/**
 * Generate unique human-readable issue number in format: CIVIC-YYYY-XXXXXX
 */
export const generateIssueNumber = async () => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `CIVIC-${currentYear}-`;

  try {
    // Count total issues created with current year prefix with a 2-second timeout
    const count = await Issue.countDocuments({
      issueNumber: new RegExp(`^${yearPrefix}`),
    }).maxTimeMS(2000);

    const sequentialNumber = String(count + 1).padStart(6, '0');
    const candidateNumber = `${yearPrefix}${sequentialNumber}`;

    // Ensure collision safety
    const exists = await Issue.findOne({ issueNumber: candidateNumber }).maxTimeMS(2000);
    if (exists) {
      const timestampSuffix = String(Date.now()).slice(-6);
      return `${yearPrefix}${timestampSuffix}`;
    }

    return candidateNumber;
  } catch {
    // Graceful fallback for mock tests or network hiccups
    const randomSuffix = String(Math.floor(100000 + Math.random() * 900000));
    return `${yearPrefix}${randomSuffix}`;
  }
};
