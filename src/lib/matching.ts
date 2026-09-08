import { Applicant, Job, Country, JobCategory, PrismaClient } from '@prisma/client';

export interface MatchCriteria {
  factor: string;
  matched: boolean;
  score: number;
  maxScore: number;
  detail: string;
}

export interface MatchResult {
  score: number; // 0 - 100
  level: 'EXCELLENT' | 'GOOD' | 'POTENTIAL' | 'LOW';
  levelLabel: string;
  badgeVariant: 'success' | 'primary' | 'warning' | 'neutral';
  criteria: MatchCriteria[];
}

const EDUCATION_LEVEL_RANKS: Record<string, number> = {
  NONE: 0,
  PRIMARY: 1,
  SECONDARY: 2,
  SSC: 2,
  HIGHER_SECONDARY: 3,
  HSC: 3,
  DIPLOMA: 4,
  BACHELORS: 5,
  GRADUATE: 5,
  MASTERS: 6,
  POST_GRADUATE: 6,
  PHD: 7,
};

function normalizeTokens(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .toLowerCase()
    .split(/[,;\n\/\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function calculateAge(dob: Date | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calculates deterministic rule-based match score and criteria breakdown
 * between an Applicant and a Job. (0-100%)
 */
export function calculateMatch(
  applicant: Pick<
    Applicant,
    | 'preferredCountryId'
    | 'preferredJobCategoryId'
    | 'yearsOfExperience'
    | 'education'
    | 'skills'
    | 'languages'
    | 'dateOfBirth'
  >,
  job: Pick<
    Job,
    | 'countryId'
    | 'jobCategoryId'
    | 'experienceRequired'
    | 'educationRequired'
    | 'skillsRequired'
    | 'languageRequirements'
    | 'ageMin'
    | 'ageMax'
  >
): MatchResult {
  const criteria: MatchCriteria[] = [];

  // 1. Destination Country Match (25 pts)
  const countryMatched =
    Boolean(applicant.preferredCountryId) &&
    applicant.preferredCountryId === job.countryId;
  criteria.push({
    factor: 'Preferred Country',
    matched: countryMatched,
    score: countryMatched ? 25 : 0,
    maxScore: 25,
    detail: countryMatched
      ? 'Applicant preferred country matches vacancy destination'
      : 'Applicant preferred country differs from job destination',
  });

  // 2. Job Category Match (25 pts)
  const categoryMatched =
    Boolean(applicant.preferredJobCategoryId) &&
    applicant.preferredJobCategoryId === job.jobCategoryId;
  criteria.push({
    factor: 'Job Category',
    matched: categoryMatched,
    score: categoryMatched ? 25 : 0,
    maxScore: 25,
    detail: categoryMatched
      ? 'Applicant target trade matches job category'
      : 'Applicant target trade does not match job category',
  });

  // 3. Experience Match (15 pts)
  const reqExp = job.experienceRequired || 0;
  const candExp = applicant.yearsOfExperience || 0;
  let expScore = 0;
  let expMatched = false;
  let expDetail = '';

  if (reqExp === 0) {
    expScore = 15;
    expMatched = true;
    expDetail = 'No minimum experience required';
  } else if (candExp >= reqExp) {
    expScore = 15;
    expMatched = true;
    expDetail = `Candidate has ${candExp} yrs (requires ${reqExp} yrs)`;
  } else if (candExp > 0) {
    expScore = Math.round((candExp / reqExp) * 15);
    expMatched = false;
    expDetail = `Candidate has ${candExp} yrs (requires ${reqExp} yrs)`;
  } else {
    expScore = 0;
    expMatched = false;
    expDetail = `Candidate has 0 yrs experience (requires ${reqExp} yrs)`;
  }
  criteria.push({
    factor: 'Work Experience',
    matched: expMatched,
    score: expScore,
    maxScore: 15,
    detail: expDetail,
  });

  // 4. Education Match (10 pts)
  const candEduRank =
    EDUCATION_LEVEL_RANKS[applicant.education?.toUpperCase() || ''] ?? 1;
  const reqEduRank =
    EDUCATION_LEVEL_RANKS[job.educationRequired?.toUpperCase() || ''] ?? 0;
  let eduScore = 0;
  let eduMatched = false;
  let eduDetail = '';

  if (!job.educationRequired || reqEduRank === 0) {
    eduScore = 10;
    eduMatched = true;
    eduDetail = 'No specific minimum education required';
  } else if (candEduRank >= reqEduRank) {
    eduScore = 10;
    eduMatched = true;
    eduDetail = `Applicant qualification meets requirements (${applicant.education || 'Qualified'})`;
  } else {
    eduScore = 4;
    eduMatched = false;
    eduDetail = `Applicant has ${applicant.education || 'lower'} education (requires ${job.educationRequired})`;
  }
  criteria.push({
    factor: 'Education Level',
    matched: eduMatched,
    score: eduScore,
    maxScore: 10,
    detail: eduDetail,
  });

  // 5. Skills Match (15 pts)
  const candSkills = normalizeTokens(applicant.skills);
  const reqSkills = normalizeTokens(job.skillsRequired);
  let skillsScore = 0;
  let skillsMatched = false;
  let skillsDetail = '';

  if (reqSkills.length === 0) {
    skillsScore = 15;
    skillsMatched = true;
    skillsDetail = 'No specific skills required';
  } else {
    const matchedSkills = reqSkills.filter((req) =>
      candSkills.some((cand) => cand.includes(req) || req.includes(cand))
    );
    const ratio = matchedSkills.length / reqSkills.length;
    skillsScore = Math.round(ratio * 15);
    skillsMatched = ratio >= 0.5;
    skillsDetail = `Matched ${matchedSkills.length} of ${reqSkills.length} required skills`;
  }
  criteria.push({
    factor: 'Skills & Competencies',
    matched: skillsMatched,
    score: skillsScore,
    maxScore: 15,
    detail: skillsDetail,
  });

  // 6. Age Suitability (5 pts)
  const age = calculateAge(applicant.dateOfBirth);
  let ageScore = 5;
  let ageMatched = true;
  let ageDetail = 'Age within permissible range';

  if (age !== null && (job.ageMin || job.ageMax)) {
    const min = job.ageMin || 18;
    const max = job.ageMax || 65;
    if (age >= min && age <= max) {
      ageScore = 5;
      ageMatched = true;
      ageDetail = `Candidate age (${age}) is between ${min}-${max} years`;
    } else {
      ageScore = 0;
      ageMatched = false;
      ageDetail = `Candidate age (${age}) outside requested ${min}-${max} range`;
    }
  }
  criteria.push({
    factor: 'Age Eligibility',
    matched: ageMatched,
    score: ageScore,
    maxScore: 5,
    detail: ageDetail,
  });

  // 7. Language Requirements (5 pts)
  const candLangs = normalizeTokens(applicant.languages);
  const reqLangs = normalizeTokens(job.languageRequirements);
  let langScore = 5;
  let langMatched = true;
  let langDetail = 'Language criteria satisfied';

  if (reqLangs.length > 0) {
    const matchedLangs = reqLangs.filter((req) =>
      candLangs.some((cand) => cand.includes(req) || req.includes(cand))
    );
    if (matchedLangs.length >= reqLangs.length) {
      langScore = 5;
      langMatched = true;
      langDetail = `Fluent in required languages (${matchedLangs.join(', ')})`;
    } else if (matchedLangs.length > 0) {
      langScore = 3;
      langMatched = false;
      langDetail = `Partial language match (${matchedLangs.join(', ')})`;
    } else {
      langScore = 0;
      langMatched = false;
      langDetail = `Candidate does not list required languages (${reqLangs.join(', ')})`;
    }
  }
  criteria.push({
    factor: 'Language Proficiency',
    matched: langMatched,
    score: langScore,
    maxScore: 5,
    detail: langDetail,
  });

  // Total Score (Sum of all criteria)
  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);

  let level: 'EXCELLENT' | 'GOOD' | 'POTENTIAL' | 'LOW' = 'LOW';
  let levelLabel = 'Low Match';
  let badgeVariant: 'success' | 'primary' | 'warning' | 'neutral' = 'neutral';

  if (totalScore >= 80) {
    level = 'EXCELLENT';
    levelLabel = 'Excellent Match';
    badgeVariant = 'success';
  } else if (totalScore >= 60) {
    level = 'GOOD';
    levelLabel = 'Good Match';
    badgeVariant = 'primary';
  } else if (totalScore >= 40) {
    level = 'POTENTIAL';
    levelLabel = 'Potential Match';
    badgeVariant = 'warning';
  } else {
    level = 'LOW';
    levelLabel = 'Low Match';
    badgeVariant = 'neutral';
  }

  return {
    score: totalScore,
    level,
    levelLabel,
    badgeVariant,
    criteria,
  };
}

/**
 * Finds top matching active jobs for a given applicant.
 */
export async function getMatchingJobsForApplicant(
  prisma: PrismaClient,
  applicantId: string,
  limit = 5
) {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
  });
  if (!applicant) return [];

  const activeJobs = await prisma.job.findMany({
    where: {
      status: 'PUBLISHED',
    },
    include: {
      country: true,
      jobCategory: true,
      employer: true,
    },
  });

  const scored = activeJobs.map((job) => {
    const match = calculateMatch(applicant, job);
    return {
      job,
      match,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.match.score - a.match.score);
  return scored.slice(0, limit);
}

/**
 * Finds top matching active applicants for a given job.
 */
export async function getMatchingApplicantsForJob(
  prisma: PrismaClient,
  jobId: string,
  limit = 10
) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });
  if (!job) return [];

  const applicants = await prisma.applicant.findMany({
    where: {
      status: { notIn: ['BLACKLISTED', 'DEPARTED', 'INACTIVE'] },
    },
    include: {
      preferredCountry: true,
      preferredJobCategory: true,
    },
  });

  const scored = applicants.map((applicant) => {
    const match = calculateMatch(applicant, job);
    return {
      applicant,
      match,
    };
  });

  scored.sort((a, b) => b.match.score - a.match.score);
  return scored.slice(0, limit);
}
