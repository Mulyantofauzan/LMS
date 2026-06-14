import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canManageQuestionSet,
  canReviewTrainingGlobally,
  getProposalReadinessError,
  isCertificateEligible,
} from './training-policy';

describe('training proposal readiness', () => {
  it('requires material, valid questions, and a template when certificates are enabled', () => {
    assert.match(getProposalReadinessError({
      materialCount: 0,
      validQuestionSetCount: 1,
      certificateEnabled: false,
      certificateTemplateUrl: null,
    }) ?? '', /materi/);
    assert.match(getProposalReadinessError({
      materialCount: 1,
      validQuestionSetCount: 0,
      certificateEnabled: false,
      certificateTemplateUrl: null,
    }) ?? '', /paket soal/);
    assert.match(getProposalReadinessError({
      materialCount: 1,
      validQuestionSetCount: 1,
      certificateEnabled: true,
      certificateTemplateUrl: null,
    }) ?? '', /Template/);
    assert.equal(getProposalReadinessError({
      materialCount: 1,
      validQuestionSetCount: 1,
      certificateEnabled: true,
      certificateTemplateUrl: '/api/materials/template.png',
    }), null);
  });
});

describe('certificate eligibility', () => {
  it('issues only after an ended class with attendance and a passing post-test', () => {
    assert.equal(isCertificateEligible({
      sessionStatus: 'ended',
      certificateEnabled: true,
      attendanceStatus: 'present',
      posttestScore: 80,
      passingScore: 70,
    }), true);
    assert.equal(isCertificateEligible({
      sessionStatus: 'active',
      certificateEnabled: true,
      attendanceStatus: 'present',
      posttestScore: 80,
      passingScore: 70,
    }), false);
    assert.equal(isCertificateEligible({
      sessionStatus: 'ended',
      certificateEnabled: true,
      attendanceStatus: 'absent',
      posttestScore: 80,
      passingScore: 70,
    }), false);
    assert.equal(isCertificateEligible({
      sessionStatus: 'ended',
      certificateEnabled: true,
      attendanceStatus: 'late',
      posttestScore: 69,
      passingScore: 70,
    }), false);
  });
});

describe('authorization policy', () => {
  it('allows every manager account to review training across sites', () => {
    assert.equal(canReviewTrainingGlobally('manager'), true);
    assert.equal(canReviewTrainingGlobally('super-admin'), true);
    assert.equal(canReviewTrainingGlobally('site-admin'), false);
    assert.equal(canReviewTrainingGlobally('trainer'), false);
  });

  it('limits question-set changes to its creator or a global administrator', () => {
    assert.equal(canManageQuestionSet('trainer', 7, 7), true);
    assert.equal(canManageQuestionSet('trainer', 8, 7), false);
    assert.equal(canManageQuestionSet('site-admin', 8, 7), false);
    assert.equal(canManageQuestionSet('super-admin', 8, 7), true);
  });
});
