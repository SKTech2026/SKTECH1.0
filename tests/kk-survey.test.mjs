import assert from "node:assert/strict";
import test from "node:test";
import {
  CIVIL_STATUS, EDUCATION, CLASSIFICATION, WORK_STATUS,
  PWD_CLASSIFICATION, resolveSpecificNeeds,
} from "../src/lib/kk-survey.ts";

test("KK questionnaire includes the picture's demographic choices", () => {
  for (const value of ["Single", "Married", "Widowed", "Divorced", "Separated", "Annulled", "Unknown", "Live-in"]) {
    assert.ok(CIVIL_STATUS.includes(value));
  }
  for (const value of ["Elementary Level", "Elementary Graduate", "High School Level", "High School Graduate", "Vocational Graduate", "College Level", "College Graduate", "Doctorate Level"]) {
    assert.ok(EDUCATION.includes(value));
  }
  for (const value of ["In School Youth", "Out of School Youth", "Working Youth", PWD_CLASSIFICATION]) {
    assert.ok(CLASSIFICATION.includes(value));
  }
  for (const value of ["Employed", "Unemployed", "Self-employed", "Currently looking for a job"]) {
    assert.ok(WORK_STATUS.includes(value));
  }
});

test("direct PWD answer keeps its reporting category; existing specific-needs answers still work", () => {
  assert.equal(resolveSpecificNeeds(PWD_CLASSIFICATION, ""), "Person with Disability");
  assert.equal(resolveSpecificNeeds("Youth with Specific Needs", "Indigenous People"), "Indigenous People");
  assert.equal(resolveSpecificNeeds("Working Youth", ""), null);
});
